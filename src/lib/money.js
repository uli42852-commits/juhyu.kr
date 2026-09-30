/* 투자·배당·저축·자산 — 순수 함수. 급여 계산(pay.js/tracker.js)과 분리하고, 통합은 여기 selector에서만 한다.
   가격·배당은 사용자가 직접 입력한 값이다. 나중에 시세 API를 붙일 때는 holding.currentPrice/priceUpdatedAt/source만 채우면 된다. */
import { num, analyzeShift } from './pay.js';
import { monthSummary, ymShift, todayKey, uid } from './tracker.js';

export const MONEY_KEY = 'juhyu-money-v1';
export const EMPTY_ROULETTE = { excluded: [], plannedAmount: '', monthlyPlan: '', history: [] };
export const EMPTY_MONEY = { version: 1, holdings: [], trades: [], dividends: [], savings: [], snapshots: [], settings: { usdKrw: '' }, roulette: EMPTY_ROULETTE };

export { uid };

export function normalizeMoney(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_MONEY, settings: { ...EMPTY_MONEY.settings } };
  const arr = (x) => (Array.isArray(x) ? x : []);
  const dated = (x) => x && x.id && /^\d{4}-\d{2}-\d{2}$/.test(x.date);
  return {
    version: 1,
    holdings: arr(raw.holdings).filter((h) => h && h.id),
    trades: arr(raw.trades).filter(dated),
    dividends: arr(raw.dividends).filter(dated),
    savings: arr(raw.savings).filter(dated),
    snapshots: arr(raw.snapshots).filter((s) => s && /^\d{4}-\d{2}$/.test(s.month)),
    settings: { usdKrw: '', ...(raw.settings || {}) },
    roulette: normalizeRoulette(raw.roulette),
  };
}

function normalizeRoulette(r) {
  const x = r && typeof r === 'object' ? r : {};
  return {
    excluded: Array.isArray(x.excluded) ? x.excluded : [],
    plannedAmount: x.plannedAmount || '',
    monthlyPlan: x.monthlyPlan || '',
    history: (Array.isArray(x.history) ? x.history : []).filter((e) => e && e.id && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.resultId),
  };
}

export function newHolding(fields) {
  return {
    id: uid(), ticker: '', name: '', currency: 'KRW', currentPrice: '', annualDividend: '',
    source: 'manual', priceUpdatedAt: todayKey(), createdAt: new Date().toISOString(), ...fields,
  };
}

/* ── 환율 ─────────────────────────────── */
export function usdRate(money) { return num(money.settings && money.settings.usdKrw); }
export function toKrw(amount, currency, money) {
  if (currency === 'USD') return num(amount) * usdRate(money);
  return num(amount);
}

/* 매수·매도 한 건의 원화 금액: 실제 쓴 원화(krw)를 적었으면 그 값, 아니면 수량 × 단가 × 환율 */
export function tradeKrw(t, holding, money) {
  if (num(t.krw)) return num(t.krw);
  return toKrw(num(t.shares) * num(t.price), holding ? holding.currency : 'KRW', money);
}

/* ── 종목 한 개 ───────────────────────── */
export function holdingStats(money, h) {
  const trades = money.trades.filter((t) => t.holdingId === h.id).sort((a, b) => a.date.localeCompare(b.date) || String(a.createdAt).localeCompare(String(b.createdAt)));
  let shares = 0; let costKrw = 0; let costCur = 0; let realized = 0;
  trades.forEach((t) => {
    const q = num(t.shares);
    const krw = tradeKrw(t, h, money);
    if (t.type === 'sell') {
      if (shares <= 0) return;
      const part = Math.min(q, shares) / shares;
      const costPart = costKrw * part;
      realized += krw - costPart;
      costKrw -= costPart;
      costCur -= costCur * part;
      shares -= Math.min(q, shares);
    } else {
      shares += q;
      costKrw += krw;
      costCur += q * num(t.price);
    }
  });
  const price = num(h.currentPrice);
  const valueKrw = toKrw(shares * price, h.currency, money);
  const divs = money.dividends.filter((d) => d.holdingId === h.id);
  const dividendsKrw = divs.reduce((s, d) => s + toKrw(d.amount, d.currency || 'KRW', money), 0);
  const annualDivKrw = toKrw(shares * num(h.annualDividend), h.currency, money);
  const pnl = valueKrw - costKrw;
  return {
    holding: h, trades, dividends: divs.sort((a, b) => b.date.localeCompare(a.date)),
    shares, costKrw, avgPrice: shares ? costCur / shares : 0, valueKrw, pnl, pnlRate: costKrw ? pnl / costKrw : 0,
    realized, annualDivKrw, dividendsKrw, priced: price > 0, needsRate: h.currency === 'USD' && !usdRate(money),
  };
}

