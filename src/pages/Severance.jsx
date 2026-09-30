import React from 'react';
import { PageHead, Faq, Related, Examples } from '../components/Sections.jsx';
import { Card, Field, MoneyInput, Segmented, Notice, Basis, PrivacyNote } from '../components/ui.jsx';
import { useStoredState } from '../lib/storage.js';
import { fmt, num } from '../lib/pay.js';
import { LAW, DISCLAIMER } from '../lib/legal.js';

/* 기존 퇴직금 계산기 — 저장 키 juhyu-severance-calc-v1 유지 */
export function severanceCalc({ startDate, endDate, wage3m, avgHours15 }) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const valid = !!(start && end && end > start);
  const workedDays = valid ? Math.round((end - start) / 86400000) : 0;
  let daysIn3Months = 0;
  if (end) {
    const from = new Date(end);
    from.setMonth(from.getMonth() - 3);
    daysIn3Months = Math.round((end - from) / 86400000) || 1;
  }
  const avgDailyWage = daysIn3Months ? num(wage3m) / daysIn3Months : 0;
  const eligibleByYear = workedDays >= 365;
  const eligible = eligibleByYear && avgHours15 !== false;
  const severance = eligible ? avgDailyWage * 30 * (workedDays / 365) : 0;
  return { valid, workedDays, daysIn3Months, avgDailyWage, eligibleByYear, eligible, severance };
}

export const faq = [
  {
    q: '알바도 퇴직금을 받을 수 있나요?',
    a: ['같은 사업장에서 1년 이상 계속 일했고, 4주 평균 1주 소정근로시간이 15시간 이상이면 알바도 퇴직금을 받을 수 있어요. 사업장 규모(5인 미만 포함)와 관계없이 적용돼요.'],
  },
  {
    q: '퇴직금은 어떻게 계산하나요?',
    a: ['1일 평균임금 × 30일 × (재직일수 ÷ 365)예요. 1일 평균임금은 퇴직 전 3개월 동안 받은 임금 총액을 그 기간 일수로 나눈 금액이에요.', '상여금·연차수당 반영, 평균임금이 통상임금보다 낮은 경우 등은 계산이 달라질 수 있어요.'],
  },
  {
    q: '퇴직금은 언제까지 받아야 하나요?',
    a: ['퇴직한 날부터 14일 이내에 지급하는 것이 원칙이에요. 당사자 합의가 있으면 기일을 연장할 수 있어요.'],
  },
];

function SeveranceCalculator() {
  const [s, setS] = useStoredState('juhyu-severance-calc-v1', { startDate: '', endDate: '', wage3m: '', avgHours15: true });
  const set = (p) => setS((x) => ({ ...x, ...p }));
  const r = severanceCalc(s);
  return (
    <div className="calc-grid" id="calc">
      <Card title="근무 정보" step="1">
        <div className="grid-2">
          <Field label="입사일" htmlFor="sv-s"><input id="sv-s" className="input" type="date" value={s.startDate} onChange={(e) => set({ startDate: e.target.value })} /></Field>
          <Field label="퇴사일(예정)" htmlFor="sv-e"><input id="sv-e" className="input" type="date" value={s.endDate} onChange={(e) => set({ endDate: e.target.value })} /></Field>
        </div>
        <Field label="퇴사 전 3개월간 받은 총 급여 (세전)" htmlFor="sv-w" hint="급여명세서나 통장 입금 내역에서 최근 3개월치를 더해 입력하세요.">
          <MoneyInput id="sv-w" value={s.wage3m} onChange={(v) => set({ wage3m: v })} placeholder="예: 3,000,000" />
        </Field>
        <Field label="재직 기간 내내 주 평균 15시간 이상 일했나요?">
          <Segmented label="주 15시간 이상 여부" options={[{ value: true, label: '네' }, { value: false, label: '미만인 시기가 있어요' }]} value={s.avgHours15 !== false} onChange={(v) => set({ avgHours15: v })} />
        </Field>
        <PrivacyNote />
      </Card>
      <div className="sticky-col">
        <Card title="예상 퇴직금" step="2">
          {!r.valid ? (
            <p className="field-hint" style={{ marginTop: 0 }}>입사일과 퇴사일을 입력하면 계산돼요.</p>
          ) : (
            <>
              <div className="result-label">예상 퇴직금 (세전)</div>
              <div className="result-big num">{fmt(r.severance)}<span className="unit">원</span></div>
              <div className="items">
                <div className="deduct-row"><span>재직일수</span><span className="num">{fmt(r.workedDays)}일</span></div>
                <div className="deduct-row"><span>1일 평균임금 (3개월 {r.daysIn3Months}일)</span><span className="num">{fmt(r.avgDailyWage)}원</span></div>
                <div className="deduct-row"><span>평균임금 × 30 × 재직일수 ÷ 365</span><span className="num">{fmt(r.severance)}원</span></div>
              </div>
              <Notice level={r.eligible ? 'good' : 'warn'}>
                {r.eligible && <b>퇴직금 지급 대상이에요.</b>}
                {!r.eligibleByYear && <><b>아직 지급 대상이 아니에요.</b> 같은 사업장에서 1년(365일) 이상 근무해야 퇴직금이 발생해요.</>}
                {r.eligibleByYear && s.avgHours15 === false && <><b>확인이 필요해요.</b> 4주 평균 주 15시간 미만이었던 기간은 계속근로기간에서 빠질 수 있어요.</>}
              </Notice>
            </>
          )}
          <Basis basis={LAW.severance} />
          <p className="fineprint">{DISCLAIMER}</p>
        </Card>
      </div>
    </div>
  );
}

export default function SeverancePage() {
  return (
    <div className="wrap">
      <PageHead pageKey="severance" eyebrow="퇴직금" title="알바 퇴직금 계산기" lead="1년 이상, 주 평균 15시간 이상 일했다면 알바도 퇴직금을 받을 수 있어요. 입사일·퇴사일과 최근 3개월 급여로 예상 금액을 계산해보세요." />
      <SeveranceCalculator />
      <Examples
        items={[{
          title: '1년 6개월 근무, 최근 3개월 급여 300만원',
          lines: [['1일 평균임금: 3,000,000원 ÷ 92일', '약 32,609원'], ['× 30일 × (548 ÷ 365)', '약 1,468,700원']],
          note: '3개월 일수는 퇴사일에 따라 89~92일로 달라져요.',
        }]}
      />
      <Faq items={faq} />
      <Related keys={['calculator', 'paycheckCheck', 'guide', 'albaPay']} />
    </div>
  );
}
