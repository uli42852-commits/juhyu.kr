import React, { useEffect, useRef, useState } from 'react';
import { Card, Field, MoneyInput, Segmented, Notice } from '../ui.jsx';
import { useHashRoute, useToast, Toast, BackLink } from '../tracker/common.jsx';
import { useMoney } from '../../lib/useMoney.js';
import { useTracker } from '../../lib/useTracker.js';
import {
  portfolio, holdingStats, dividendStats, hoursOfWork, mainWage, pct, toKrw, usdRate, investedIn,
} from '../../lib/money.js';
import { fmt, num } from '../../lib/pay.js';
import { todayKey } from '../../lib/tracker.js';

const INVEST_NOTE = 'JUHYU는 내가 입력한 투자 기록을 정리하는 도구예요. 종목 추천이나 투자 권유를 하지 않아요. 가격·배당은 직접 입력한 값이라 실제와 다를 수 있어요.';

const won = (v) => `${fmt(v)}원`;
const signWon = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmt(Math.abs(v))}원`;
const cls = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : '');
const curPrice = (v, c) => (c === 'USD' ? `$${Number(num(v).toFixed(2)).toLocaleString('en-US')}` : won(v));
const shortTk = (h) => (h.ticker || h.name || '?').slice(0, 5).toUpperCase();

function StockRow({ st, onClick }) {
  const h = st.holding;
  return (
    <button type="button" className="stock" onClick={onClick}>
      <span className="tk" aria-hidden>{shortTk(h)}</span>
      <span className="n"><b>{h.name || h.ticker}</b><small>{fmtShares(st.shares)}주 · 평균 {curPrice(st.avgPrice, h.currency)}</small></span>
      <span className="r">{st.priced ? won(st.valueKrw) : '가격 입력 필요'}<small className={cls(st.pnl)}>{st.priced ? `${signWon(st.pnl)} (${pct(st.pnlRate)})` : ''}</small></span>
    </button>
  );
}
function fmtShares(v) { return Number.isInteger(v) ? fmt(v) : Number(v.toFixed(4)).toLocaleString('ko-KR'); }

/* ── 대시보드 ─────────────────────────── */
function Dashboard({ m, tracker, go }) {
  const p = portfolio(m.state);
  const d = dividendStats(m.state);
  const wage = mainWage(tracker.state);
  const ym = todayKey().slice(0, 7);
  const monthInv = investedIn(m.state, ym).total;
  if (!m.state.holdings.length) {
    return (
      <Card>
        <h2 style={{ fontSize: 21, fontWeight: 850, lineHeight: 1.35 }}>알바로 번 돈,<br />어디에 투자했는지 기록해보세요.</h2>
        <p className="field-hint" style={{ fontSize: 14.5, marginTop: 8 }}>증권사 로그인 없이, 보유 종목과 매수·배당 기록을 직접 적어두는 방식이에요. 기록은 이 브라우저에만 저장돼요.</p>
        <div style={{ display: 'grid', gap: 8, margin: '16px 0' }}>
          <div className="fun-line">📌 종목 등록 → 매수할 때마다 금액만 기록</div>
          <div className="fun-line">💵 배당 받은 날 금액 기록 → 이번 달·올해·누적 배당</div>
          <div className="fun-line">⏱ 배당·투자금을 내 알바 시간으로 환산</div>
        </div>
        <button type="button" className="btn btn-primary btn-block" onClick={() => go('/add')}>첫 종목 추가하기</button>
        <p className="fineprint">{INVEST_NOTE}</p>
      </Card>
    );
  }
  const divHours = hoursOfWork(p.annualDiv, wage);
  return (
    <div className="tk-grid two">
      <div className="tk-grid">
        <Card title="📈 내 투자">
          <div className="stat-grid">
            <div className="stat"><div className="k">총 투자금</div><div className="v">{won(p.invested)}</div></div>
            <div className="stat"><div className="k">현재 평가금액</div><div className="v">{won(p.value)}</div></div>
            <div className="stat"><div className="k">평가손익</div><div className={`v ${cls(p.pnl)}`}>{signWon(p.pnl)}</div></div>
            <div className="stat"><div className="k">수익률</div><div className={`v ${cls(p.pnl)}`}>{pct(p.pnlRate)}</div></div>
            <div className="stat"><div className="k">예상 연 배당금</div><div className="v">{won(p.annualDiv)}</div></div>
            <div className="stat"><div className="k">월평균 예상 배당</div><div className="v">{won(Math.round(p.monthlyDiv))}</div></div>
          </div>
          {p.needsRate && <Notice level="warn">달러 종목이 있어요. <a href="#/settings">환율</a>을 입력해야 원화로 계산돼요.</Notice>}
          {p.unpriced.length > 0 && <Notice level="info">현재가가 없는 종목 {p.unpriced.length}개는 평가금액 0원으로 계산돼요. <a href="#/prices">현재가 입력</a></Notice>}
        </Card>
        <div className="action-row">
          <button type="button" className="btn btn-primary" onClick={() => go('/buy')}>+ 투자 기록</button>
          <button type="button" className="btn btn-ghost" onClick={() => go('/div')}>+ 배당 기록</button>
        </div>
        {(divHours || monthInv > 0) && (
          <div>
            {monthInv > 0 && wage > 0 && <div className="fun-line">이번 달 투자한 {won(monthInv)}은 시급 {fmt(wage)}원 기준 알바 약 <b>{hoursOfWork(monthInv, wage)}시간</b>치예요.</div>}
            {divHours && <div className="fun-line">지금 예상 연 배당금은 알바 약 <b>{divHours}시간</b>치 수입과 같아요.</div>}
          </div>
        )}
        <Card title="💵 배당" aside={<button type="button" className="link-btn" onClick={() => go('/div')}>기록 보기</button>}>
          <div className="stat-grid">
            <div className="stat"><div className="k">이번 달 배당</div><div className="v">{won(d.month)}</div></div>
            <div className="stat"><div className="k">올해 누적</div><div className="v">{won(d.year)}</div></div>
            <div className="stat wide"><div className="k">총 누적 배당</div><div className="v big">{won(d.total)}</div></div>
          </div>
          {d.month > 0 && wage > 0 && <p className="basis">이번 달 배당은 알바 약 {hoursOfWork(d.month, wage)}시간치예요 (시급 {fmt(wage)}원 기준).</p>}
        </Card>
      </div>
      <div className="tk-grid">
        <Card title="보유 종목" aside={<button type="button" className="link-btn" onClick={() => go('/add')}>+ 종목 추가</button>}>
          {p.list.map((st) => <StockRow key={st.holding.id} st={st} onClick={() => go(`/stock/${st.holding.id}`)} />)}
        </Card>
        <div className="tile-grid">
          <button type="button" className="tile" onClick={() => go('/prices')}><span className="ic">🏷</span><span className="t">현재가 업데이트</span><span className="d">가끔 한 번에 수정</span></button>
          <button type="button" className="tile" onClick={() => go('/settings')}><span className="ic">⚙</span><span className="t">환율·백업</span><span className="d">달러 종목 환율</span></button>
        </div>
        <p className="fineprint">{INVEST_NOTE}</p>
      </div>
    </div>
  );
}

/* ── 종목 추가 ─────────────────────────── */
function AddHolding({ m, go, toast }) {
  const [f, setF] = useState({ name: '', ticker: '', currency: 'KRW', shares: '', avgPrice: '', currentPrice: '', annualDividend: '', when: 'before' });
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const usd = f.currency === 'USD';
  const unit = usd ? '$' : '원';
  const save = () => {
    const name = f.name.trim() || f.ticker.trim().toUpperCase();
    const h = m.addHolding(
      { name, ticker: f.ticker.trim().toUpperCase(), currency: f.currency, currentPrice: f.currentPrice || f.avgPrice, annualDividend: f.annualDividend },
      num(f.shares) > 0 ? { shares: f.shares, price: f.avgPrice, initial: f.when === 'before' } : null,
    );
    toast(`${name} 등록`);
    go(`/stock/${h.id}`);
  };
  return (
    <>
      <BackLink go={go} label="내 투자" />
      <Card title="종목 추가">
        <Field label="종목명" htmlFor="h-name"><input id="h-name" className="input" style={{ fontWeight: 600 }} value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="예: 미국 배당 ETF" maxLength={30} /></Field>
        <div className="grid-2">
          <Field label="티커 (선택)" htmlFor="h-tk"><input id="h-tk" className="input" style={{ fontWeight: 600, textTransform: 'uppercase' }} value={f.ticker} onChange={(e) => set({ ticker: e.target.value })} placeholder="예: SCHD" maxLength={12} /></Field>
          <Field label="통화"><Segmented label="통화" options={[{ value: 'KRW', label: '원' }, { value: 'USD', label: '달러' }]} value={f.currency} onChange={(v) => set({ currency: v })} /></Field>
        </div>
        <div className="grid-2">
          <Field label="보유수량" htmlFor="h-sh"><MoneyInput id="h-sh" small decimal value={f.shares} onChange={(v) => set({ shares: v })} suffix="주" /></Field>
          <Field label="평균매수가" htmlFor="h-avg"><MoneyInput id="h-avg" small decimal={usd} value={f.avgPrice} onChange={(v) => set({ avgPrice: v })} suffix={unit} /></Field>
        </div>
        <div className="grid-2">
          <Field label="현재가격" htmlFor="h-cur"><MoneyInput id="h-cur" small decimal={usd} value={f.currentPrice} onChange={(v) => set({ currentPrice: v })} suffix={unit} placeholder="모르면 비워두기" /></Field>
          <Field label="1주당 연 배당 (선택)" htmlFor="h-div"><MoneyInput id="h-div" small decimal={usd} value={f.annualDividend} onChange={(v) => set({ annualDividend: v })} suffix={unit} /></Field>
        </div>
        {num(f.shares) > 0 && (
          <Field label="이 수량은 언제 샀나요?" hint="예전부터 갖고 있던 종목은 이번 달 투자금에 넣지 않고 투자원금으로만 계산해요.">
            <Segmented label="매수 시점" options={[{ value: 'before', label: '예전부터 보유' }, { value: 'now', label: '이번에 샀어요' }]} value={f.when} onChange={(v) => set({ when: v })} />
          </Field>
        )}
        {usd && !usdRate(m.state) && <Notice level="info">달러 종목은 <a href="#/settings">환율</a>을 입력하면 원화로 합산돼요.</Notice>}
        <p className="field-hint">현재가를 비워두면 평균매수가로 채워요.</p>
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} disabled={!(f.name.trim() || f.ticker.trim())} onClick={save}>저장</button>
      </Card>
    </>
  );
}

/* ── 투자 기록 (매수/매도) — 종목 + 금액만 필수 ─────── */
function TradeForm({ m, go, toast, holdingId }) {
  const holdings = m.state.holdings;
  const [f, setF] = useState({ holdingId: holdingId || (holdings[0] && holdings[0].id) || '', type: 'buy', date: todayKey(), amount: '', shares: '', price: '', memo: '' });
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const h = holdings.find((x) => x.id === f.holdingId);
  if (!holdings.length) {
    return (<><BackLink go={go} label="내 투자" /><Card><p>먼저 종목을 등록해주세요.</p><button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => go('/add')}>종목 추가</button></Card></>);
  }
  const usd = h && h.currency === 'USD';
  const price = num(f.price) || (h ? num(h.currentPrice) : 0);
  // 수량을 안 적으면 금액 ÷ 가격으로 추정
  const priceKrw = h ? toKrw(price, h.currency, m.state) : 0;
  const estShares = !num(f.shares) && num(f.amount) && priceKrw ? num(f.amount) / priceKrw : 0;
  const save = () => {
    const shares = num(f.shares) || estShares;
    m.addTrade({ holdingId: f.holdingId, type: f.type, date: f.date, shares: String(Math.round(shares * 10000) / 10000), price: String(price), krw: String(num(f.amount) || ''), memo: f.memo.trim() });
    toast(`${h.ticker || h.name} ${f.type === 'sell' ? '매도' : '투자'} ${fmt(num(f.amount) || shares * priceKrw)}원 기록`);
    go('/');
  };
  const canSave = h && (num(f.amount) > 0 || num(f.shares) > 0) && (num(f.shares) > 0 || estShares > 0);
  return (
    <>
      <BackLink go={go} label="내 투자" />
      <Card title="오늘 투자했나요?">
        <Field label="종목" htmlFor="t-h">
          <select id="t-h" className="input" value={f.holdingId} onChange={(e) => (e.target.value === '__new' ? go('/add') : set({ holdingId: e.target.value }))}>
            {holdings.map((x) => <option key={x.id} value={x.id}>{x.name}{x.ticker && x.ticker !== x.name ? ` (${x.ticker})` : ''}</option>)}
            <option value="__new">+ 새 종목 추가</option>
          </select>
        </Field>
        <Field><Segmented label="매수/매도" options={[{ value: 'buy', label: '샀어요 (매수)' }, { value: 'sell', label: '팔았어요 (매도)' }]} value={f.type} onChange={(v) => set({ type: v })} /></Field>
        <Field label={f.type === 'sell' ? '받은 금액 (원)' : '투자한 금액 (원)'} htmlFor="t-amt"><MoneyInput id="t-amt" value={f.amount} onChange={(v) => set({ amount: v })} placeholder="예: 50,000" /></Field>
        <details className="more" style={{ marginTop: 0 }}>
          <summary>수량·단가·날짜 (선택)</summary>
          <div className="more-body">
            <div className="grid-2">
              <Field label="수량" htmlFor="t-sh"><MoneyInput id="t-sh" small decimal value={f.shares} onChange={(v) => set({ shares: v })} suffix="주" placeholder={estShares ? `약 ${fmtShares(estShares)}` : ''} /></Field>
              <Field label="1주 가격" htmlFor="t-pr"><MoneyInput id="t-pr" small decimal={usd} value={f.price} onChange={(v) => set({ price: v })} suffix={usd ? '$' : '원'} placeholder={h && num(h.currentPrice) ? String(h.currentPrice) : ''} /></Field>
            </div>
            <Field label="날짜" htmlFor="t-d"><input id="t-d" className="input" type="date" value={f.date} onChange={(e) => e.target.value && set({ date: e.target.value })} /></Field>
            <Field label="메모" htmlFor="t-m"><input id="t-m" className="input" style={{ fontWeight: 500, fontSize: 16 }} value={f.memo} maxLength={60} onChange={(e) => set({ memo: e.target.value })} placeholder="예: 9월 알바비 일부" /></Field>
          </div>
        </details>
        {estShares > 0 && <p className="field-hint">수량을 안 적어서 현재가 기준 약 {fmtShares(estShares)}주로 기록돼요.</p>}
        {h && !num(f.shares) && !priceKrw && num(f.amount) > 0 && <Notice level="warn">종목 현재가가 없어서 수량을 추정할 수 없어요. 수량을 입력해주세요.</Notice>}
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} disabled={!canSave} onClick={save}>저장</button>
      </Card>
    </>
  );
}

/* ── 배당 기록 ─────────────────────────── */
function DividendView({ m, tracker, go, toast }) {
  const holdings = m.state.holdings;
  const [f, setF] = useState({ holdingId: (holdings[0] && holdings[0].id) || '', date: todayKey(), amount: '', currency: 'KRW', memo: '' });
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const d = dividendStats(m.state);
  const wage = mainWage(tracker.state);
  const name = (id) => { const h = holdings.find((x) => x.id === id); return h ? (h.ticker || h.name) : '삭제된 종목'; };
  return (
    <>
      <BackLink go={go} label="내 투자" />
      <div className="tk-grid two">
        <Card title="배당 받았나요?">
          {!holdings.length ? (
            <><p>먼저 종목을 등록해주세요.</p><button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => go('/add')}>종목 추가</button></>
          ) : (
            <>
              <Field label="종목" htmlFor="d-h">
                <select id="d-h" className="input" value={f.holdingId} onChange={(e) => set({ holdingId: e.target.value })}>
                  {holdings.map((x) => <option key={x.id} value={x.id}>{x.name}{x.ticker && x.ticker !== x.name ? ` (${x.ticker})` : ''}</option>)}
                </select>
              </Field>
              <div className="grid-2">
                <Field label="받은 금액" htmlFor="d-amt"><MoneyInput id="d-amt" small decimal={f.currency === 'USD'} value={f.amount} onChange={(v) => set({ amount: v })} suffix={f.currency === 'USD' ? '$' : '원'} /></Field>
                <Field label="통화"><Segmented label="통화" options={[{ value: 'KRW', label: '원' }, { value: 'USD', label: '달러' }]} value={f.currency} onChange={(v) => set({ currency: v })} /></Field>
              </div>
              <Field label="받은 날" htmlFor="d-date"><input id="d-date" className="input" type="date" value={f.date} onChange={(e) => e.target.value && set({ date: e.target.value })} /></Field>
              <p className="field-hint" style={{ marginTop: -8 }}>세금이 빠지고 실제로 들어온 금액을 적어두면 좋아요.</p>
              <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} disabled={!num(f.amount)} onClick={() => { m.addDividend({ ...f, amount: String(num(f.amount)) }); toast(`${name(f.holdingId)} 배당 기록`); set({ amount: '' }); }}>배당 기록 저장</button>
            </>
          )}
        </Card>
        <Card title="💵 배당 기록">
          <div className="stat-grid">
            <div className="stat"><div className="k">이번 달</div><div className="v">{won(d.month)}</div></div>
            <div className="stat"><div className="k">올해 누적</div><div className="v">{won(d.year)}</div></div>
            <div className="stat wide"><div className="k">총 누적 배당</div><div className="v big">{won(d.total)}</div></div>
          </div>
          {d.total > 0 && wage > 0 && <div className="fun-line" style={{ marginTop: 12 }}>지금까지 받은 배당은 알바 약 <b>{hoursOfWork(d.total, wage)}시간</b>치예요.</div>}
          <div className="pay-list" style={{ marginTop: 14 }}>
            {d.list.map((x) => (
              <div className="pay-item" key={x.id}>
                <span>{x.date.replace(/-/g, '.')} · <b>{name(x.holdingId)}</b></span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <b className="num">{x.currency === 'USD' ? `$${x.amount}` : won(num(x.amount))}</b>
                  <button type="button" aria-label="배당 기록 삭제" style={{ border: 0, background: 'none', color: 'var(--ink-3)', fontSize: 18, padding: '0 2px 0 10px' }} onClick={() => { if (window.confirm('이 배당 기록을 삭제할까요?')) m.removeDividend(x.id); }}>×</button>
                </span>
              </div>
            ))}
            {!d.list.length && <p className="field-hint">아직 배당 기록이 없어요.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ── 종목 상세 ─────────────────────────── */
function StockView({ m, tracker, id, go, toast }) {
  const h = m.state.holdings.find((x) => x.id === id);
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState(h ? { name: h.name, ticker: h.ticker, currentPrice: h.currentPrice, annualDividend: h.annualDividend } : {});
  if (!h) return (<><BackLink go={go} label="내 투자" /><Card><p>종목을 찾을 수 없어요.</p></Card></>);
  const st = holdingStats(m.state, h);
  const usd = h.currency === 'USD';
  const wage = mainWage(tracker.state);
  return (
    <>
      <BackLink go={go} label="내 투자" />
      <div className="tk-grid two">
        <div className="tk-grid">
          <Card title={h.name || h.ticker} aside={h.ticker && h.ticker !== h.name ? h.ticker : ''}>
            <div className="stat-grid">
              <div className="stat"><div className="k">보유수량</div><div className="v">{fmtShares(st.shares)}주</div></div>
              <div className="stat"><div className="k">평균매수가</div><div className="v">{curPrice(st.avgPrice, h.currency)}</div></div>
              <div className="stat"><div className="k">투자원금</div><div className="v">{won(st.costKrw)}</div></div>
              <div className="stat"><div className="k">현재평가</div><div className="v">{won(st.valueKrw)}</div></div>
              <div className="stat"><div className="k">평가손익</div><div className={`v ${cls(st.pnl)}`}>{signWon(st.pnl)}</div></div>
              <div className="stat"><div className="k">수익률</div><div className={`v ${cls(st.pnl)}`}>{pct(st.pnlRate)}</div></div>
              <div className="stat"><div className="k">예상 연 배당</div><div className="v">{won(st.annualDivKrw)}</div></div>
              <div className="stat"><div className="k">받은 배당</div><div className="v">{won(st.dividendsKrw)}</div></div>
            </div>
            <p className="basis">현재가 {curPrice(h.currentPrice, h.currency)} · {h.priceUpdatedAt} 입력{usd ? ` · 환율 ${fmt(usdRate(m.state)) || '미입력'}원` : ''}{st.realized ? ` · 매도 실현손익 ${signWon(st.realized)}` : ''}</p>
            {st.dividendsKrw > 0 && wage > 0 && <div className="fun-line" style={{ marginTop: 12 }}>이 종목에서 받은 배당은 알바 약 <b>{hoursOfWork(st.dividendsKrw, wage)}시간</b>치예요.</div>}
            <div className="action-row" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-primary" onClick={() => go(`/buy/${h.id}`)}>+ 투자 기록</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEdit((v) => !v)}>가격·정보 수정</button>
            </div>
            {edit && (
              <div style={{ marginTop: 16 }}>
                <div className="grid-2">
                  <Field label="종목명" htmlFor="e-n"><input id="e-n" className="input sm" value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} /></Field>
                  <Field label="티커" htmlFor="e-t"><input id="e-t" className="input sm" value={f.ticker} onChange={(e) => setF((x) => ({ ...x, ticker: e.target.value.toUpperCase() }))} /></Field>
                </div>
                <div className="grid-2">
                  <Field label="현재가격" htmlFor="e-p"><MoneyInput id="e-p" small decimal={usd} value={f.currentPrice} onChange={(v) => setF((x) => ({ ...x, currentPrice: v }))} suffix={usd ? '$' : '원'} /></Field>
                  <Field label="1주당 연 배당" htmlFor="e-d"><MoneyInput id="e-d" small decimal={usd} value={f.annualDividend} onChange={(v) => setF((x) => ({ ...x, annualDividend: v }))} suffix={usd ? '$' : '원'} /></Field>
                </div>
                <button type="button" className="btn btn-primary btn-block" onClick={() => { m.updateHolding(h.id, { ...f, priceUpdatedAt: todayKey() }); setEdit(false); toast('수정했어요'); }}>저장</button>
                <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8, color: 'var(--bad)' }} onClick={() => { if (window.confirm(`${h.name} 종목과 매수·배당 기록을 모두 삭제할까요?`)) { m.removeHolding(h.id); toast('삭제했어요'); go('/'); } }}>종목 삭제</button>
              </div>
            )}
          </Card>
        </div>
        <div className="tk-grid">
          <Card title="매수·매도 기록">
            <div className="pay-list">
              {[...st.trades].reverse().map((t) => (
                <div className="pay-item" key={t.id}>
                  <span>{t.date.replace(/-/g, '.')} · {t.type === 'sell' ? '매도' : '매수'} {fmtShares(num(t.shares))}주{t.memo ? ` · ${t.memo}` : ''}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <b className="num">{won(num(t.krw) || num(t.shares) * toKrw(t.price, h.currency, m.state))}</b>
                    <button type="button" aria-label="기록 삭제" style={{ border: 0, background: 'none', color: 'var(--ink-3)', fontSize: 18, padding: '0 2px 0 10px' }} onClick={() => { if (window.confirm('이 기록을 삭제할까요?')) m.removeTrade(t.id); }}>×</button>
                  </span>
                </div>
              ))}
              {!st.trades.length && <p className="field-hint">아직 매수 기록이 없어요.</p>}
            </div>
          </Card>
          <Card title="배당 기록" aside={<button type="button" className="link-btn" onClick={() => go('/div')}>+ 배당 기록</button>}>
            <div className="pay-list">
              {st.dividends.map((x) => (
                <div className="pay-item" key={x.id}><span>{x.date.replace(/-/g, '.')}</span><b className="num">{x.currency === 'USD' ? `$${x.amount}` : won(num(x.amount))}</b></div>
              ))}
              {!st.dividends.length && <p className="field-hint">아직 배당 기록이 없어요.</p>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ── 현재가 한 번에 수정 ───────────────── */
function PricesView({ m, go, toast }) {
  const [vals, setVals] = useState(() => Object.fromEntries(m.state.holdings.map((h) => [h.id, h.currentPrice])));
  return (
    <>
      <BackLink go={go} label="내 투자" />
      <Card title="현재가 업데이트">
        <p className="field-hint" style={{ marginTop: -8, marginBottom: 14 }}>증권사 앱에서 보고 가끔 한 번씩 바꿔주세요. 평가금액과 수익률이 새 가격으로 계산돼요.</p>
        {m.state.holdings.map((h) => (
          <Field key={h.id} label={`${h.name}${h.ticker && h.ticker !== h.name ? ` (${h.ticker})` : ''}`} htmlFor={`pr-${h.id}`} hint={`마지막 입력 ${h.priceUpdatedAt}`}>
            <MoneyInput id={`pr-${h.id}`} small decimal={h.currency === 'USD'} value={vals[h.id] ?? ''} onChange={(v) => setVals((x) => ({ ...x, [h.id]: v }))} suffix={h.currency === 'USD' ? '$' : '원'} />
          </Field>
        ))}
        <button type="button" className="btn btn-primary btn-block" onClick={() => {
          m.state.holdings.forEach((h) => { if (String(vals[h.id]) !== String(h.currentPrice)) m.updateHolding(h.id, { currentPrice: vals[h.id], priceUpdatedAt: todayKey() }); });
          toast('현재가를 저장했어요'); go('/');
        }}>저장</button>
      </Card>
    </>
  );
}

/* ── 환율·백업 ─────────────────────────── */
export function BackupCard({ toast }) {
  const fileRef = useRef(null);
  const keys = ['juhyu-tracker-v1', 'juhyu-money-v1'];
  const exportAll = () => {
    const data = { app: 'juhyu', exportedAt: new Date().toISOString() };
    keys.forEach((k) => { try { data[k] = JSON.parse(window.localStorage.getItem(k) || 'null'); } catch (e) { data[k] = null; } });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `juhyu-money-backup-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importAll = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'juhyu') throw new Error('not juhyu');
      if (window.confirm('백업 파일로 알바비·투자 기록을 바꿀까요? (사진은 포함되지 않아요)')) {
        keys.forEach((k) => { if (data[k]) window.localStorage.setItem(k, JSON.stringify(data[k])); });
        toast('백업을 불러왔어요');
        setTimeout(() => window.location.reload(), 600);
      }
    } catch (err) { toast('백업 파일을 읽지 못했어요'); }
    e.target.value = '';
  };
  return (
    <Card title="전체 백업">
      <p className="field-hint" style={{ marginTop: -8 }}>알바비 기록과 투자·저축·배당 기록을 파일 하나로 저장해요. 기기를 바꿀 때 불러오세요.</p>
      <div className="action-row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-ghost" onClick={exportAll}>백업 저장</button>
        <button type="button" className="btn btn-ghost" onClick={() => fileRef.current && fileRef.current.click()}>불러오기</button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importAll} />
    </Card>
  );
}