/* ── 전체 포트폴리오 ─────────────────── */
export function portfolio(money) {
  const list = money.holdings.map((h) => holdingStats(money, h));
  const sum = (k) => list.reduce((s, x) => s + x[k], 0);
  const invested = sum('costKrw');
  const value = sum('valueKrw');
  const annualDiv = sum('annualDivKrw');
  return {
    list: list.sort((a, b) => b.valueKrw - a.valueKrw),
    invested, value, pnl: value - invested, pnlRate: invested ? (value - invested) / invested : 0,
    annualDiv, monthlyDiv: annualDiv / 12, realized: sum('realized'),
    needsRate: list.some((x) => x.needsRate && x.shares > 0),
    unpriced: list.filter((x) => x.shares > 0 && !x.priced),
  };
}

/* ── 배당 ─────────────────────────────── */
export function dividendStats(money, today = todayKey()) {
  const ym = today.slice(0, 7); const y = today.slice(0, 4);
  const krw = (d) => toKrw(d.amount, d.currency || 'KRW', money);
  const sumIf = (f) => money.dividends.filter(f).reduce((s, d) => s + krw(d), 0);
  return {
    month: sumIf((d) => d.date.startsWith(ym)),
    year: sumIf((d) => d.date.startsWith(y)),
    total: sumIf(() => true),
    list: [...money.dividends].sort((a, b) => b.date.localeCompare(a.date)),
  };
}

/* ── 알바 수입 (알바비 추적의 실제 입금) ─────────── */
function payments(tracker) { return (tracker && tracker.payments) || []; }
export function workIncomeIn(tracker, ym) {
  return payments(tracker).filter((p) => p.date.startsWith(ym)).reduce((s, p) => s + num(p.amount), 0);
}
export function workIncomeUntil(tracker, ym) {
  return payments(tracker).filter((p) => p.date.slice(0, 7) <= ym).reduce((s, p) => s + num(p.amount), 0);
}
export function workMinutesIn(tracker, ym) {
  return ((tracker && tracker.logs) || []).filter((l) => l.date.startsWith(ym)).reduce((s, l) => s + analyzeShift(l).paidMin, 0);
}
/* 이 달에 일한 것에 대한 예상 급여(모든 알바 합) */
export function expectedWorkPay(tracker, ym) {
  if (!tracker || !tracker.workplaces) return { expected: 0, received: 0, logs: 0 };
  return tracker.workplaces.reduce((acc, wp) => {
    const s = monthSummary(tracker, wp, ym);
    return { expected: acc.expected + (s.logs.length ? s.expected : 0), received: acc.received + s.received, logs: acc.logs + s.logs.length, diff: (acc.diff || 0) + (s.payments.length ? s.diff : 0) };
  }, { expected: 0, received: 0, logs: 0, diff: 0 });
}
export function mainWage(tracker) {
  const wp = tracker && tracker.workplaces && (tracker.workplaces.find((w) => w.id === tracker.activeId) || tracker.workplaces[0]);
  return wp ? num(wp.wage) : 0;
}

/* ── 저축 ─────────────────────────────── */
const signed = (s) => (s.type === 'withdraw' ? -num(s.amount) : num(s.amount));
export function savingsIn(money, ym) { return money.savings.filter((s) => s.date.startsWith(ym)).reduce((a, s) => a + signed(s), 0); }
export function savingsUntil(money, ym) { return money.savings.filter((s) => s.date.slice(0, 7) <= ym).reduce((a, s) => a + signed(s), 0); }

