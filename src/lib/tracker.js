/* 알바비 추적 — 데이터 모델과 분석(순수 함수).
   저장은 localStorage 한 키(TRACKER_KEY)에 버전과 함께 둔다. 사진만 용량 때문에 별도 키.
   계산은 pay.js의 calculateLogged/logAmounts를 그대로 쓴다(로직 중복 금지). */
import { calculateLogged, logAmounts, analyzeShift, legalBreakMin, toKey, num, fmt, h, calcDeductions, WEEKDAYS } from './pay.js';
import { minWageFor } from './legal.js';

export const TRACKER_KEY = 'juhyu-tracker-v1';
export const PHOTO_PREFIX = 'juhyu-photo-';

export const EMPTY_TRACKER = { version: 1, activeId: null, workplaces: [], logs: [], payments: [], payslips: [] };

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function ymOf(dateKey) { return dateKey.slice(0, 7); }
export function ymParts(ym) { const [y, m] = ym.split('-').map(Number); return { year: y, month: m }; }
export function ymShift(ym, delta) {
  const { year, month } = ymParts(ym);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
export function todayKey(now = new Date()) { return toKey(now.getFullYear(), now.getMonth() + 1, now.getDate()); }
export function ymLabel(ym) { const { year, month } = ymParts(ym); return `${year}년 ${month}월`; }
export function dateLabel(key) {
  const [y, m, d] = key.split('-').map(Number);
  const w = WEEKDAYS[(new Date(y, m - 1, d).getDay() + 6) % 7];
  return `${m}월 ${d}일 (${w})`;
}
export function minutesLabel(min) {
  const hh = Math.floor(min / 60); const mm = Math.round(min % 60);
  if (!hh) return `${mm}분`;
  return mm ? `${hh}시간 ${mm}분` : `${hh}시간`;
}

/* 월급날이 N일이면 보통 "지난달 근무분"을 준다. 입금일 기준으로 몇 월 급여인지 기본값을 추정한다. */
export function defaultPayMonth(depositDate) {
  return ymShift(ymOf(depositDate), -1);
}

export function newWorkplace(fields) {
  return {
    id: uid(),
    name: '내 알바',
    wage: '10320',
    payday: '10',
    startDate: '',
    endDate: '',
    start: '17:00',
    end: '22:00',
    breakMin: '30',
    days: [true, false, true, false, true, false, false],
    size: 'unknown',
    deduction: 'none',
    createdAt: new Date().toISOString(),
    ...fields,
  };
}

/* 저장 시점의 계산 결과도 기록에 남겨둔다(나중에 시급을 바꿔도 당시 값을 볼 수 있게). 화면은 항상 현재 조건으로 다시 계산한다. */
export function makeLog(workplace, fields, existing) {
  const calc = logAmounts(fields, workplace.wage, workplace.size);
  const now = new Date().toISOString();
  return {
    id: existing ? existing.id : uid(),
    workplaceId: workplace.id,
    date: fields.date,
    start: fields.start,
    end: fields.end,
    breakMin: String(fields.breakMin ?? '0'),
    memo: fields.memo || '',
    hasPhoto: !!fields.hasPhoto,
    calc: { paidMin: calc.paidMin, nightMin: calc.nightMin, base: calc.base, night: calc.night, overtime: calc.overtime, total: calc.total, wage: num(workplace.wage) },
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };
}

export function logsOf(state, wpId) { return state.logs.filter((l) => l.workplaceId === wpId); }
export function paymentsOf(state, wpId, ym) { return state.payments.filter((p) => p.workplaceId === wpId && (!ym || p.month === ym)); }
export function payslipOf(state, wpId, ym) { return state.payslips.find((p) => p.workplaceId === wpId && p.month === ym) || null; }

/* ── 한 달 요약: 예상 vs 실제 ─────────────────────────── */
export function monthSummary(state, wp, ym) {
  const { year, month } = ymParts(ym);
  const logs = logsOf(state, wp.id);
  const calc = calculateLogged({ wage: wp.wage, year, month, workplace: wp.size, deduction: wp.deduction, logs });
  const monthLogs = logs.filter((l) => l.date.startsWith(ym)).sort((a, b) => a.date.localeCompare(b.date));
  const payments = paymentsOf(state, wp.id, ym).sort((a, b) => a.date.localeCompare(b.date));
  const received = payments.reduce((s, p) => s + num(p.amount), 0);
  const basis = payments.length ? (payments[payments.length - 1].basis || 'net') : (wp.deduction === 'none' ? 'gross' : 'net');
  const expected = basis === 'gross' ? calc.gross : calc.net;
  const diff = payments.length ? expected - received : 0; // +면 예상보다 적게 받음
  const tol = Math.max(1000, expected * 0.005);
  const status = !payments.length ? 'waiting' : Math.abs(diff) <= tol ? 'match' : diff > 0 ? 'less' : 'more';
  return {
    ym, year, month, wp, calc, logs: monthLogs, payments, received, expected, basis, diff, abs: Math.abs(diff), status,
    workMin: monthLogs.reduce((s, l) => s + analyzeShift(l).paidMin, 0),
    nightLogs: monthLogs.filter((l) => analyzeShift(l).nightMin > 0),
    overLogs: monthLogs.filter((l) => analyzeShift(l).paidMin > 480),
  };
}

/* ── 확인이 필요한 항목 찾기 ─────────────────────────────
   법 위반 여부를 판단하지 않는다. "차이가 있다 / 이 기록을 확인해보라"까지만. */
export function detectIssues(summary, { today = todayKey(), payslipAnalysis = null } = {}) {
  const { calc, wp, logs, status, abs, basis } = summary;
  const wage = num(wp.wage);
  const items = [];
  const near = (amt) => amt > 0 && Math.abs(abs - amt) <= Math.max(500, amt * 0.03);

  if (status === 'less' || status === 'more') {
    // 하루치 금액과 비슷한 차이 → 그 날 기록이 반영됐는지
    const dayHits = logs.map((l) => ({ l, a: logAmounts(l, wage, wp.size) })).filter(({ a }) => near(a.total)).slice(0, 3);
    dayHits.forEach(({ l, a }) => items.push({
      key: `day-${l.date}`, tone: 'check', date: l.date,
      title: `${dateLabel(l.date)} 근무`,
      lines: [`기록: ${l.start}~${l.end} · ${minutesLabel(a.paidMin)}`, `예상 ${fmt(a.total)}원 — 차이 금액과 비슷해요. 이 날 근무가 급여에 반영됐는지 확인해보세요.`],
    }));

    // 주휴수당과 비슷한 차이
    const juhyu = calc.items.find((i) => i.key === 'juhyu');
    const eligibleWeeks = calc.weekRows.filter((w) => w.eligible);
    const weekHit = eligibleWeeks.find((w) => near(w.juhyuPay));
    if (juhyu && (near(juhyu.amount) || weekHit)) {
      items.push({
        key: 'juhyu', tone: 'check', title: '주휴수당',
        lines: [
          weekHit ? `${weekHit.label} 주(기록 ${h(weekHit.hours)}시간)의 예상 주휴수당 ${fmt(weekHit.juhyuPay)}원과 차이가 비슷해요.` : `차이가 이번 달 예상 주휴수당 ${fmt(juhyu.amount)}원과 비슷해요.`,
          '해당 주 근무 조건(주 15시간 이상, 정해진 근무일 개근)을 다시 확인해보세요.',
        ],
      });
    }

    // 공제
    if (basis === 'net' && calc.deductTotal > 0 && near(calc.deductTotal)) {
      items.push({ key: 'deduct', tone: 'check', title: '공제', lines: [`차이가 예상 공제액(${fmt(calc.deductTotal)}원)과 비슷해요. 실제 공제 방식이 설정과 다를 수 있어요.`] });
    } else if (status === 'less' && calc.deductTotal === 0) {
      const t33 = calcDeductions(calc.gross, 'tax33').reduce((s, d) => s + d.amount, 0);
      if (near(t33)) items.push({ key: 'deduct33', tone: 'check', title: '공제', lines: [`차이가 세전 예상 금액의 3.3%(${fmt(t33)}원)와 거의 같아요. 실제 입금액에 3.3% 공제가 반영됐을 수 있어요.`, '설정에서 공제 방식을 바꾸면 예상 금액도 함께 바뀌어요.'] });
    } else if (status === 'less' && basis === 'net') {
      items.push({ key: 'deduct-generic', tone: 'info', title: '공제', lines: ['실제 입금액에 공제(3.3%, 4대보험, 기타)가 반영되었을 수 있어요. 급여명세서의 공제 항목을 확인해보세요.'] });
    }

    // 시급 몇 시간분
    if (!items.some((i) => i.tone === 'check') && wage > 0) {
      const hrs = abs / wage;
      if (hrs >= 0.5 && Math.abs(hrs * 2 - Math.round(hrs * 2)) < 0.08) {
        items.push({ key: 'hours', tone: 'check', title: '근무시간', lines: [`차이는 시급 약 ${h(Math.round(hrs * 2) / 2)}시간분이에요. 기록한 출퇴근·휴게시간과 사업장 기록이 같은지 비교해보세요.`] });
      }
    }

    // 야간·연장 기록
    if (summary.nightLogs.length && wp.size !== 'under5') {
      const list = summary.nightLogs.slice(0, 4).map((l) => dateLabel(l.date).replace(/ \(.\)/, '')).join(', ');
      items.push({
        key: 'night', tone: wp.size === 'over5' ? 'check' : 'info', title: '야간근로',
        lines: [`22시 이후 근무 기록이 ${summary.nightLogs.length}회 있어요 (${list}${summary.nightLogs.length > 4 ? ' 등' : ''}).`, wp.size === 'over5' ? '야간 가산(50%)이 급여에 반영됐는지 확인해보세요.' : '상시 5인 이상 사업장이면 야간 가산(50%)이 붙어요. 사업장 규모를 확인해보세요.'],
      });
    }
    if (summary.overLogs.length && wp.size !== 'under5') {
      items.push({ key: 'over', tone: 'info', title: '연장근로', lines: [`하루 8시간을 넘긴 근무 기록이 ${summary.overLogs.length}회 있어요. 5인 이상 사업장이면 연장 가산이 붙어요.`] });
    }
  }

  // 명세서와 항목별 차이
  if (payslipAnalysis) {
    payslipAnalysis.rows.filter((r) => Math.abs(r.diff) > Math.max(1000, r.expected * 0.01)).forEach((r) => items.push({
      key: `slip-${r.label}`, tone: 'check', title: `급여명세서 · ${r.label}`,
      lines: [`명세서 ${fmt(r.actual)}원 / 내 기록 기준 ${fmt(r.expected)}원 (차이 ${fmt(Math.abs(r.diff))}원)`],
    }));
  }

  // 기록 자체 점검 (입금 여부와 상관없이)
  const missing = missingScheduledDays(summary, today);
  if (missing.length) {
    items.push({
      key: 'missing', tone: 'info', title: `기록이 없는 근무 예정일 ${missing.length}일`,
      lines: [`${missing.slice(0, 5).map((d) => dateLabel(d).replace(/ \(.\)/, '')).join(', ')}${missing.length > 5 ? ' 등' : ''}`, '쉬는 날이었다면 괜찮아요. 일했는데 기록을 안 했다면 예상 금액이 적게 계산돼요.'],
    });
  }
  const shortBreak = logs.filter((l) => { const a = analyzeShift(l); return a.valid && a.breakMin < legalBreakMin(a.paidMin); });
  if (shortBreak.length) {
    items.push({ key: 'break', tone: 'info', title: '휴게시간', lines: [`${shortBreak.length}일의 휴게시간이 법정 기준(4시간 30분, 8시간 1시간)보다 짧게 기록됐어요. 실제로 쉰 시간이 맞는지 확인해보세요.`] });
  }
  const nearJuhyu = calc.weekRows.filter((w) => w.hours >= 12 && w.hours < 15);
  if (nearJuhyu.length) {
    items.push({ key: 'near15', tone: 'info', title: '주 15시간 근처인 주', lines: [`${nearJuhyu.map((w) => `${w.label}(${h(w.hours)}시간)`).join(', ')} — 주휴수당 기준(15시간) 바로 아래예요. 기록 누락이 없는지 확인해보세요.`] });
  }
  if (num(wp.wage) > 0 && num(wp.wage) < minWageFor(summary.year)) {
    items.push({ key: 'minwage', tone: 'check', title: '시급', lines: [`설정한 시급 ${fmt(num(wp.wage))}원이 ${summary.year}년 최저임금(${fmt(minWageFor(summary.year))}원)보다 낮아요. 근로계약서의 시급을 확인해보세요.`] });
  }
  return items;
}

export function missingScheduledDays(summary, today) {
  const { wp, year, month, logs } = summary;
  if (!wp.days || !wp.days.some(Boolean)) return [];
  const logged = new Set(logs.map((l) => l.date));
  const last = new Date(year, month, 0).getDate();
  const out = [];
  for (let d = 1; d <= last; d += 1) {
    const key = toKey(year, month, d);
    if (key >= today) break;
    if (wp.startDate && key < wp.startDate) continue;
    if (wp.endDate && key > wp.endDate) continue;
    const w = (new Date(year, month - 1, d).getDay() + 6) % 7;
    if (wp.days[w] && !logged.has(key)) out.push(key);
  }
  return out;
}

/* ── 사장님께 보낼 확인 메시지 — 중립·사실 중심 ───────── */
export function buildAskMessage(summary, issues = []) {
  const { month, calc, received, abs, status, logs } = summary;
  const hours = h(calc.workHours);
  const lines = [
    '안녕하세요. 이번에 받은 급여 관련해서 확인드릴 게 있어서 연락드립니다.',
    '',
  ];
  if (status === 'less' || status === 'more') {
    lines.push(`제가 기록한 ${month}월 근무시간(${logs.length}일, 총 ${hours}시간)을 기준으로 계산했을 때 예상 금액과 실제 입금액(${fmt(received)}원) 사이에 약 ${fmt(abs)}원 정도 차이가 있어서요.`);
  } else {
    lines.push(`제가 기록한 ${month}월 근무시간(${logs.length}일, 총 ${hours}시간)과 급여 계산 내역을 한번 맞춰보고 싶어서요.`);
  }
  const topics = issues.filter((i) => i.tone === 'check').slice(0, 3).map((i) => i.title);
  if (topics.length) lines.push(`특히 ${topics.join(', ')} 부분이 어떻게 계산됐는지 궁금합니다.`);
  lines.push('');
  lines.push('혹시 급여 계산 내역(급여명세서)을 한번 확인해주실 수 있을까요? 제가 잘못 기록한 부분이 있을 수도 있어서 같이 확인해보고 싶습니다.');
  lines.push('');
  lines.push('감사합니다!');
  return lines.join('\n');
}

/* ── 전체 정산 (퇴사 전) ───────────────────────────── */
export function monthsCovered(state, wp, today = todayKey()) {
  const logs = logsOf(state, wp.id);
  const pays = paymentsOf(state, wp.id);
  const keys = [...logs.map((l) => ymOf(l.date)), ...pays.map((p) => p.month)];
  if (wp.startDate) keys.push(ymOf(wp.startDate));
  if (!keys.length) return [ymOf(today)];
  const first = keys.sort()[0];
  const lastKey = [...keys, ymOf(wp.endDate && wp.endDate < today ? wp.endDate : today)].sort().pop();
  const out = [];
  for (let ym = first; ym <= lastKey; ym = ymShift(ym, 1)) out.push(ym);
  return out;
}

export function settlement(state, wp, today = todayKey()) {
  const months = monthsCovered(state, wp, today).map((ym) => {
    const s = monthSummary(state, wp, ym);
    const issues = detectIssues(s, { today });
    return { ...s, issues, checkCount: issues.filter((i) => i.tone === 'check').length };
  });
  const sum = (k) => months.reduce((a, m) => a + m[k], 0);
  const logs = logsOf(state, wp.id).sort((a, b) => a.date.localeCompare(b.date));
  return {
    months,
    workDays: logs.length,
    workMin: sum('workMin'),
    expected: sum('expected'),
    received: sum('received'),
    diffPaidMonths: months.filter((m) => m.payments.length).reduce((a, m) => a + m.diff, 0),
    unpaidMonths: months.filter((m) => !m.payments.length && m.logs.length),
    checkCount: months.reduce((a, m) => a + m.checkCount, 0),
    memos: logs.filter((l) => l.memo),
    payslips: state.payslips.filter((p) => p.workplaceId === wp.id),
    logs,
  };
}

/* 리포트 텍스트 (복사·공유용) */
export function reportText(summary, issues) {
  const bar = '━━━━━━━━━━━━━━';
  const L = [bar, `${summary.month}월 알바비 리포트 · ${summary.wp.name}`, bar,
    `총 근무일 ${summary.logs.length}일`,
    `총 근무시간 ${minutesLabel(summary.workMin)}`,
    `예상 급여 ${fmt(summary.expected)}원 (${summary.basis === 'gross' ? '세전' : '공제 후'})`,
    `실제 입금액 ${summary.payments.length ? `${fmt(summary.received)}원` : '아직 입력 안 함'}`,
  ];
  if (summary.payments.length) L.push(`차이 ${summary.diff > 0 ? '-' : summary.diff < 0 ? '+' : ''}${fmt(summary.abs)}원`);
  L.push(`확인이 필요한 항목 ${issues.filter((i) => i.tone === 'check').length}건`);
  L.push(`야간근무 ${summary.nightLogs.length}회`);
  L.push(`주휴 예상 ${summary.calc.juhyuWeeks}주`);
  L.push(bar);
  L.push('입력한 근무 기록 기준 예상치이며, 정확한 판단은 급여명세서·근로계약서와 함께 확인하세요. — juhyu.kr');
  return L.join('\n');
}

/* 백업 파일 검증 */
export function normalizeTracker(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_TRACKER };
  const arr = (x) => (Array.isArray(x) ? x : []);
  return {
    version: 1,
    activeId: raw.activeId || null,
    workplaces: arr(raw.workplaces).filter((w) => w && w.id),
    logs: arr(raw.logs).filter((l) => l && l.id && /^\d{4}-\d{2}-\d{2}$/.test(l.date)),
    payments: arr(raw.payments).filter((p) => p && p.id && /^\d{4}-\d{2}$/.test(p.month)),
    payslips: arr(raw.payslips).filter((p) => p && p.id),
  };
}
