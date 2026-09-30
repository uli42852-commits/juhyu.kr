import React, { useState } from 'react';
import { Card, Field, MoneyInput, Segmented, Notice } from '../ui.jsx';
import { useHashRoute, useToast, Toast, BackLink, shareOrCopy } from '../tracker/common.jsx';
import { BackupCard } from '../invest/InvestApp.jsx';
import { useMoney } from '../../lib/useMoney.js';
import { useTracker } from '../../lib/useTracker.js';
import { assetNow, assetHistory, monthFlow, workIncomeUntil, pct } from '../../lib/money.js';
import { MoneyFlow, FunLines } from './Flow.jsx';
import { fmt, num } from '../../lib/pay.js';
import { todayKey, ymLabel, ymShift, minutesLabel } from '../../lib/tracker.js';

const won = (v) => `${fmt(v)}원`;
const signWon = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmt(Math.abs(v))}원`;

function AssetChart({ hist }) {
  const [sel, setSel] = useState(hist.length - 1);
  const max = Math.max(1, ...hist.map((h) => h.total));
  return (
    <div>
      <div className="bars" role="img" aria-label={`월별 기록 자산: ${hist.map((h) => `${Number(h.ym.slice(5))}월 ${fmt(h.total)}원`).join(', ')}`}>
        {hist.map((h, i) => (
          <button type="button" key={h.ym} className={i === hist.length - 1 ? 'cur' : ''} onClick={() => setSel(i)} aria-label={`${ymLabel(h.ym)} ${fmt(h.total)}원`}>
            {i === sel && <span className="tip">{h.total >= 10000 ? `${fmt(Math.round(h.total / 10000))}만` : fmt(h.total)}</span>}
            <span className="bar" style={{ height: `${Math.max(1, (h.total / max) * 100)}%` }} />
          </button>
        ))}
      </div>
      <div className="bar-labels" aria-hidden>{hist.map((h) => <span key={h.ym}>{Number(h.ym.slice(5))}월</span>)}</div>
      <details className="more">
        <summary>표로 보기</summary>
        <div className="more-body">
          {hist.map((h) => (
            <div className="deduct-row" key={h.ym}>
              <span>{ymLabel(h.ym)}{h.basis === 'cost' ? ' (투자원금 기준)' : h.basis === 'live' ? ' (지금)' : ''}</span>
              <span className="num">{fmt(h.total)}원</span>
            </div>
          ))}
          <p className="basis">지난달 투자자산은 그 달에 JUHYU를 열었을 때 기록된 평가금액이에요. 기록이 없는 달은 투자원금으로 계산했어요.</p>
        </div>
      </details>
    </div>
  );
}

/* ── 월간 리포트 ───────────────────────── */
export function MonthReport({ f, compact, onMore }) {
  const Row = ({ k, v, em }) => <div className={`report-row ${em ? 'em' : ''}`}><span>{k}</span><b>{v}</b></div>;
  return (
    <article className="report">
      <hr className="report-rule" />
      <h2 style={{ fontSize: 19, fontWeight: 850, textAlign: 'center' }}>{Number(f.ym.slice(5))}월 JUHYU 리포트</h2>
      <hr className="report-rule" />
      <p style={{ fontWeight: 800, marginTop: 6 }}>💼 알바</p>
      <Row k="근무시간" v={f.workMinutes ? minutesLabel(f.workMinutes) : '기록 없음'} />
      <Row k="예상 급여 (이 달 근무분)" v={won(f.workExpected)} />
      <Row k="실제 입금 (이 달 입금)" v={won(f.workReceived)} />
      {f.workDiff > 0 && <Row k="확인 필요" v={won(f.workDiff)} />}
      <p style={{ fontWeight: 800, marginTop: 12 }}>📈 투자</p>
      <Row k="투자금" v={won(f.invested)} />
      <Row k="현재 평가금액" v={won(f.investValue)} />
      <p style={{ fontWeight: 800, marginTop: 12 }}>💵 배당</p>
      <Row k="이번 달 배당" v={won(f.dividends)} />
      <p style={{ fontWeight: 800, marginTop: 12 }}>💰 자산</p>
      <Row k="이번 달 자산 변화" v={signWon(f.assetChange)} em />
      {!compact && <p className="fineprint">알바 예상 급여는 그 달에 일한 기록 기준, 실제 입금은 그 달 통장에 들어온 금액 기준이라 서로 다른 달의 급여일 수 있어요. 자산은 저축·투자자산·받은 배당만 더해요.</p>}
      {onMore && <button type="button" className="btn btn-ghost btn-block no-print" style={{ marginTop: 14 }} onClick={onMore}>자세히 보기</button>}
    </article>
  );
}

/* ── 저축 기록 ─────────────────────────── */
function SavingsView({ m, go, toast }) {
  const [f, setF] = useState({ date: todayKey(), amount: '', type: 'save', memo: '' });
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const list = [...m.state.savings].sort((a, b) => b.date.localeCompare(a.date));
  const total = m.state.savings.reduce((s, x) => s + (x.type === 'withdraw' ? -num(x.amount) : num(x.amount)), 0);
  return (
    <>
      <BackLink go={go} label="내 자산" />
      <div className="tk-grid two">
        <Card title="이번 달 얼마 모았나요?">
          <Field><Segmented label="저축/인출" options={[{ value: 'save', label: '모았어요' }, { value: 'withdraw', label: '꺼내 썼어요' }]} value={f.type} onChange={(v) => set({ type: v })} /></Field>
          <Field label="금액" htmlFor="sv-amt"><MoneyInput id="sv-amt" value={f.amount} onChange={(v) => set({ amount: v })} placeholder="예: 300,000" /></Field>
          <div className="grid-2">
            <Field label="날짜" htmlFor="sv-d"><input id="sv-d" className="input" type="date" value={f.date} onChange={(e) => e.target.value && set({ date: e.target.value })} /></Field>
            <Field label="메모 (선택)" htmlFor="sv-m"><input id="sv-m" className="input" style={{ fontWeight: 500, fontSize: 16 }} value={f.memo} maxLength={40} onChange={(e) => set({ memo: e.target.value })} placeholder="예: 적금" /></Field>
          </div>
          <p className="field-hint" style={{ marginTop: -6 }}>투자한 돈은 여기 말고 투자 기록에 적어주세요. 둘이 겹치면 자산이 두 번 더해져요.</p>
          <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} disabled={!num(f.amount)} onClick={() => { m.addSaving({ ...f, amount: String(num(f.amount)) }); toast(`${f.type === 'withdraw' ? '인출' : '저축'} ${fmt(num(f.amount))}원 기록`); set({ amount: '', memo: '' }); }}>저장</button>
        </Card>
        <Card title="🐷 저축 기록" aside={`잔액 ${won(total)}`}>
          <div className="pay-list">
            {list.map((x) => (
              <div className="pay-item" key={x.id}>
                <span>{x.date.replace(/-/g, '.')} · {x.type === 'withdraw' ? '인출' : '저축'}{x.memo ? ` · ${x.memo}` : ''}</span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <b className="num">{x.type === 'withdraw' ? '−' : '+'}{fmt(num(x.amount))}원</b>
                  <button type="button" aria-label="저축 기록 삭제" style={{ border: 0, background: 'none', color: 'var(--ink-3)', fontSize: 18, padding: '0 2px 0 10px' }} onClick={() => { if (window.confirm('이 기록을 삭제할까요?')) m.removeSaving(x.id); }}>×</button>
                </span>
              </div>
            ))}
            {!list.length && <p className="field-hint">아직 저축 기록이 없어요.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}

function ReportView({ m, tracker, ym, go, toast }) {
  const f = monthFlow(m.state, tracker.state, ym);
  const text = [
    `${f.ym.slice(5).replace(/^0/, '')}월 JUHYU 리포트`,
    `💼 알바 근무 ${minutesLabel(f.workMinutes)} · 예상 ${fmt(f.workExpected)}원 · 입금 ${fmt(f.workReceived)}원`,
    `📈 투자 ${fmt(f.invested)}원 · 평가 ${fmt(f.investValue)}원`,
    `💵 배당 ${fmt(f.dividends)}원`,
    `💰 자산 변화 ${signWon(f.assetChange)}`,
    '— juhyu.kr',
  ].join('\n');
  return (
    <>
      <BackLink go={go} label="내 자산" />
      <div className="month-nav no-print" style={{ marginBottom: 12 }}>
        <button type="button" aria-label="이전 달" onClick={() => go(`/report/${ymShift(ym, -1)}`)}>‹</button>
        <span>{ymLabel(ym)}</span>
        <button type="button" aria-label="다음 달" onClick={() => go(`/report/${ymShift(ym, 1)}`)}>›</button>
      </div>
      <div className="tk-grid two">
        <MonthReport f={f} />
        <div className="tk-grid">
          <Card title="돈의 흐름"><MoneyFlow f={f} /></Card>
          <FunLines f={f} />
          <div className="action-row no-print">
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>프린트 / PDF</button>
            <button type="button" className="btn btn-primary" onClick={async () => { const r = await shareOrCopy('JUHYU 리포트', text); if (r === 'copied') toast('리포트를 복사했어요'); }}>공유하기</button>
          </div>
        </div>
      </div>
    </>
  );
}

function Dashboard({ m, tracker, go, toast }) {
  const a = assetNow(m.state);
  const ym = todayKey().slice(0, 7);
  const f = monthFlow(m.state, tracker.state, ym);
  const hist = assetHistory(m.state, 6);
  const workTotal = workIncomeUntil(tracker.state, '9999-12');
  const empty = !m.state.holdings.length && !m.state.savings.length && !tracker.state.payments.length && !tracker.state.logs.length;
  return (
    <div className="tk-grid two">
      <div className="tk-grid">
        <Card>
          <div className="result-label">💰 현재 기록 자산</div>
          <div className="result-big num">{fmt(a.total)}<span className="unit">원</span></div>
          <p className="basis">저축 {won(a.savings)} + 투자자산 {won(a.investValue)} + 받은 배당 {won(a.dividends)}</p>
          <div className="stat-grid" style={{ marginTop: 16 }}>
            <div className="stat"><div className="k">총 알바 수입</div><div className="v">{won(workTotal)}</div></div>
            <div className="stat"><div className="k">저축</div><div className="v">{won(a.savings)}</div></div>
            <div className="stat"><div className="k">총 투자금</div><div className="v">{won(a.invested)}</div></div>
            <div className="stat"><div className="k">현재 투자자산</div><div className="v">{won(a.investValue)}</div></div>
            <div className="stat"><div className="k">누적 배당</div><div className="v">{won(a.dividends)}</div></div>
            <div className="stat"><div className="k">평가손익</div><div className={`v ${a.portfolio.pnl > 0 ? 'up' : a.portfolio.pnl < 0 ? 'down' : ''}`}>{signWon(a.portfolio.pnl)}</div></div>
          </div>
          <p className="basis" style={{ marginTop: 10 }}>총 알바 수입은 알바비 추적에 입력한 실제 입금액 합계예요. 번 돈 중 저축·투자로 옮긴 만큼만 자산에 더해요.</p>
        </Card>
        {empty && (
          <Notice level="info">아직 기록이 없어요. 알바비를 기록하고, 모은 돈과 투자를 적으면 내 돈의 흐름이 여기에 쌓여요.</Notice>
        )}
        <div className="action-row">
          <button type="button" className="btn btn-primary" onClick={() => go('/save')}>+ 저축 기록</button>
          <a className="btn btn-ghost" href="/invest/#/buy">+ 투자 기록</a>
        </div>
        <Card title="이번 달 내가 만든 돈" aside={ymLabel(ym)}>
          <div className="deduct-row"><span>💼 알바 수입 (입금)</span><b className="num">{won(f.workReceived)}</b></div>
          <div className="deduct-row"><span>📈 평가손익 (지금까지)</span><b className={`num ${a.portfolio.pnl > 0 ? 'up' : a.portfolio.pnl < 0 ? 'down' : ''}`}>{signWon(a.portfolio.pnl)}</b></div>
          <div className="deduct-row"><span>💵 배당 (이번 달)</span><b className="num">{won(f.dividends)}</b></div>
          <p className="basis" style={{ marginTop: 8 }}>노동으로 번 돈, 투자 평가손익, 배당은 성격이 달라서 합치지 않고 따로 보여드려요. 평가손익은 팔기 전까지 확정된 돈이 아니에요.</p>
        </Card>
        <FunLines f={f} />
      </div>
      <div className="tk-grid">
        <Card title="이번 달 돈의 흐름"><MoneyFlow f={f} /></Card>
        <Card title="자산 변화" aside="최근 6개월">
          {hist.filter((h) => h.total > 0).length >= 2 ? (
            <>
              <AssetChart hist={hist} />
              <p className="basis">지난달보다 {signWon(hist[hist.length - 1].total - hist[hist.length - 2].total)}</p>
            </>
          ) : (
            <p className="field-hint" style={{ marginTop: 0 }}>이번 달 자산 {won(a.total)}이 기록됐어요. 다음 달부터 월별 변화가 그래프로 쌓여요.</p>
          )}
        </Card>
        <MonthReport f={f} compact onMore={() => go(`/report/${ym}`)} />
        <BackupCard toast={toast} />
        <p className="fineprint">JUHYU는 직접 입력한 기록을 정리해 보여주는 도구예요. 투자 권유나 금융 자문이 아니며, 평가금액은 입력한 가격 기준이에요. 수익률 {pct(a.portfolio.pnlRate)}은 입력한 현재가 기준이에요.</p>
      </div>
    </div>
  );
}

export default function MoneyApp() {
  const m = useMoney();
  const tracker = useTracker();
  const { view, arg, go } = useHashRoute();
  const [msg, toast] = useToast();
  const ymArg = /^\d{4}-\d{2}$/.test(arg) ? arg : todayKey().slice(0, 7);
  let body;
  if (!m.loaded || !tracker.loaded) body = <Card><p className="field-hint" style={{ marginTop: 0 }}>불러오는 중…</p></Card>;
  else if (view === 'save') body = <SavingsView m={m} go={go} toast={toast} />;
  else if (view === 'report') body = <ReportView m={m} tracker={tracker} ym={ymArg} go={go} toast={toast} />;
  else body = <Dashboard m={m} tracker={tracker} go={go} toast={toast} />;
  return (
    <div>
      <div className="tk-top"><div className="tk-title"><small>JUHYU 알바부터 투자까지</small>내 자산</div></div>
      {m.saveError && <Notice level="danger">저장 공간이 부족해 마지막 변경을 저장하지 못했어요.</Notice>}
      {body}
      <Toast msg={msg} />
    </div>
  );
}