function SettingsView({ m, go, toast }) {
  const [rate, setRate] = useState(m.state.settings.usdKrw || '');
  useEffect(() => { setRate(m.state.settings.usdKrw || ''); }, [m.state.settings.usdKrw]);
  return (
    <>
      <BackLink go={go} label="내 투자" />
      <Card title="달러 환율">
        <Field label="1달러 =" htmlFor="fx" hint="달러 종목의 평가금액·배당을 원화로 합산할 때 써요. 실제 환율을 보고 직접 입력하세요.">
          <MoneyInput id="fx" value={rate} onChange={setRate} placeholder="예: 1,400" />
        </Field>
        <button type="button" className="btn btn-primary btn-block" onClick={() => { m.setSettings({ usdKrw: String(num(rate)) }); toast('환율을 저장했어요'); }}>저장</button>
      </Card>
      <BackupCard toast={toast} />
    </>
  );
}

export default function InvestApp() {
  const m = useMoney();
  const tracker = useTracker();
  const { view, arg, go } = useHashRoute();
  const [msg, toast] = useToast();
  let body;
  if (!m.loaded) body = <Card><p className="field-hint" style={{ marginTop: 0 }}>불러오는 중…</p></Card>;
  else if (view === 'add') body = <AddHolding m={m} go={go} toast={toast} />;
  else if (view === 'buy') body = <TradeForm key={arg} m={m} go={go} toast={toast} holdingId={arg} />;
  else if (view === 'div') body = <DividendView m={m} tracker={tracker} go={go} toast={toast} />;
  else if (view === 'stock') body = <StockView key={arg} m={m} tracker={tracker} id={arg} go={go} toast={toast} />;
  else if (view === 'prices') body = <PricesView m={m} go={go} toast={toast} />;
  else if (view === 'settings') body = <SettingsView m={m} go={go} toast={toast} />;
  else body = <Dashboard m={m} tracker={tracker} go={go} />;
  return (
    <div>
      <div className="tk-top"><div className="tk-title"><small>JUHYU 알바부터 투자까지</small>투자 기록</div></div>
      {m.saveError && <Notice level="danger">저장 공간이 부족해 마지막 변경을 저장하지 못했어요.</Notice>}
      {body}
      <Toast msg={msg} />
    </div>
  );
}

