import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateLogged, logAmounts, calculatePay } from '../src/lib/pay.js';
import {
  newWorkplace, makeLog, monthSummary, detectIssues, buildAskMessage, settlement, missingScheduledDays, normalizeTracker, reportText, defaultPayMonth,
} from '../src/lib/tracker.js';

const wp = newWorkplace({ id: 'w1', name: '카페 알바', wage: '12000', payday: '10', startDate: '2026-09-01', start: '17:00', end: '22:30', breakMin: '30', days: [true, false, true, false, true, false, false], size: 'over5', deduction: 'none' });

// 2026년 9월 월·수·금 17:00~22:30 (휴게 30분) → 하루 5시간, 그중 야간 약 0.45시간
function septemberLogs() {
  const out = [];
  for (let d = 1; d <= 30; d += 1) {
    const w = (new Date(2026, 8, d).getDay() + 6) % 7;
    if ([0, 2, 4].includes(w)) out.push(makeLog(wp, { date: `2026-09-${String(d).padStart(2, '0')}`, start: '17:00', end: '22:30', breakMin: '30', memo: '' }));
  }
  return out;
}
const state = { version: 1, activeId: 'w1', workplaces: [wp], logs: septemberLogs(), payments: [], payslips: [] };

test('기록 기반 계산은 같은 조건의 스케줄 계산과 같다', () => {
  // 9월 첫 주(8/31~9/6)는 8월 31일 근무까지 있어야 스케줄 계산과 같아진다
  const withAug = [...state.logs, makeLog(wp, { date: '2026-08-31', start: '17:00', end: '22:30', breakMin: '30' })];
  const logged = calculateLogged({ wage: 12000, year: 2026, month: 9, workplace: 'over5', logs: withAug });
  const without = calculateLogged({ wage: 12000, year: 2026, month: 9, workplace: 'over5', logs: state.logs });
  assert.equal(without.juhyuWeeks, 3);
  const sched = calculatePay({ wage: '12000', period: 'month', year: 2026, month: 9, days: wp.days, start: wp.start, end: wp.end, breakMin: '30', workplace: 'over5', fullAttendance: true, deduction: 'none' });
  assert.equal(logged.workDays, sched.workDays);
  assert.equal(logged.gross, sched.gross);
  assert.equal(logged.juhyuWeeks, 4);
});

test('하루 기록 금액: 기본급 + 5인 이상 야간 가산', () => {
  const a = logAmounts({ start: '17:00', end: '22:30', breakMin: '30' }, 12000, 'over5');
  assert.equal(a.paidMin, 300);
  assert.equal(a.base, 60000);
  assert.ok(a.night > 0);
  assert.equal(a.total, a.base + a.night);
  const u = logAmounts({ start: '17:00', end: '22:30', breakMin: '30' }, 12000, 'under5');
  assert.equal(u.night, 0);
});

test('입금 전에는 waiting, 차이는 0', () => {
  const s = monthSummary(state, wp, '2026-09');
  assert.equal(s.status, 'waiting');
  assert.equal(s.logs.length, 13);
});

test('하루치만큼 덜 들어오면 그 날짜를 확인 항목으로 짚는다', () => {
  const s0 = monthSummary(state, wp, '2026-09');
  const oneDay = logAmounts(state.logs[3], 12000, 'over5').total;
  const st = { ...state, payments: [{ id: 'p1', workplaceId: 'w1', month: '2026-09', date: '2026-10-10', amount: String(s0.expected - oneDay), basis: 'gross' }] };
  const s = monthSummary(st, wp, '2026-09');
  assert.equal(s.status, 'less');
  assert.equal(s.abs, oneDay);
  const issues = detectIssues(s, { today: '2026-10-11' });
  assert.ok(issues.some((i) => i.key.startsWith('day-') && i.tone === 'check'));
  assert.ok(issues.some((i) => i.key === 'night'));
});

test('주휴 1주분만큼 덜 들어오면 주휴수당 확인 항목', () => {
  const s0 = monthSummary(state, wp, '2026-09');
  const week = s0.calc.weekRows.find((w) => w.eligible).juhyuPay;
  const st = { ...state, payments: [{ id: 'p1', workplaceId: 'w1', month: '2026-09', date: '2026-10-10', amount: String(s0.expected - week), basis: 'gross' }] };
  const issues = detectIssues(monthSummary(st, wp, '2026-09'), { today: '2026-10-11' });
  assert.ok(issues.some((i) => i.key === 'juhyu'));
});

test('기록이 빠진 근무 예정일을 찾는다', () => {
  const st = { ...state, logs: state.logs.filter((l) => l.date !== '2026-09-09') };
  const missing = missingScheduledDays(monthSummary(st, wp, '2026-09'), '2026-10-01');
  assert.deepEqual(missing, ['2026-09-09']);
});

test('확인 메시지는 단정하지 않는다', () => {
  const s0 = monthSummary(state, wp, '2026-09');
  const st = { ...state, payments: [{ id: 'p1', workplaceId: 'w1', month: '2026-09', date: '2026-10-10', amount: String(s0.expected - 50000), basis: 'gross' }] };
  const s = monthSummary(st, wp, '2026-09');
  const msg = buildAskMessage(s, detectIssues(s));
  assert.match(msg, /50,000원/);
  assert.match(msg, /확인해주실 수 있을까요/);
  assert.doesNotMatch(msg, /체불|위반|떼|신고/);
  assert.doesNotMatch(reportText(s, []), /체불|위반/);
});

test('퇴사 정산은 달별로 합산한다', () => {
  const st = { ...state, payments: [{ id: 'p1', workplaceId: 'w1', month: '2026-09', date: '2026-10-10', amount: '500000', basis: 'gross' }] };
  const r = settlement(st, wp, '2026-10-15');
  assert.deepEqual(r.months.map((m) => m.ym), ['2026-09', '2026-10']);
  assert.equal(r.workDays, 13);
  assert.equal(r.received, 500000);
});

test('입금일 기준 기본 급여월은 지난달', () => {
  assert.equal(defaultPayMonth('2026-10-10'), '2026-09');
  assert.equal(defaultPayMonth('2026-01-10'), '2025-12');
});

test('백업 데이터 정리', () => {
  const n = normalizeTracker({ workplaces: [{ id: 'a' }, null], logs: [{ id: 'x', date: 'bad' }, { id: 'y', date: '2026-09-01' }], payments: 'no' });
  assert.equal(n.workplaces.length, 1);
  assert.equal(n.logs.length, 1);
  assert.deepEqual(n.payments, []);
});
