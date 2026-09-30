import React from 'react';
import { Field, MoneyInput, Segmented } from './ui.jsx';
import { fmt } from '../lib/pay.js';
import { HELP_LINE } from '../lib/legal.js';

export function VerifyInput({ input, update }) {
  return (
    <>
      <Field label="실제로 받은 금액" htmlFor="actual">
        <MoneyInput id="actual" value={input.actual} onChange={(v) => update({ actual: v })} placeholder="예: 1,430,000" />
      </Field>
      <Field label="이 금액은…" hint="통장 입금액이면 공제 후 금액, 명세서의 지급 합계면 공제 전 금액과 비교해요.">
        <Segmented
          label="비교 기준"
          options={[{ value: 'net', label: '통장에 들어온 돈' }, { value: 'gross', label: '명세서 세전 합계' }]}
          value={input.actualBasis}
          onChange={(v) => update({ actualBasis: v })}
        />
      </Field>
    </>
  );
}

export function VerifyResult({ verify, result }) {
  if (!verify) {
    return <p className="field-hint">받은 금액을 넣으면 예상 금액과 비교해서 무엇을 확인해야 하는지 알려드려요.</p>;
  }
  const { status, expected, actual, abs, hints, checks, basis } = verify;
  const expLabel = basis === 'gross' ? '예상 세전 금액' : result.deductions.length ? '예상 실수령액' : '예상 금액 (공제 전)';
  return (
    <div className={`verify-result ${status}`} aria-live="polite">
      <div className="vs">
        <div>{expLabel}<span className="num">{fmt(expected)}원</span></div>
        <div>실제 받은 금액<span className="num">{fmt(actual)}원</span></div>
      </div>
      <div className="diff-line">
        {status === 'match' && <>예상과 거의 같아요 <span aria-hidden>👍</span></>}
        {status === 'less' && <>예상보다 <span className="num">{fmt(abs)}원</span> 적어요</>}
        {status === 'more' && <>예상보다 <span className="num">{fmt(abs)}원</span> 많아요</>}
      </div>
      {status === 'match' && (
        <p className="field-hint" style={{ color: 'inherit' }}>입력한 근무 조건으로 계산한 금액과 차이가 거의 없어요. 급여명세서의 항목별 금액도 한 번 확인해두면 좋아요.</p>
      )}
      {status !== 'match' && (
        <p style={{ fontSize: 14, marginTop: 6 }}>
          차이가 났다고 바로 잘못 지급된 것은 아니에요. 입력한 조건과 실제 근무·계약이 다를 수 있으니 아래 항목을 확인해보세요.
        </p>
      )}
      {status === 'less' && basis === 'net' && result.deductions.length === 0 && (
        <p style={{ fontSize: 14, marginTop: 6 }}>지금은 공제 없이 비교하고 있어요. 3.3%나 4대보험이 빠진다면 위 &lsquo;더 정확하게&rsquo;에서 공제 방식을 선택해보세요.</p>
      )}
      {hints.length > 0 && <ul className="hint-list">{hints.map((t) => <li key={t}>{t}</li>)}</ul>}
      {checks.length > 0 && (
        <>
          <p style={{ fontSize: 14.5, fontWeight: 800, marginTop: 14 }}>다음 항목을 확인해보세요</p>
          <ul className="check-list">{checks.map((t) => <li key={t}>{t}</li>)}</ul>
        </>
      )}
      {status === 'less' && (
        <p className="fineprint" style={{ color: 'inherit', opacity: 0.8 }}>
          확인 후에도 차이가 설명되지 않으면 급여명세서를 요청해 항목별로 비교해보세요(사업주는 임금명세서를 교부해야 해요). 상담이 필요하면 {HELP_LINE}.
        </p>
      )}
    </div>
  );
}
