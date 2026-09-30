import React from 'react';
import { useMoney } from '../../lib/useMoney.js';
import { useTracker } from '../../lib/useTracker.js';
import { assetNow, monthFlow, dividendStats, portfolio } from '../../lib/money.js';
import { fmt } from '../../lib/pay.js';
import { todayKey } from '../../lib/tracker.js';
import { MoneyFlow, FunLines } from './Flow.jsx';

const won = (v) => `${fmt(v)}원`;

/* 홈: 저장된 기록이 있으면 내 돈 요약, 없으면 세 가지 시작 카드 */
export default function HomeMoney() {
  const m = useMoney();
  const t = useTracker();
  const loaded = m.loaded && t.loaded;
  const hasMoney = loaded && (m.state.holdings.length > 0 || m.state.savings.length > 0);
  const hasWork = loaded && (t.state.logs.length > 0 || t.state.payments.length > 0);
  const ym = todayKey().slice(0, 7);
  const f = loaded ? monthFlow(m.state, t.state, ym) : null;
  const a = loaded ? assetNow(m.state) : null;
  const p = loaded ? portfolio(m.state) : null;
  const d = loaded ? dividendStats(m.state) : null;

  const cards = [
    { href: hasWork ? '/tracker/' : '/tracker/#/start', ic: '💼', t: '알바비', d: '근무 기록 · 급여 확인', v: hasWork ? won(f.workReceived || f.workExpected) : '', vs: hasWork ? (f.workReceived ? '이번 달 입금' : '이번 달 예상') : '' },
    { href: '/invest/', ic: '📈', t: '투자', d: '종목 · 매수 · 배당 기록', v: hasMoney && p.list.length ? won(p.value) : '', vs: hasMoney && p.list.length ? '평가금액' : '' },
    { href: '/money/', ic: '💰', t: '내 자산', d: '돈의 흐름 · 자산 변화', v: hasMoney ? won(a.total) : '', vs: hasMoney ? '기록 자산' : '' },
  ];

  return (
    <>
      {(hasMoney || hasWork) && (
        <section className="home-sum" aria-label="내 돈 요약">
          <div className="result-label">현재 기록 자산</div>
          <div className="big">{won(a.total)}</div>
          <div className="stat-grid" style={{ marginTop: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <div className="stat"><div className="k">이번 달 알바</div><div className="v" style={{ fontSize: 16 }}>{won(f.workReceived || f.workExpected)}</div></div>
            <div className="stat"><div className="k">이번 달 투자</div><div className="v" style={{ fontSize: 16 }}>{won(f.invested)}</div></div>
            <div className="stat"><div className="k">이번 달 배당</div><div className="v" style={{ fontSize: 16 }}>{won(d.month)}</div></div>
          </div>
        </section>
      )}
      <div className="core-cards" style={{ marginTop: 12 }}>
        {cards.map((c) => (
          <a key={c.t} className="core-card" href={c.href}>
            <span className="ic" aria-hidden>{c.ic}</span>
            <span><span className="t">{c.t}</span><span className="d">{c.d}</span></span>
            {c.v && <span className="v">{c.v}<small>{c.vs}</small></span>}
          </a>
        ))}
      </div>
      {(hasMoney || hasWork) && (
        <section className="section" style={{ marginTop: 20 }}>
          <h2>이번 달 돈의 흐름</h2>
          <MoneyFlow f={f} />
          <div style={{ marginTop: 12 }}><FunLines f={f} /></div>
        </section>
      )}
    </>
  );
}
