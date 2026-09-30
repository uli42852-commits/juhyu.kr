import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMoney, holdingStats, portfolio, dividendStats, assetNow, assetAt, assetHistory, monthFlow, investedIn, hoursOfWork, upsertSnapshot, pct, tradeKrw,
} from '../src/lib/money.js';

const base = () => normalizeMoney({
  holdings: [
    { id: 'h1', ticker: 'SCHD', name: 'SCHD', currency: 'KRW', currentPrice: '27000', annualDividend: '1400' },
    { id: 'h2', ticker: 'AAA', name: '미국 ETF', currency: 'USD', currentPrice: '20', annualDividend: '1' },
  ],
  trades: [
    { id: 't1', holdingId: 'h1', type: 'buy', date: '2026-09-10', shares: '5', price: '25000' },
    { id: 't2', holdingId: 'h1', type: 'buy', date: '2026-09-20', shares: '5', price: '25000' },
    { id: 't3', holdingId: 'h2', type: 'buy', date: '2026-09-21', shares: '2', price: '18', krw: '50000' },
  ],
  dividends: [
    { id: 'd1', holdingId: 'h1', date: '2026-09-15', amount: '4200', currency: 'KRW' },
    { id: 'd2', holdingId: 'h2', date: '2026-08-15', amount: '1', currency: 'USD' },
  ],
  savings: [
    { id: 's1', date: '2026-08-11', amount: '300000', type: 'save' },
    { id: 's2', date: '2026-09-11', amount: '300000', type: 'save' },
    { id: 's3', date: '2026-09-25', amount: '50000', type: 'withdraw' },
  ],
  settings: { usdKrw: '1400' },
});

test('종목 통계: 투자원금·평가·수익률·예상 배당', () => {
  const m = base();
  const s = holdingStats(m, m.holdings[0]);
  assert.equal(s.shares, 10);
  assert.equal(s.costKrw, 250000);
  assert.equal(s.avgPrice, 25000);
  assert.equal(s.valueKrw, 270000);
  assert.equal(s.pnl, 20000);
  assert.equal(pct(s.pnlRate), '+8.00%');
  assert.equal(s.annualDivKrw, 14000);
  assert.equal(s.dividendsKrw, 4200);
});

test('달러 종목: 실제 쓴 원화가 있으면 그 값, 평가는 입력한 환율', () => {
  const m = base();
  const s = holdingStats(m, m.holdings[1]);
  assert.equal(s.costKrw, 50000);
  assert.equal(s.valueKrw, 2 * 20 * 1400);
  assert.equal(tradeKrw({ shares: '1', price: '10' }, m.holdings[1], m), 14000);
});

test('매도하면 평균단가 기준으로 원가가 줄어든다', () => {
  const m = base();
  m.trades.push({ id: 't4', holdingId: 'h1', type: 'sell', date: '2026-09-28', shares: '5', price: '28000' });
  const s = holdingStats(m, m.holdings[0]);
  assert.equal(s.shares, 5);
  assert.equal(s.costKrw, 125000);
  assert.equal(s.realized, 140000 - 125000);
});

test('포트폴리오 합계와 배당 통계', () => {
  const m = base();
  const p = portfolio(m);
  assert.equal(p.invested, 300000);
  assert.equal(p.value, 270000 + 56000);
  const d = dividendStats(m, '2026-09-30');
  assert.equal(d.month, 4200);
  assert.equal(d.year, 4200 + 1400);
  assert.equal(d.total, 5600);
});

test('기록 자산 = 저축 + 투자 평가 + 받은 배당', () => {
  const m = base();
  const a = assetNow(m);
  assert.equal(a.savings, 550000);
  assert.equal(a.total, 550000 + 326000 + 5600);
});

test('지난달 자산: 스냅샷이 없으면 투자원금 기준', () => {
  const m = base();
  const aug = assetAt(m, '2026-08', '2026-09-30');
  assert.equal(aug.basis, 'cost');
  assert.equal(aug.total, 300000 + 0 + 1400);
  const withSnap = upsertSnapshot(m, '2026-09-30');
  assert.equal(withSnap.snapshots.length, 1);
  assert.equal(assetAt(withSnap, '2026-09', '2026-10-05').basis, 'snapshot');
  assert.equal(assetHistory(m, 3, '2026-09-30').length, 3);
});

test('이번 달 흐름: 알바 입금 → 저축 → 투자 → 배당, 시급 환산', () => {
  const m = base();
  const tracker = {
    activeId: 'w', workplaces: [{ id: 'w', wage: '12000', size: 'unknown', deduction: 'none', days: [true, false, false, false, false, false, false] }],
    logs: [{ id: 'l', workplaceId: 'w', date: '2026-09-07', start: '17:00', end: '22:00', breakMin: '0' }],
    payments: [{ id: 'p', workplaceId: 'w', month: '2026-08', date: '2026-09-10', amount: '1020000', basis: 'gross' }],
  };
  const f = monthFlow(m, tracker, '2026-09', '2026-09-30');
  assert.equal(f.workReceived, 1020000);
  assert.equal(f.saved, 250000);
  assert.equal(f.invested, 300000);
  assert.equal(f.investParts[0].label, 'SCHD');
  assert.equal(f.dividends, 4200);
  assert.equal(f.workMinutes, 300);
  assert.equal(hoursOfWork(f.invested, f.wage), 25);
  assert.equal(hoursOfWork(0, 12000), null);
  assert.equal(investedIn(m, '2026-08').total, 0);
});

test('보유 종목 등록(initial)은 이번 달 투자금에 넣지 않는다', () => {
  const m = base();
  m.trades.push({ id: 't9', holdingId: 'h1', type: 'buy', date: '2026-09-29', shares: '3', price: '26000', initial: true });
  assert.equal(investedIn(m, '2026-09').total, 300000);
  assert.equal(holdingStats(m, m.holdings[0]).shares, 13);
});
