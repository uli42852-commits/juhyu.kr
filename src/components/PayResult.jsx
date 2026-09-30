import React from 'react';
import { Segmented, Notice, Basis, Won } from './ui.jsx';
import { fmt, h } from '../lib/pay.js';
import { MIN_WAGE_SOURCE, INSURANCE_SOURCE, DISCLAIMER } from '../lib/legal.js';

export function PeriodBar({ input, update, lockMonth = false }) {
  const shift = (delta) => update((s) => {
    const d = new Date(s.year, s.month - 1 + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  return (
    <div className="period-bar">
      {!lockMonth ? (
        <div style={{ width: 150 }}>
          <Segmented
            label="계산 기간"
            options={[{ value: 'month', label: '한 달' }, { value: 'week', label: '한 주' }]}
            value={input.period}
            onChange={(v) => update({ period: v })}
          />
        </div>
      ) : <span />}
      {input.period === 'month' && (
        <div className="month-nav">
          <button type="button" aria-label="이전 달" onClick={() => shift(-1)}>‹</button>
          <span>{input.year}년 {input.month}월</span>
          <button type="button" aria-label="다음 달" onClick={() => shift(1)}>›</button>
        </div>
      )}
    </div>
  );
}

export function ResultHeadline({ result, label }) {
  const periodText = result.period === 'week' ? '한 주' : `${result.month}월`;
  return (
    <div className="result-hero" aria-live="polite">
      <div className="result-label">{label || `${periodText} 예상 알바비 (세전)`}</div>
      <div className="result-big"><Won value={result.gross} /></div>
      <div className="result-sub">
        <span>근무 <b className="num">{result.workDays}일 · {h(result.workHours + result.extraHours)}시간</b></span>
        {result.deductions.length > 0 && <span>예상 실수령 <b className="num">{fmt(result.net)}원</b></span>}
        {result.conditionalExtra > 0 && <span>5인 이상이면 <b className="num">+{fmt(result.conditionalExtra)}원</b></span>}
      </div>
    </div>
  );
}

export function ResultItems({ result }) {
  return (
    <div className="items">
      {result.items.map((it) => {
        const zero = it.amount === 0;
        const cls = it.conditional ? 'cond' : zero ? 'zero' : '';
        return (
          <details className="item" key={it.key}>
            <summary>
              <span className="item-label">
                {it.label}
                {it.conditional && <span className="badge warn">5인 이상이면</span>}
                {it.key === 'juhyu' && result.juhyuWeeks > 0 && <span className="badge good">{result.period === 'week' ? '대상' : `${result.juhyuWeeks}주 대상`}</span>}
                <small>왜 이 금액인가요?</small>
              </span>
              <span className={`item-amt num ${cls}`}>{it.conditional ? '+' : ''}{fmt(it.amount)}원</span>
            </summary>
            <div className="item-body">
              <span className="formula">{it.formula}</span>
              <p>{it.why}</p>
              {it.key === 'juhyu' && result.period === 'month' && result.weekRows.length > 0 && (
                <div className="weeks">
                  {result.weekRows.map((w) => (
                    <div className="week-row" key={w.label}>
                      <span>{w.label} · {h(w.hours)}시간</span>
                      <span className="num">{w.eligible ? `주휴 ${h(w.juhyuHours)}시간` : '대상 아님'}</span>
                    </div>
                  ))}
                  <p className="basis">주는 월~일 기준이고, 일요일이 이 달에 있는 주의 주휴수당을 이 달에 넣었어요. 사업장의 급여 기간·주휴일에 따라 달라질 수 있어요.</p>
                </div>
              )}
              <Basis basis={it.basis} />
            </div>
          </details>
        );
      })}
      {result.period === 'month' && (
        <p className="basis" style={{ marginTop: 10 }}>
          공휴일·대체공휴일은 따로 반영하지 않았어요. 상시 5인 이상 사업장에서 근무일이 공휴일이면 쉬어도 유급이거나, 일하면 휴일근로 가산이 붙을 수 있어요.
        </p>
      )}
      <div className="total-row">
        <span>세전 합계</span>
        <span className="num">{fmt(result.gross)}원</span>
      </div>
      {result.deductions.length > 0 && (
        <>
          {result.deductions.map((d) => (
            <div className="deduct-row" key={d.key}>
              <span>− {d.label}</span>
              <span className="num">{fmt(d.amount)}원</span>
            </div>
          ))}
          <div className="total-row">
            <span>예상 실수령액</span>
            <span className="num" style={{ color: 'var(--primary)' }}>{fmt(result.net)}원</span>
          </div>
          <p className="basis">
            {result.deductions[0].key === 'pension'
              ? '4대보험은 가입 대상 여부(월 60시간 이상 등)와 보험료 상·하한에 따라 달라지고, 근로소득세는 포함하지 않았어요.'
              : '3.3%는 사업소득(프리랜서)으로 처리되는 경우예요. 실제로 근로자로 일했다면 적용 방식이 다를 수 있어요.'}
          </p>
          {result.deductions[0].key === 'pension' && <Basis basis={INSURANCE_SOURCE} prefix="요율" />}
        </>
      )}
    </div>
  );
}

export function ResultWarnings({ result }) {
  if (!result.warnings.length) return null;
  return result.warnings.map((w) => <Notice key={w.text} level={w.level === 'danger' ? 'danger' : 'info'}>{w.text}</Notice>);
}

export function ResultSources() {
  return (
    <p className="fineprint">
      최저임금 기준: <a href={MIN_WAGE_SOURCE.url} target="_blank" rel="noopener noreferrer">{MIN_WAGE_SOURCE.label}</a> ({MIN_WAGE_SOURCE.note}) · 확인일 {MIN_WAGE_SOURCE.checkedAt}
      <br />{DISCLAIMER}
    </p>
  );
}
