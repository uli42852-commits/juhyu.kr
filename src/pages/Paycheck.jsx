import React, { useState } from 'react';
import { PageHead, Faq, Examples, Related, Section, Prose } from '../components/Sections.jsx';
import { Card, MoneyInput, Notice, PrivacyNote, Basis } from '../components/ui.jsx';
import PayForm from '../components/PayForm.jsx';
import { PeriodBar, ResultHeadline } from '../components/PayResult.jsx';
import Checklist from '../components/Checklist.jsx';
import { usePayInput } from '../lib/usePayInput.js';
import { useStoredState } from '../lib/storage.js';
import { PAYSLIP_FIELDS, parsePayslip, analyzePayslip } from '../lib/payslip.js';
import { fmt } from '../lib/pay.js';
import { LAW, DISCLAIMER } from '../lib/legal.js';

const SAMPLE = `2026년 11월 급여명세서
근무시간 78시간  시급 10,320원
기본급 804,960원
주휴수당 160,992원
지급합계 965,952원
소득세 28,970원  지방소득세 2,890원
공제합계 31,860원
실지급액 934,092원`;

const GROUPS = [
  { g: 'info', t: '근무 정보' },
  { g: 'pay', t: '지급 항목' },
  { g: 'deduct', t: '공제 항목' },
  { g: 'total', t: '합계' },
];

export const faq = [
  {
    q: '어떤 급여명세서든 붙여넣을 수 있나요?',
    a: ['"기본급 804,960" 처럼 항목 이름 옆에 금액이 있는 형태면 대부분 읽을 수 있어요. 양식이 달라 잘못 읽힌 항목은 아래 칸에서 직접 고치면 돼요. 사진 속 글자 인식(OCR)은 준비 중이에요.'],
  },
  {
    q: '명세서에 주휴수당 항목이 없어요.',
    a: ['주휴수당이 기본급에 포함돼 있거나 아예 지급되지 않은 경우예요. 기본급을 근무시간으로 나눈 금액이 시급보다 크면 포함됐을 가능성이 있어요. 애매하면 사업주에게 계산 방법을 물어보세요.'],
  },
  {
    q: '임금명세서에는 무엇이 적혀 있어야 하나요?',
    a: ['근로자 이름·생년월일 등 특정 정보, 임금 지급일, 임금 총액, 기본급·각종 수당 등 항목별 금액, 항목별 계산방법(연장·야간 등은 근로시간 수 포함), 공제 항목별 금액과 총액이 들어가야 해요.'],
  },
  {
    q: '명세서 내용이 서버에 올라가나요?',
    a: ['아니요. 붙여넣은 내용은 브라우저 안에서만 읽고 계산해요. 입력 칸의 숫자는 다음 방문을 위해 이 브라우저에만 저장돼요.'],
  },
];