/* ── 투자 흐름 ─────────────────────────── */
export function investedIn(money, ym) {
  const byHolding = {};
  let total = 0;
  // 예전부터 갖고 있던 종목을 등록한 기록(initial)은 이번 달 투자금에서 뺀다
  money.trades.filter((t) => t.date.startsWith(ym) && t.type !== 'sell' && !t.initial).forEach((t) => {
    const h = money.holdings.find((x) => x.id === t.holdingId);
    const k = tradeKrw(t, h, money);
    total += k;
    byHolding[t.holdingId] = (byHolding[t.holdingId] || 0) + k;
  });
  const parts = Object.entries(byHolding).map(([id, amount]) => {
    const h = money.holdings.find((x) => x.id === id);
    return { id, label: h ? (h.ticker || h.name) : '삭제된 종목', amount };
  }).sort((a, b) => b.amount - a.amount);
  return { total, parts };
}
function costUntil(money, ym) {
  // 과거 달의 투자자산은 시세 기록이 없으므로 그 시점까지의 투자원금으로 본다
  const cut = { ...money, trades: money.trades.filter((t) => t.date.slice(0, 7) <= ym) };
  return cut.holdings.reduce((s, h) => s + holdingStats(cut, h).costKrw, 0);
}
function dividendsUntil(money, ym) {
  return money.dividends.filter((d) => d.date.slice(0, 7) <= ym).reduce((s, d) => s + toKrw(d.amount, d.currency || 'KRW', money), 0);
}

/* ── 자산 ────────────────────────────────
   기록 자산 = 저축 잔액 + 투자자산(평가금액) + 받은 배당 누적.
   알바 수입 자체는 자산에 더하지 않는다(저축·투자로 옮긴 만큼만 쌓인다). */
export function assetNow(money) {
  const p = portfolio(money);
  const d = dividendStats(money);
  const ym = todayKey().slice(0, 7);
  const savings = savingsUntil(money, '9999-12');
  return { savings, investValue: p.value, invested: p.invested, dividends: d.total, total: savings + p.value + d.total, portfolio: p, div: d, ym };
}

export function assetAt(money, ym, today = todayKey()) {
  if (ym === today.slice(0, 7)) return { ...assetNow(money), basis: 'live' };
  const snap = money.snapshots.find((s) => s.month === ym);
  if (snap) return { total: num(snap.total), savings: num(snap.savings), investValue: num(snap.value), dividends: num(snap.dividends), basis: 'snapshot' };
  const savings = savingsUntil(money, ym);
  const investValue = costUntil(money, ym);
  const dividends = dividendsUntil(money, ym);
  return { total: savings + investValue + dividends, savings, investValue, dividends, basis: 'cost' };
}

export function assetHistory(money, months = 6, today = todayKey()) {
  const cur = today.slice(0, 7);
  const out = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const ym = ymShift(cur, -i);
    out.push({ ym, ...assetAt(money, ym, today) });
  }
  return out;
}

/* 이번 달 스냅샷 — 앱을 열 때마다 이번 달 값을 갱신해, 달이 지나면 그 달 평가금액이 기록으로 남는다 */
export function upsertSnapshot(money, today = todayKey()) {
  const ym = today.slice(0, 7);
  const a = assetNow(money);
  const snap = { month: ym, savings: a.savings, value: a.investValue, invested: a.invested, dividends: a.dividends, total: a.total, recordedAt: today };
  const prev = money.snapshots.find((s) => s.month === ym);
  if (prev && prev.total === snap.total && prev.recordedAt === today) return money;
  return { ...money, snapshots: [...money.snapshots.filter((s) => s.month !== ym), snap] };
}

/* ── 이번 달 돈의 흐름 + 리포트 ──────────── */
export function monthFlow(money, tracker, ym, today = todayKey()) {
  const received = workIncomeIn(tracker, ym);
  const work = expectedWorkPay(tracker, ym);
  const inv = investedIn(money, ym);
  const d = money.dividends.filter((x) => x.date.startsWith(ym)).reduce((s, x) => s + toKrw(x.amount, x.currency || 'KRW', money), 0);
  const cur = assetAt(money, ym, today);
  const prev = assetAt(money, ymShift(ym, -1), today);
  const wage = mainWage(tracker);
  return {
    ym,
    workReceived: received, // 이 달에 통장에 들어온 알바비
    workExpected: work.expected, // 이 달에 일한 만큼의 예상 급여
    workLogs: work.logs,
    workDiff: work.diff,
    workMinutes: workMinutesIn(tracker, ym),
    saved: savingsIn(money, ym),
    invested: inv.total,
    investParts: inv.parts,
    investValue: ym === today.slice(0, 7) ? portfolio(money).value : cur.investValue,
    dividends: d,
    assetTotal: cur.total,
    assetChange: cur.total - prev.total,
    assetBasis: cur.basis,
    wage,
  };
}

