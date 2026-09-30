import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePay, comparePay, analyzeShift, calcDeductions, monthlyFromWeekly } from '../src/lib/pay.js';
import { parsePayslip, analyzePayslip } from '../src/lib/payslip.js';

const base = {
  wage: '10320', fullAttendance: true, extraHours: '', deduction: 'none', workplace: 'over5', period: 'week',
  days: [true, true, true, true, true, false, false], start: '09:00', end: '18:00', breakMin: '60',
};
const amt = (r, key) => r.items.find((i) => i.key === key).amount;

test('주 40시간: 기본급 + 주휴 8시간', () => {
  const r = calculatePay(base);
  assert.equal(r.workHours, 40);
  assert.equal(amt(r, 'base'), 412800);
  assert.equal(amt(r, 'juhyu'), 82560);
  assert.equal(r.gross, 495360);
});

test('주 15시간 미만은 주휴수당 0원', () => {
  const r = calculatePay({ ...base, days: [false, false, false, false, true, true, true], start: '22:00', end: '03:00', breakMin: '30' });
  assert.equal(r.workHours, 13.5);
  assert.equal(amt(r, 'juhyu'), 0);
  assert.equal(amt(r, 'night'), 69660);
});

test('결근이 있으면 주휴수당 0원', () => {
  const r = calculatePay({ ...base, fullAttendance: false });
  assert.equal(amt(r, 'juhyu'), 0);
});

test('5인 미만은 가산수당 미포함, 모름이면 조건부 표시', () => {
  const night = { ...base, start: '18:00', end: '23:00', breakMin: '0' };
  const under = calculatePay({ ...night, workplace: 'under5' });
  assert.equal(amt(under, 'night'), 0);
  const unknown = calculatePay({ ...night, workplace: 'unknown' });
  const n = unknown.items.find((i) => i.key === 'night');
  assert.equal(n.included, false);
  assert.equal(n.conditional, true);
  assert.equal(unknown.conditionalExtra, n.amount);
  assert.equal(unknown.gross, under.gross);
});

test('자정 넘는 근무의 야간시간', () => {
  const s = analyzeShift({ start: '22:00', end: '06:00', breakMin: '0' });
  assert.equal(s.paidMin, 480);
  assert.equal(s.nightMin, 480);
  const s2 = analyzeShift({ start: '04:00', end: '10:00', breakMin: '0' });
  assert.equal(s2.nightMin, 120);
});

test('하루 8시간 초과는 연장근로', () => {
  const r = calculatePay({ ...base, days: [false, false, false, false, false, true, true], start: '10:00', end: '20:00', breakMin: '60' });
  assert.equal(r.overHours, 2);
  assert.equal(amt(r, 'overtime'), 10320);
});

test('월 계산: 2026년 11월 월수금은 13일, 주휴 5주', () => {
  const r = calculatePay({ ...base, period: 'month', year: 2026, month: 11, days: [true, false, true, false, true, false, false], start: '17:00', end: '23:00', breakMin: '30', workplace: 'under5', deduction: 'tax33' });
  assert.equal(r.workDays, 13);
  assert.equal(r.workHours, 71.5);
  assert.equal(r.juhyuWeeks, 5);
  assert.equal(r.gross, 908160);
  assert.equal(r.deductTotal, 29960);
  assert.equal(r.net, 878200);
});

test('달력에서 쉬는 날로 바꾸면 반영', () => {
  const input = { ...base, period: 'month', year: 2026, month: 11 };
  const a = calculatePay(input);
  const b = calculatePay({ ...input, overrides: { '2026-11-02': 'off' } });
  assert.equal(a.workDays - b.workDays, 1);
  assert.equal(a.items[0].amount - b.items[0].amount, 82560);
});

test('4대보험 근로자 부담 (2026 요율, 10원 미만 절사)', () => {
  const d = calcDeductions(2000000, 'insurance');
  const m = Object.fromEntries(d.map((x) => [x.key, x.amount]));
  assert.equal(m.pension, 95000);
  assert.equal(m.health, 71900);
  assert.equal(m.ltc, 9440);
  assert.equal(m.employment, 18000);
});

test('월 환산은 209시간 (주 40시간)', () => {
  assert.equal(monthlyFromWeekly(40, 10320).monthly, 2156880);
});

test('검증: 차이가 주휴수당과 같으면 힌트', () => {
  const r = calculatePay(base);
  const v = comparePay(r, String(r.gross - 82560), 'gross');
  assert.equal(v.status, 'less');
  assert.equal(v.abs, 82560);
  assert.ok(v.hints.some((h) => h.includes('주휴수당')));
});

test('검증: 거의 같으면 match', () => {
  const r = calculatePay(base);
  assert.equal(comparePay(r, String(r.gross - 500), 'gross').status, 'match');
  assert.equal(comparePay(r, '', 'gross'), null);
});

test('명세서 파싱: 한 줄에 여러 항목, 지방소득세 구분', () => {
  const f = parsePayslip('기본급 804,960원  주휴수당 160,992원\n소득세 28,970 지방소득세 2,890\n실지급액 934,092');
  assert.equal(f.base, 804960);
  assert.equal(f.juhyu, 160992);
  assert.equal(f.incomeTax, 28970);
  assert.equal(f.localTax, 2890);
  assert.equal(f.net, 934092);
});

test('명세서 분석: 합계 불일치와 3.3% 감지', () => {
  const r = calculatePay(base);
  const a = analyzePayslip({ base: '804960', juhyu: '160992', grossTotal: '965952', incomeTax: '28970', localTax: '2890', net: '930000' }, r);
  assert.ok(a.findings.some((x) => x.title.includes('실지급액') && x.level === 'warn'));
  assert.ok(a.findings.some((x) => x.title.includes('3.3%')));
});