export default function PaycheckPage() {
  const { input, update, result } = usePayInput();
  const [fields, setFields] = useStoredState('juhyu-payslip-v1', {});
  const [text, setText] = useState('');
  const [parsedCount, setParsedCount] = useState(null);

  const onParse = () => {
    const parsed = parsePayslip(text);
    const n = Object.keys(parsed).length;
    setParsedCount(n);
    if (n) setFields(Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, String(v)])));
  };

  const hasAny = Object.values(fields).some((v) => Number(v) > 0);
  const analysis = hasAny ? analyzePayslip(fields, result) : null;

  return (
    <div className="wrap">
      <PageHead
        pageKey="paycheck"
        eyebrow="급여명세서 분석"
        title="급여명세서, 제대로 계산됐을까?"
        lead="명세서 내용을 붙여넣거나 금액을 입력하면 항목별로 예상 금액과 비교하고, 명세서 합계가 맞는지도 검산해드려요."
      />

      <div className="calc-grid">
        <div>
          <Card title="명세서 붙여넣기" step="1" aside="선택">
            <textarea
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'카톡·문자·PDF에서 복사한 명세서 내용을 붙여넣으세요.\n예) 기본급 804,960원 주휴수당 160,992원 …'}
              aria-label="급여명세서 텍스트"
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={onParse} disabled={!text.trim()}>항목 읽어오기</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setText(SAMPLE)}>예시 넣어보기</button>
            </div>
            {parsedCount !== null && (
              <Notice level={parsedCount ? 'good' : 'warn'}>
                {parsedCount ? `${parsedCount}개 항목을 읽었어요. 아래에서 맞는지 확인하고 고쳐주세요.` : '읽을 수 있는 항목을 찾지 못했어요. 아래에 직접 입력해주세요.'}
              </Notice>
            )}
            <PrivacyNote />
          </Card>

          <Card title="명세서 금액" step="2" aside={hasAny ? <button type="button" className="link-btn" onClick={() => setFields({})}>모두 지우기</button> : '아는 것만 입력'}>
            {GROUPS.map(({ g, t }) => (
              <div key={g} style={{ marginBottom: 16 }}>
                <div className="field-label">{t}</div>
                <div className="grid-2">
                  {PAYSLIP_FIELDS.filter((f) => f.group === g).map((f) => (
                    <div key={f.key}>
                      <label htmlFor={`ps-${f.key}`} style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.label}</label>
                      <MoneyInput id={`ps-${f.key}`} small value={fields[f.key] ?? ''} suffix={f.unit} decimal={f.key === 'hours'} onChange={(v) => setFields((s) => ({ ...s, [f.key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          <Card title="예상 금액 기준 (내 근무 정보)" step="3">
            <details className="more" style={{ borderTop: 0, marginTop: 0 }}>
              <summary>시급 {fmt(result.wage)}원 · 주 {input.days.filter(Boolean).length}일 · {input.start}~{input.end} — 수정하기</summary>
              <div className="more-body"><PayForm input={input} update={update} conditionsOpen /></div>
            </details>
            <div style={{ marginTop: 16 }}>
              <PeriodBar input={input} update={update} />
              <ResultHeadline result={result} label="명세서 기간과 같은 기간으로 맞춰주세요" />
            </div>
          </Card>
        </div>

        <div className="sticky-col">
          <Card title="분석 결과" step="4" id="payslip-result">
            {!analysis && <p className="field-hint" style={{ marginTop: 0 }}>명세서 금액을 입력하면 여기에 비교 결과가 나와요.</p>}
            {analysis && (
              <>
                <Notice level="info">
                  <b>예상 기준</b>: {result.period === 'week' ? '한 주' : `${result.year}년 ${result.month}월`} · 시급 {fmt(result.wage)}원 · 주 {input.days.filter(Boolean).length}일 {input.start}~{input.end}.
                  명세서의 급여 기간·근무 조건과 다르면 3번에서 맞춰주세요.
                </Notice>
                {analysis.rows.length > 0 && (
                  <table className="table compact">
                    <thead>
                      <tr><th>항목</th><th className="r">명세서</th><th className="r">예상</th></tr>
                    </thead>
                    <tbody>
                      {analysis.rows.map((r) => {
                        const off = Math.abs(r.diff) > Math.max(1000, r.expected * 0.01);
                        return (
                          <tr key={r.label}>
                            <td>
                              {r.label}
                              {off && <span className={`badge ${r.diff > 0 ? 'warn' : 'gray'}`}>{r.diff > 0 ? `${fmt(r.diff)} 적음` : `${fmt(-r.diff)} 많음`}</span>}
                              {r.note && <span className="basis">{r.note}</span>}
                            </td>
                            <td className="r num">{fmt(r.actual)}</td>
                            <td className="r num">{fmt(r.expected)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {analysis.findings.map((f) => (
                  <Notice key={f.title} level={f.level === 'ok' ? 'good' : f.level === 'warn' ? 'warn' : 'info'}>
                    <b>{f.title}</b><br />{f.text}
                  </Notice>
                ))}
                <p className="fineprint">
                  "예상"은 입력한 근무 정보로 계산한 추정치예요. 차이가 있다면 먼저 명세서의 급여 기간과 근무시간이 입력과 같은지 확인해보세요. {DISCLAIMER}
                </p>
              </>
            )}
          </Card>
          <Card title="명세서 확인 체크리스트" step="5">
            <Checklist />
          </Card>
        </div>
      </div>

      <Examples
        title="명세서 읽는 예시"
        items={[
          {
            title: '주휴수당이 적게 들어간 경우',
            setup: '화목토 12:00~19:00(휴게 30분), 2026년 11월 · 명세서 주휴수당 160,992원',
            lines: [
              ['예상 주휴수당: 주당 3.9시간 × 5주 × 10,320원', '201,240원'],
              ['명세서 주휴수당', '160,992원'],
              ['차이', '40,248원 (주휴 1주분)'],
            ],
            note: '위 "예시 넣어보기"가 이 경우예요. 월말·월초에 걸친 주를 어느 달에 넣었는지에 따라 1주분 차이가 날 수 있어요.',
          },
        ]}
      />

      <Section title="급여명세서에서 꼭 볼 곳">
        <Prose>
          <p><strong>근무시간</strong>: 명세서의 총 근무시간이 내 출퇴근 기록과 같은지 먼저 보세요. 대부분의 차이는 여기서 시작돼요.</p>
          <p><strong>지급 항목</strong>: 기본급, 주휴수당, 야간·연장·휴일 수당이 나뉘어 있는지 확인하세요. 연장·야간 수당은 해당 근로시간도 함께 적혀 있어야 해요.</p>
          <p><strong>공제 항목</strong>: 3.3%(소득세+지방소득세)인지 4대보험인지, 그 외에 빠진 금액이 있는지 보세요. 법령이나 근로자 동의 없이 임의로 빼는 공제는 문제가 될 수 있어요.</p>
          <p><strong>실지급액</strong>: 지급 합계 − 공제 합계가 실지급액과 같고, 통장 입금액과도 같은지 확인하세요.</p>
          <Basis basis={LAW.payslip} />
        </Prose>
      </Section>

      <Faq items={faq} />
      <Related keys={['paycheckCheck', 'calculator', 'albaPay', 'guide']} />
    </div>
  );
}