/* 알바 시급으로 단순 환산 — 과장하지 않게 소수점 한 자리, 시급이 없으면 null */
export function hoursOfWork(amount, wage) {
  if (!wage || !amount) return null;
  return Math.round((amount / wage) * 10) / 10;
}

export function pct(x) {
  const v = Math.round(x * 10000) / 100;
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
}

/* ── 🎰 오늘 뭐 살까? (포트폴리오 룰렛) ───────────────────
   후보는 사용자가 등록한 종목 중 직접 고른 것만. 모든 후보는 같은 확률.
   룰렛 결과(history)와 실제 매수(trades)는 따로 저장하고, 매수 기록을 남길 때만 purchaseId로 잇는다. */
export function rouletteCandidates(money) {
  const ex = new Set((money.roulette && money.roulette.excluded) || []);
  return money.holdings.map((h) => ({ holding: h, checked: !ex.has(h.id) }));
}

/* 0 ≤ i < n 균등 난수. 브라우저에서는 crypto를 쓰고, 테스트에서는 rand를 넣는다 */
export function pickIndex(n, rand) {
  if (n <= 0) return -1;
  if (rand) return Math.min(n - 1, Math.floor(rand() * n));
  const c = typeof globalThis !== 'undefined' && globalThis.crypto;
  if (c && c.getRandomValues) {
    // 모듈로 편향 없이 균등하게
    const limit = Math.floor(0x100000000 / n) * n;
    const buf = new Uint32Array(1);
    do { c.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }
  return Math.floor(Math.random() * n);
}

export function makeRouletteEntry(candidates, index, { plannedAmount = '', now = new Date() } = {}) {
  const r = candidates[index];
  return {
    id: uid(),
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    at: now.toISOString(),
    candidates: candidates.map((h) => ({ id: h.id, label: h.ticker || h.name })),
    resultId: r.id,
    resultLabel: r.ticker || r.name,
    plannedAmount: plannedAmount ? String(num(plannedAmount)) : '',
    purchaseId: null,
  };
}

/* 기록 한 건의 실제 매수 여부: 룰렛에서 이어 기록한 매수(purchaseId)가 있거나, 같은 날 결과 종목을 산 기록이 있으면 ✅ */
export function rouletteHistory(money) {
  const buys = money.trades.filter((t) => t.type !== 'sell' && !t.initial);
  return [...((money.roulette && money.roulette.history) || [])]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .map((e) => {
      const linked = e.purchaseId ? buys.find((t) => t.id === e.purchaseId) : null;
      const sameDay = buys.filter((t) => t.date === e.date);
      const matched = linked || sameDay.find((t) => t.holdingId === e.resultId) || null;
      const h = money.holdings.find((x) => x.id === e.resultId);
      return {
        ...e,
        label: h ? (h.ticker || h.name) : e.resultLabel,
        purchase: matched,
        purchaseKrw: matched ? tradeKrw(matched, h, money) : 0,
        boughtOther: !matched && sameDay.length > 0,
      };
    });
}

/* 재미용 통계 — 투자 성과가 아니다 */
export function rouletteStats(money) {
  const list = rouletteHistory(money);
  const counts = {};
  list.forEach((e) => { counts[e.label] = (counts[e.label] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || null;
  const days = [...new Set(list.map((e) => e.date))];
  const buyDays = new Set(money.trades.filter((t) => t.type !== 'sell' && !t.initial).map((t) => t.date));
  const matchedDays = new Set(list.filter((e) => e.purchase).map((e) => e.date));
  return {
    spins: list.length,
    top: top ? { label: top[0], count: top[1] } : null,
    days: days.length,
    boughtDays: days.filter((d) => buyDays.has(d)).length,
    matchedDays: matchedDays.size,
    list,
  };
}
