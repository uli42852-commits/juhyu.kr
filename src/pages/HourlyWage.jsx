import React from 'react';
import { PageHead, Faq, Examples, Related, Section, Prose } from '../components/Sections.jsx';
import { Card, Field, MoneyInput, Segmented, Notice, PrivacyNote } from '../components/ui.jsx';
import { useStoredState } from '../lib/storage.js';
import { fmt, h, num, monthlyFromWeekly, WEEKS_PER_MONTH } from '../lib/pay.js';
import { CURRENT_MIN_WAGE, CURRENT_YEAR, minWageFor } from '../lib/legal.js';

export const faq = [
  {
    q: '시급을 월급으로 바꾸면 얼마인가요?',
    a: ['(주 근무시간 + 주휴시간) × 약 4.345주 × 시급으로 계산해요. 주 40시간이면 월 약 209시간이라, 2026년 최저시급 기준 월 2,156,880원이에요.'],
  },
  {
    q: '4.345주는 어디서 나온 숫자인가요?',
    a: ['1년 365일 ÷ 7일 ÷ 12개월 ≈ 4.345주예요. 한 달 평균 주 수라서, 실제 달력으로 계산하면 달마다 조금씩 달라요. 특정 달 금액은 이번 달 알바비 계산기가 더 정확해요.'],
  },
  {
    q: '월급을 시급으로 바꿔서 최저임금인지 확인하려면요?',
    a: ['월급 ÷ 월 유급시간(주 근무시간 + 주휴시간 × 4.345)으로 나누면 돼요. 주 40시간이면 209시간으로 나눠요. 식대 등 일부 수당은 최저임금 계산에서 빠질 수 있어서 기본급 기준으로 비교하는 게 안전해요.'],
  },
];

function Converter() {
  const [s, setS] = useStoredState('juhyu-hourly-v1', { mode: 'toPay', wage: String(CURRENT_MIN_WAGE), dayHours: '6', weekDays: '5', monthly: '' });
  const set = (p) => setS((x) => ({ ...x, ...p }));
  const wage = num(s.wage);
  const weeklyHours = num(s.dayHours) * num(s.weekDays);
  const m = monthlyFromWeekly(weeklyHours, wage);
  const monthlyPaidHours = monthlyFromWeekly(weeklyHours, 1).paidHours;
  const implied = s.monthly && monthlyPaidHours ? num(s.monthly) / monthlyPaidHours : 0;
  const min = minWageFor(CURRENT_YEAR);

  return (
    <div className="calc-grid" id="calc">
      <Card title="환산 방식" step="1">
        <Field>
          <Segmented label="환산 방향" options={[{ value: 'toPay', label: '시급 → 월급' }, { value: 'toWage', label: '월급 → 시급' }]} value={s.mode} onChange={(v) => set({ mode: v })} />
        </Field>
        {s.mode === 'toPay' ? (
          <Field label="시급" htmlFor="h-wage"><MoneyInput id="h-wage" value={s.wage} onChange={(v) => set({ wage: v })} /></Field>
        ) : (
          <Field label="받는 월급 (세전)" htmlFor="h-monthly"><MoneyInput id="h-monthly" value={s.monthly} onChange={(v) => set({ monthly: v })} placeholder="예: 1,200,000" /></Field>
        )}
        <div className="grid-2">
          <Field label="하루 근무시간" htmlFor="h-day" hint="휴게시간 제외"><MoneyInput id="h-day" decimal value={s.dayHours} onChange={(v) => set({ dayHours: v })} suffix="시간" small /></Field>
          <Field label="주 근무일" htmlFor="h-wd"><MoneyInput id="h-wd" value={s.weekDays} onChange={(v) => set({ weekDays: v })} suffix="일" small /></Field>
        </div>
        <PrivacyNote />
      </Card>
      <div className="sticky-col">
        {s.mode === 'toPay' ? (
          <Card title="환산 결과" step="2">
            <div className="result-label">월 환산 (주휴 포함, 세전)</div>
            <div className="result-big num">{fmt(m.monthly)}<span className="unit">원</span></div>
            <div className="items">
              <div className="deduct-row"><span>일급 ({h(num(s.dayHours))}시간)</span><span className="num">{fmt(wage * num(s.dayHours))}원</span></div>
              <div className="deduct-row"><span>주급 (주 {h(weeklyHours)}시간 + 주휴 {h(m.juhyuH)}시간)</span><span className="num">{fmt(m.weeklyPay)}원</span></div>
              <div className="deduct-row"><span>월급 (월 {m.paidHours}시간)</span><span className="num">{fmt(m.monthly)}원</span></div>
              <div className="deduct-row"><span>연봉 환산 (× 12)</span><span className="num">{fmt(m.monthly * 12)}원</span></div>
            </div>
            {weeklyHours > 0 && weeklyHours < 15 && <Notice level="info">주 15시간 미만이라 주휴수당 없이 계산했어요.</Notice>}
            <p className="fineprint">한 달 = 약 {WEEKS_PER_MONTH.toFixed(3)}주 평균으로 환산하고 월 시간은 반올림했어요(주 40시간 → 209시간). 실제 월 금액은 달력에 따라 달라져요.</p>
          </Card>
        ) : (
          <Card title="환산 결과" step="2">
            <div className="result-label">시간당 환산 (주휴 포함 월 {monthlyPaidHours}시간 기준)</div>
            <div className="result-big num">{fmt(implied)}<span className="unit">원</span></div>
            {implied > 0 && (
              <Notice level={implied + 1 >= min ? 'good' : 'danger'}>
                {implied + 1 >= min
                  ? `${CURRENT_YEAR}년 최저임금(${fmt(min)}원) 이상이에요.`
                  : `${CURRENT_YEAR}년 최저임금(${fmt(min)}원)보다 낮게 계산돼요. 근무시간·수당 구성을 확인해보세요.`}
              </Notice>
            )}
            <p className="fineprint">최저임금 비교는 매월 정기적으로 주는 임금을 기준으로 해요. 실제로는 일부 수당이 빠지거나 포함될 수 있어요.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function HourlyWagePage() {
  return (
    <div className="wrap">
      <PageHead pageKey="hourly" eyebrow="시급 환산" title="시급 계산기" lead="시급을 일급·주급·월급으로, 받는 월급을 시급으로 바꿔보세요. 주휴수당까지 포함해서 환산해요." />
      <Converter />
      <Examples
        items={[
          { title: '주 5일 × 8시간 (2026 최저시급)', lines: [['(40 + 8) × 4.345주', '약 209시간'], ['10,320원 × 209시간', '2,156,880원']] },
          { title: '주 5일 × 4시간', lines: [['주휴: 20 ÷ 40 × 8', '4시간'], ['(20 + 4) × 4.345주', '약 104시간'], ['10,320원 × 104시간', '1,073,280원']] },
        ]}
      />
      <Section title="시급 환산할 때 주의할 점">
        <Prose>
          <ul>
            <li>주 15시간 이상이면 주휴시간이 더해져서 &ldquo;시급 × 일한 시간&rdquo;보다 월급이 커요.</li>
            <li>월 평균 환산은 계획용이에요. 이번 달 실제 금액은 <a href="/monthly-alba-pay/">이번 달 알바비</a>에서 달력으로 계산하세요.</li>
            <li>받은 월급이 최저임금보다 낮게 환산되면 <a href="/minimum-wage/">최저임금 페이지</a>에서 기준을 확인해보세요.</li>
          </ul>
        </Prose>
      </Section>
      <Faq items={faq} />
      <Related keys={['minimumWage', 'calculator', 'monthly', 'weekly']} />
    </div>
  );
}
