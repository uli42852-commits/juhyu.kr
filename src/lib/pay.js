/* 알바 급여 계산 엔진 — UI와 분리된 순수 함수만 둔다.
   모든 금액은 원 단위, 시간은 분 단위로 계산한 뒤 마지막에 변환한다. */
import {
  minWageFor, INSURANCE_2026, BUSINESS_INCOME_TAX, LAW, INSURANCE_SOURCE,
} from './legal.js';

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']; // index 0 = 월요일
const NIGHT_WINDOWS = [[0, 360], [1320, 1800], [2760, 2880]]; // 22:00~06:00 (익일 포함)

export function num(v) {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function parseTime(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const h = Number(m[1]); const mi = Number(m[2]);
  if (h > 24 || mi > 59) return null;
  return h * 60 + mi;
}

/* 출근~퇴근 한 번의 근무를 분석: 총 체류시간, 휴게 제외 근로시간, 그중 야간(22~06시) 근로시간 */
export function analyzeShift({ start, end, breakMin }) {
  const s = parseTime(start); let e = parseTime(end);
  if (s === null || e === null) return { rawMin: 0, paidMin: 0, nightMin: 0, breakMin: 0, valid: false };
  if (e <= s) e += 1440; // 자정을 넘기는 근무
  const rawMin = e - s;
  let nightRaw = 0;
  for (const [a, b] of NIGHT_WINDOWS) nightRaw += Math.max(0, Math.min(e, b) - Math.max(s, a));
  const br = Math.min(Math.max(num(breakMin), 0), rawMin);
  const paidMin = rawMin - br;
  // 휴게시간이 언제였는지 모르므로 주간·야간 비율대로 나눠 뺀다.
  const nightMin = rawMin > 0 ? Math.round((nightRaw * paidMin) / rawMin) : 0;
  return { rawMin, paidMin, nightMin, breakMin: br, valid: true };
}

/* 근로기준법 제54조: 4시간 → 30분 이상, 8시간 → 1시간 이상 휴게 */
export function legalBreakMin(workMin) {
  if (workMin >= 480) return 60;
  if (workMin >= 240) return 30;
  return 0;
}

export function daySchedule(input, w) {
  if (input.perDay && input.daySchedules && input.daySchedules[w]) {
    const d = input.daySchedules[w];
    if (parseTime(d.start) !== null && parseTime(d.end) !== null) return d;
  }
  return { start: input.start, end: input.end, breakMin: input.breakMin };
}

export function toKey(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/* JS getDay(0=일)를 월요일 시작 인덱스로 */
function mondayIndex(date) { return (date.getDay() + 6) % 7; }

function isScheduled(input, date, inMonth) {
  const w = mondayIndex(date);
  if (inMonth && input.overrides) {
    const o = input.overrides[toKey(date.getFullYear(), date.getMonth() + 1, date.getDate())];
    if (o === 'off') return false;
    if (o === 'on') return true;
  }
  return !!input.days[w];
}

function dayResult(input, date, inMonth) {
  if (!isScheduled(input, date, inMonth)) return null;
  const w = mondayIndex(date);
  return { w, ...analyzeShift(daySchedule(input, w)) };
}

const floor10 = (n) => Math.floor(n / 10) * 10;
const round = (n) => Math.round(n);

/* ── 핵심: 기간 급여 계산 ─────────────────────────────── */
export function calculatePay(input) {
  const wage = num(input.wage);
  const period = input.period === 'week' ? 'week' : 'month';
  const year = Number(input.year) || 2026;
  const month = Number(input.month) || 1;
  const workplace = input.workplace || 'unknown';

  const days = []; // 이번 기간에 실제로 급여가 발생하는 근무일
  const weeks = []; // 주휴·주 단위 연장근로 판단용 주

  if (period === 'week') {
    const wk = { label: '한 주', days: [] };
    for (let w = 0; w < 7; w += 1) {
      if (!input.days[w]) continue;
      const r = { w, label: WEEKDAYS[w], ...analyzeShift(daySchedule(input, w)) };
      wk.days.push(r); days.push(r);
    }
    weeks.push(wk);
  } else {
    const last = new Date(year, month, 0).getDate();
    for (let d = 1; d <= last; d += 1) {
      const date = new Date(year, month - 1, d);
      const r = dayResult(input, date, true);
      if (r) days.push({ ...r, date: toKey(year, month, d), label: `${month}/${d}` });
      // 일요일(주의 마지막 날)이 이 달에 있는 주 → 이번 달 주휴수당으로 계산
      if (mondayIndex(date) === 6) {
        const first = new Date(year, month - 1, d - 6);
        const wk = { label: `${first.getMonth() + 1}/${first.getDate()}~${month}/${d}`, days: [] };
        for (let k = 6; k >= 0; k -= 1) {
          const dd = new Date(year, month - 1, d - k);
          const inMonth = dd.getMonth() === month - 1;
          const rr = dayResult(input, dd, inMonth);
          if (rr) wk.days.push(rr);
        }
        weeks.push(wk);
      }
    }
  }

  const scheduledWeeklyHours = (() => {
    let m = 0;
    for (let w = 0; w < 7; w += 1) if (input.days[w]) m += analyzeShift(daySchedule(input, w)).paidMin;
    return m / 60;
  })();

  return summarizePay({
    wage, period, year, month, workplace, days, weeks, scheduledWeeklyHours,
    extraHours: input.extraHours, deduction: input.deduction, fullAttendance: input.fullAttendance, mode: 'schedule',
  });
}

const sumMin = (arr, k) => arr.reduce((s, x) => s + (x[k] || 0), 0);

/* ── 근무 기록(알바비 추적) 기반 계산 ─────────────────── */
function dateOf(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/* 하루 기록의 예상 금액 — 주휴수당은 주 단위라 여기서는 빠진다 */
export function logAmounts(log, wage, workplace = 'unknown') {
  const shift = analyzeShift(log);
  const w = num(wage);
  const base = round(w * shift.paidMin / 60);
  const nightRaw = round(w * shift.nightMin / 60 * 0.5);
  const overRaw = round(w * Math.max(0, shift.paidMin - 480) / 60 * 0.5);
  const applies = workplace === 'over5';
  return {
    ...shift,
    base,
    night: applies ? nightRaw : 0,
    overtime: applies ? overRaw : 0,
    nightIfOver5: nightRaw,
    overtimeIfOver5: overRaw,
    total: base + (applies ? nightRaw + overRaw : 0),
  };
}

/**
 * 실제 근무 기록으로 한 달 예상 급여를 계산한다.
 * logs: [{ date: 'YYYY-MM-DD', start, end, breakMin }]
 * 주는 월~일, 일요일이 이 달에 있는 주의 주휴수당을 이 달에 넣는다(스케줄 계산기와 같은 규칙).
 */
export function calculateLogged({ wage, year, month, workplace = 'unknown', deduction = 'none', logs = [] }) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const byDate = new Map();
  logs.forEach((l) => { if (l && l.date) byDate.set(l.date, l); });
  const toDay = (l) => {
    const dt = dateOf(l.date);
    return { w: mondayIndex(dt), date: l.date, label: `${dt.getMonth() + 1}/${dt.getDate()}`, ...analyzeShift(l) };
  };
  const days = [...byDate.values()].filter((l) => l.date.startsWith(prefix)).sort((a, b) => a.date.localeCompare(b.date)).map(toDay);
  const weeks = [];
  const last = new Date(year, month, 0).getDate();
  for (let d = 1; d <= last; d += 1) {
    const date = new Date(year, month - 1, d);
    if (mondayIndex(date) !== 6) continue;
    const first = new Date(year, month - 1, d - 6);
    const wk = { label: `${first.getMonth() + 1}/${first.getDate()}~${month}/${d}`, start: toKey(first.getFullYear(), first.getMonth() + 1, first.getDate()), end: toKey(year, month, d), days: [] };
    for (let k = 6; k >= 0; k -= 1) {
      const dd = new Date(year, month - 1, d - k);
      const l = byDate.get(toKey(dd.getFullYear(), dd.getMonth() + 1, dd.getDate()));
      if (l) wk.days.push(toDay(l));
    }
    weeks.push(wk);
  }
  const weekCount = weeks.length || 1;
  const scheduledWeeklyHours = weeks.reduce((s, wk) => s + sumMin(wk.days, 'paidMin'), 0) / 60 / weekCount;
  return summarizePay({
    wage: num(wage), period: 'month', year, month, workplace, days, weeks, scheduledWeeklyHours,
    extraHours: 0, deduction, fullAttendance: true, mode: 'log',
  });
}



/* 근무일·주 목록 → 항목별 금액. 스케줄 계산기와 근무 기록(알바비 추적)이 같은 함수를 쓴다. */
export function summarizePay({
  wage, period, year, month, workplace = 'unknown', days, weeks, scheduledWeeklyHours,
  extraHours: extraRaw, deduction, fullAttendance, mode = 'schedule',
}) {
  const premiumRate = 0.5;
  const workMin = sumMin(days, 'paidMin');
  const nightMin = sumMin(days, 'nightMin');
  const dailyOverMin = days.reduce((s, x) => s + Math.max(0, x.paidMin - 480), 0);

  let juhyuWeeks = 0; let juhyuMin = 0; let weeklyOverMin = 0;
  const weekRows = weeks.map((wk) => {
    const wMin = sumMin(wk.days, 'paidMin');
    const wDailyOver = wk.days.reduce((s, x) => s + Math.max(0, x.paidMin - 480), 0);
    const over40 = Math.max(0, wMin - 2400 - wDailyOver);
    weeklyOverMin += over40;
    const eligible = wMin >= 900 && fullAttendance !== false;
    const jMin = eligible ? Math.min(wMin, 2400) / 2400 * 480 : 0;
    if (eligible) { juhyuWeeks += 1; juhyuMin += jMin; }
    return { label: wk.label, start: wk.start, end: wk.end, hours: wMin / 60, eligible, juhyuHours: jMin / 60, juhyuPay: round(wage * jMin / 60) };
  });

  const extraHours = Math.max(0, num(extraRaw));
  const workHours = workMin / 60;
  const nightHours = nightMin / 60;
  const overHours = (dailyOverMin + weeklyOverMin) / 60 + extraHours;
  const juhyuHours = juhyuMin / 60;

  const minWage = minWageFor(year);
  const premiumApplies = workplace === 'over5';
  const premiumUnknown = workplace === 'unknown';

  const items = [];
  items.push({
    key: 'base', label: '기본급', amount: round(wage * workHours), included: true,
    formula: `${fmt(wage)}원 × ${h(workHours)}시간`,
    why: `근무한 날의 (퇴근 − 출근 − 휴게시간)을 모두 더한 ${h(workHours)}시간에 시급을 곱했어요. 휴게시간은 근로시간에 포함되지 않아 무급이에요.`,
    basis: LAW.breakTime,
  });
  if (extraHours > 0) {
    items.push({
      key: 'extra', label: '추가근무 기본분', amount: round(wage * extraHours), included: true,
      formula: `${fmt(wage)}원 × ${h(extraHours)}시간`,
      why: '스케줄 외에 더 일한 시간도 시급만큼은 기본으로 받아야 해요. 가산분(50%)은 아래 연장근로 항목에서 따로 계산해요.',
    });
  }

  const juhyuWhy = mode === 'log'
    ? `기록한 근무를 월~일 한 주 단위로 묶어, 주 15시간 이상인 주마다 하루치 임금(주 근무시간 ÷ 40 × 8시간, 최대 8시간)을 예상했어요. ${weeks.length}주 중 ${juhyuWeeks}주가 해당돼요. 실제 주휴수당은 근로계약상 소정근로시간과 개근 여부로 판단하니, 결근한 주가 있었다면 달라질 수 있어요.`
    : fullAttendance === false
    ? '결근이 있다고 선택해서 주휴수당을 0원으로 계산했어요. 주휴수당은 그 주 소정근로일을 개근해야 발생해요.'
    : scheduledWeeklyHours < 15
      ? `한 주 근무시간이 ${h(scheduledWeeklyHours)}시간으로 15시간 미만이에요. 4주 평균 주 15시간 미만인 초단시간 근로자는 주휴수당 대상이 아니에요.`
      : `주 15시간 이상 일하고 개근한 주마다 하루치 임금(주 근무시간 ÷ 40 × 8시간, 최대 8시간)을 받아요. ${period === 'month' ? `이번 달에 끝나는 ${weeks.length}주 중 ${juhyuWeeks}주가 조건을 채워요.` : ''} 사업장 규모(5인 미만 포함)와 상관없이 적용돼요.`;
  items.push({
    key: 'juhyu', label: '주휴수당', amount: round(wage * juhyuHours), included: true,
    formula: juhyuWeeks > 0 ? `${fmt(wage)}원 × 주휴 ${h(juhyuHours)}시간 (${juhyuWeeks}주)` : '조건 미충족 → 0원',
    why: juhyuWhy, basis: LAW.juhyu,
  });

  const premiumWhyTail = premiumApplies
    ? '상시 5인 이상 사업장이라고 선택해서 합계에 포함했어요.'
    : premiumUnknown
      ? '사업장 규모를 모른다고 선택해서 합계에는 넣지 않았어요. 5인 이상이면 이만큼 더 받을 수 있어요.'
      : '상시 5인 미만 사업장은 이 가산수당 규정이 적용되지 않아 0원으로 계산했어요.';
  const nightAmount = round(wage * nightHours * premiumRate);
  items.push({
    key: 'night', label: '야간근로 가산', amount: premiumApplies || premiumUnknown ? nightAmount : 0,
    included: premiumApplies, conditional: premiumUnknown && nightAmount > 0,
    formula: nightHours > 0 ? `${fmt(wage)}원 × ${h(nightHours)}시간 × 50%` : '밤 10시~새벽 6시 근무 없음',
    why: nightHours > 0
      ? `밤 10시~새벽 6시 사이 근로 ${h(nightHours)}시간에 시급의 50%를 더해요(휴게시간은 주간·야간 비율로 나눠 뺐어요). ${premiumWhyTail}`
      : '입력한 근무시간 중 밤 10시~새벽 6시 사이 근무가 없어요.',
    basis: LAW.premium,
  });
  const overAmount = round(wage * overHours * premiumRate);
  items.push({
    key: 'overtime', label: '연장근로 가산', amount: premiumApplies || premiumUnknown ? overAmount : 0,
    included: premiumApplies, conditional: premiumUnknown && overAmount > 0,
    formula: overHours > 0 ? `${fmt(wage)}원 × ${h(overHours)}시간 × 50%` : '하루 8시간·주 40시간 초과 없음',
    why: overHours > 0
      ? `하루 8시간 또는 주 40시간을 넘긴 시간${extraHours > 0 ? '과 입력한 추가근무 시간' : ''}에 시급의 50%를 더해요. 단시간 근로자는 계약한 시간을 넘긴 근무도 가산 대상이 될 수 있어요. ${premiumWhyTail}`
      : '하루 8시간, 주 40시간을 넘긴 근무나 추가근무가 없어요.',
    basis: overHours > 0 ? LAW.partTimeOver : LAW.premium,
  });

  const gross = items.filter((i) => i.included).reduce((s, i) => s + i.amount, 0);
  const conditionalExtra = items.filter((i) => i.conditional).reduce((s, i) => s + i.amount, 0);
  const deductions = calcDeductions(gross, deduction);
  const deductTotal = deductions.reduce((s, d) => s + d.amount, 0);

  const warnings = [];
  if (wage > 0 && wage < minWage) {
    warnings.push({
      level: 'danger',
      text: `입력한 시급 ${fmt(wage)}원은 ${year}년 최저임금(${fmt(minWage)}원)보다 낮아요. 수습 3개월 감액 등 예외가 있는지 근로계약서를 확인해보세요.`,
    });
  }
  const breakIssues = new Set();
  days.forEach((d) => {
    const need = legalBreakMin(d.paidMin);
    if (d.valid && d.breakMin < need) breakIssues.add(d.date && mode === 'log' ? d.label : `${WEEKDAYS[d.w]}요일`);
  });
  if (breakIssues.size) {
    warnings.push({
      level: 'info',
      text: `${[...breakIssues].join('·')} 휴게시간이 법정 기준(4시간 근무 시 30분, 8시간 근무 시 1시간 이상)보다 짧게 입력됐어요. 실제로 쉬었는지 확인해보세요.`,
    });
  }
  if (days.length === 0 && mode === 'schedule') warnings.push({ level: 'info', text: '근무하는 요일을 하나 이상 선택해주세요.' });

  return {
    wage, period, year, month, minWage, workplace,
    workDays: days.length, workHours, nightHours, overHours, extraHours, juhyuHours, juhyuWeeks,
    scheduledWeeklyHours, weekRows, days,
    items, gross, conditionalExtra, deductions, deductTotal, net: gross - deductTotal, warnings,
  };
}

export function calcDeductions(gross, type) {
  if (type === 'tax33') {
    const income = floor10(gross * 0.03);
    const local = floor10(income * 0.1);
    return [
      { key: 'incomeTax', label: '사업소득세 3%', amount: income, why: '프리랜서(사업소득)로 신고되는 경우 지급액의 3%를 원천징수해요.' },
      { key: 'localTax', label: '지방소득세 0.3%', amount: local, why: '소득세의 10%가 지방소득세로 함께 빠져요.' },
    ];
  }
  if (type === 'insurance') {
    const r = INSURANCE_2026;
    const health = floor10(gross * r.health);
    return [
      { key: 'pension', label: '국민연금 4.75%', amount: floor10(gross * r.pension), why: '2026년 국민연금 보험료율 9.5% 중 근로자 부담 절반이에요. 월 60시간 미만 근로 등 가입 대상이 아니면 빠질 수 있어요.', basis: INSURANCE_SOURCE },
      { key: 'health', label: '건강보험 3.595%', amount: health, why: '2026년 건강보험료율 7.19% 중 근로자 부담 절반이에요.', basis: INSURANCE_SOURCE },
      { key: 'ltc', label: '장기요양 (건강보험료×13.14%)', amount: floor10(health * r.longTermCareOfHealth), why: '장기요양보험료는 건강보험료에 13.14%를 곱해 함께 걷어요.', basis: INSURANCE_SOURCE },
      { key: 'employment', label: '고용보험 0.9%', amount: floor10(gross * r.employment), why: '고용보험(실업급여) 근로자 부담분이에요.', basis: INSURANCE_SOURCE },
    ];
  }
  return [];
}

/* ── 급여 검증: 예상 금액과 실제 금액 비교 ────────────────── */
export function comparePay(result, actualRaw, basis) {
  const actual = num(actualRaw);
  if (!actual) return null;
  const expected = basis === 'gross' ? result.gross : result.net;
  const diff = expected - actual; // +면 덜 받음
  const tol = Math.max(1000, expected * 0.005);
  const status = Math.abs(diff) <= tol ? 'match' : diff > 0 ? 'less' : 'more';
  const abs = Math.abs(diff);
  const near = (amt) => amt > 0 && Math.abs(abs - amt) <= Math.max(1000, amt * 0.03);

  const hints = [];
  if (status !== 'match') {
    result.items.forEach((it) => {
      if (near(it.amount)) hints.push(`차이 금액이 예상 ${it.label}(${fmt(it.amount)}원)과 거의 같아요. 이 항목이 ${status === 'less' ? '빠졌는지' : '예상과 다르게 들어갔는지'} 명세서에서 확인해보세요.`);
    });
    if (result.juhyuWeeks > 1 && result.items[0] && result.juhyuHours > 0) {
      const perWeek = result.wage * (result.juhyuHours / result.juhyuWeeks);
      const n = Math.round(abs / perWeek);
      if (n >= 1 && n < result.juhyuWeeks && Math.abs(abs - perWeek * n) <= Math.max(1000, perWeek * 0.05)) {
        hints.push(`차이가 주휴수당 ${n}주치(주당 약 ${fmt(round(perWeek))}원)와 비슷해요. 몇 주가 주휴수당 조건에서 빠졌는지 확인해보세요.`);
      }
    }
    if (basis === 'net' && near(result.deductTotal)) hints.push(`차이가 예상 공제액(${fmt(result.deductTotal)}원)과 비슷해요. 공제 방식(3.3%·4대보험)이 선택한 것과 다를 수 있어요.`);
    if (basis === 'net' && result.deductTotal === 0) {
      const tax = floor10(result.gross * 0.03) + floor10(floor10(result.gross * 0.03) * 0.1);
      if (near(tax)) hints.push(`차이가 세전 금액의 3.3%(${fmt(tax)}원)와 거의 같아요. 급여에서 3.3%가 공제됐을 가능성이 있어요.`);
    }
    if (result.wage > 0 && hints.length === 0) {
      const hrs = abs / result.wage;
      if (hrs >= 0.5 && Math.abs(hrs * 2 - Math.round(hrs * 2)) < 0.08) {
        hints.push(`차이는 시급 약 ${h(Math.round(hrs * 2) / 2)}시간분이에요. 근무시간 기록(출퇴근 시간, 휴게시간)이 명세서와 같은지 비교해보세요.`);
      }
    }
  }

  const checks = status === 'less' ? [
    '실제 출퇴근 기록과 명세서의 근무시간이 같은지',
    '휴게시간이 실제보다 길게 빠지지 않았는지',
    '주 15시간 이상·개근 주의 주휴수당이 반영됐는지',
    '밤 10시 이후 근무가 있었다면 야간근로 가산이 반영됐는지 (5인 이상 사업장)',
    '어떤 공제 항목이 얼마나 빠졌는지 (3.3%, 4대보험, 기타 공제)',
    '급여 기간(몇 일~몇 일)이 내가 생각한 기간과 같은지',
  ] : status === 'more' ? [
    '예상에 넣지 않은 수당(추가근무, 인센티브 등)이 포함됐는지',
    '급여 기간이 예상보다 길게 잡혔는지',
    '지난달 미지급분이 함께 들어왔는지',
  ] : [];

  return { actual, expected, diff, abs, status, hints, checks, basis };
}

/* ── 월 환산·시급 환산 도우미 ─────────────────────────── */
export const WEEKS_PER_MONTH = 365 / 7 / 12; // ≈ 4.345

export function monthlyFromWeekly(weeklyHours, wage) {
  const juhyuH = weeklyHours >= 15 ? Math.min(weeklyHours, 40) / 40 * 8 : 0;
  // 최저임금 월 환산(209시간)과 같은 방식으로 월 유급시간은 정수로 반올림한다.
  const paidHours = Math.round((weeklyHours + juhyuH) * WEEKS_PER_MONTH);
  return { juhyuH, paidHours, monthly: round(wage * paidHours), weeklyPay: round(wage * (weeklyHours + juhyuH)) };
}

export function fmt(n) { return Math.round(n).toLocaleString('ko-KR'); }
export function won(n) { return `${fmt(n)}원`; }
export function h(x) {
  const v = Math.round(x * 100) / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, '');
}
