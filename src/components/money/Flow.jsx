import React from 'react';
import { hoursOfWork } from '../../lib/money.js';
import { fmt } from '../../lib/pay.js';

const won = (v) => `${fmt(v)}원`;

/* 이번 달 돈의 흐름: 알바 → 저축 → 투자(종목) → 투자자산 → 배당 */
export function MoneyFlow({ f }) {
  const Step = ({ ic, label, value, sub, dim, em }) => (
    <div className={`flow-step ${dim ? 'dim' : ''} ${em ? 'em' : ''}`}>
      <span className="l"><span className="ic" aria-hidden>{ic}</span>{label}</span>
      <span className="v">{value}{sub && <small>{sub}</small>}</span>
    </div>
  );
  const Arrow = () => <div className="flow-arrow" aria-hidden>↓</div>;
  const work = f.workReceived || f.workExpected;
  return (
    <div className="flow" aria-label={`${Number(f.ym.slice(5))}월 돈의 흐름`}>
      <Step ic="💼" label="알바" value={won(work)} sub={f.workReceived ? '실제 입금' : f.workExpected ? '기록 기준 예상' : '기록 없음'} dim={!work} />
      <Arrow />
      <Step ic="🐷" label="저축" value={won(f.saved)} dim={!f.saved} />
      <Arrow />
      <Step ic="📈" label="투자" value={won(f.invested)} dim={!f.invested} />
      {f.investParts.length > 0 && <div className="flow-parts">{f.investParts.slice(0, 4).map((p) => <span key={p.id}>{p.label} {fmt(p.amount)}</span>)}{f.investParts.length > 4 && <span>기타 {fmt(f.investParts.slice(4).reduce((s, p) => s + p.amount, 0))}</span>}</div>}
      <Arrow />
      <Step ic="🏦" label="투자자산" value={won(f.investValue)} sub="현재 평가" dim={!f.investValue} />
      <Arrow />
      <Step ic="💵" label="배당" value={won(f.dividends)} dim={!f.dividends} em={f.dividends > 0} />
    </div>
  );
}

/* 알바시간 환산 문구 — 시급 기준 단순 환산임을 밝힌다 */
export function FunLines({ f }) {
  const lines = [];
  const work = f.workReceived || f.workExpected;
  if (work && f.invested) lines.push(<>이번 달 알바로 번 돈의 <b>{Math.round((f.invested / work) * 100)}%</b>를 투자했어요.</>);
  const invH = hoursOfWork(f.invested, f.wage);
  if (invH) lines.push(<>이번 달 약 <b>{invH}시간</b>의 알바가 투자자산으로 바뀌었어요.</>);
  const divH = hoursOfWork(f.dividends, f.wage);
  if (divH) lines.push(<>이번 달 배당금은 알바 약 <b>{divH}시간</b>치 수입과 같아요.</>);
  if (!lines.length) return null;
  return (
    <div>
      {lines.map((l, i) => <div className="fun-line" key={i}>{l}</div>)}
      {f.wage > 0 && <p className="basis">시급 {fmt(f.wage)}원 기준 단순 환산이에요.</p>}
    </div>
  );
}
