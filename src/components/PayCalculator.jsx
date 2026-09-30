import React, { useEffect, useRef, useState } from 'react';
import { Card, PrivacyNote } from './ui.jsx';
import PayForm, { WageField, DaysField, TimeFields, ConditionFields } from './PayForm.jsx';
import { PeriodBar, ResultHeadline, ResultItems, ResultWarnings, ResultSources } from './PayResult.jsx';
import { VerifyInput, VerifyResult } from './VerifyPanel.jsx';
import MonthCalendar from './MonthCalendar.jsx';
import Checklist from './Checklist.jsx';
import { usePayInput } from '../lib/usePayInput.js';
import { fmt } from '../lib/pay.js';

/* 모바일에서 결과 카드가 화면 밖에 있을 때만 하단에 요약 금액을 띄운다 */
function StickySummary({ targetId, label, value }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting || e.boundingClientRect.top < 0), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);
  return (
    <div className={`sticky-sum ${hidden ? 'hide' : ''}`} aria-hidden={hidden}>
      <div>
        <div className="l">{label}</div>
        <div className="v num">{fmt(value)}원</div>
      </div>
      <a className="btn btn-primary btn-sm" href={`#${targetId}`} tabIndex={hidden ? -1 : 0}>결과 보기</a>
    </div>
  );
}

/**
 * variant
 *  - 'full'    : 종합 급여 계산기 (메인, /calculator)
 *  - 'monthly' : 이번 달 예상 알바비 (달력 포함)
 *  - 'verify'  : 받은 금액 검증을 앞에 둔 형태
 */
export default function PayCalculator({ variant = 'full', showChecklist = true, sticky = true }) {
  const { input, update, result, verify, reset } = usePayInput();
  const monthly = variant === 'monthly';
  const verifyFirst = variant === 'verify';
  const didForce = useRef(false);

  useEffect(() => {
    if (monthly && !didForce.current) {
      didForce.current = true;
      update({ period: 'month' });
    }
  }, [monthly]); // eslint-disable-line react-hooks/exhaustive-deps

  const resultId = `result-${variant}`;

  return (
    <div className="calc-grid" id="calc">
      <div>
        {verifyFirst && (
          <Card title="실제로 받은 금액" step="1">
            <VerifyInput input={input} update={update} />
          </Card>
        )}
        <Card title="근무 정보" step={verifyFirst ? '2' : '1'} aside={<button type="button" className="link-btn" onClick={reset}>초기화</button>}>
          {monthly ? (
            <>
              <WageField input={input} update={update} />
              <DaysField input={input} update={update} />
              <TimeFields input={input} update={update} />
              <ConditionFields input={input} update={update} />
            </>
          ) : (
            <PayForm input={input} update={update} />
          )}
          <PrivacyNote />
        </Card>
        {monthly && (
          <Card title={`${input.month}월 근무 달력`} step="2" aside="날짜를 눌러 변경">
            <MonthCalendar input={input} update={update} />
          </Card>
        )}
      </div>

      <div className="sticky-col">
        <Card id={resultId} title={verifyFirst ? '비교 결과' : '계산 결과'} step={monthly || verifyFirst ? '3' : '2'}>
          <PeriodBar input={input} update={update} lockMonth={monthly} />
          {verifyFirst && <VerifyResult verify={verify} result={result} />}
          <div style={verifyFirst ? { marginTop: 18 } : undefined}>
            <ResultHeadline result={result} label={monthly ? `${input.month}월 예상 알바비 (세전)` : undefined} />
          </div>
          <ResultWarnings result={result} />
          <ResultItems result={result} />
          <ResultSources />
        </Card>

        {!verifyFirst && (
          <Card title="내 급여 검증" step="3" aside="선택">
            <p className="field-hint" style={{ marginTop: -8, marginBottom: 14 }}>실제로 받은 금액을 넣으면 예상 금액과 비교해드려요.</p>
            <VerifyInput input={input} update={update} />
            <VerifyResult verify={verify} result={result} />
            <p className="fineprint">급여명세서가 있다면 <a href="/paycheck/">급여명세서 확인</a>에서 항목별로 비교할 수 있어요.</p>
          </Card>
        )}

        {showChecklist && (
          <Card title="급여 확인 체크리스트" step="4">
            <Checklist compact />
          </Card>
        )}
      </div>

      {sticky && <StickySummary targetId={resultId} label={monthly ? `${input.month}월 예상 알바비` : '예상 알바비 (세전)'} value={result.gross} />}
    </div>
  );
}
