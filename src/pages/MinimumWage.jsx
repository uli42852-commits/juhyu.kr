import React from 'react';
import { PageHead, Faq, Related, Section, Prose } from '../components/Sections.jsx';
import { Card, Field, MoneyInput, Segmented, Notice, Basis, PrivacyNote } from '../components/ui.jsx';
import { useStoredState, useMounted } from '../lib/storage.js';
import { fmt, h, num, monthlyFromWeekly } from '../lib/pay.js';
import { MIN_WAGE, MIN_WAGE_SOURCE, LAW, CURRENT_YEAR } from '../lib/legal.js';

export const faq = [
  {
    q: '2026년 최저임금은 얼마인가요?',
    a: ['2026년 1월 1일부터 12월 31일까지 시간당 10,320원이에요. 주 40시간(월 209시간) 기준 월 2,156,880원이에요. 2025년(10,030원)보다 2.9% 올랐어요.'],
  },
  {
    q: '2027년 최저임금은 얼마인가요?',
    a: ['2027년 최저임금은 시간당 10,700원으로 고시됐어요(2026년 대비 3.7% 인상). 2027년 1월 1일부터 적용되고, 월 209시간 기준 2,236,300원이에요.'],
  },
  {
    q: '알바도, 청소년도, 5인 미만 가게도 최저임금을 받아야 하나요?',
    a: ['네. 최저임금은 근로자를 1명 이상 쓰는 모든 사업장에 적용되고, 알바·청소년·외국인 근로자도 똑같이 적용돼요. 수습(1년 이상 계약, 3개월 이내, 단순노무 제외)만 90%까지 감액이 가능해요.'],
  },
  {
    q: '최저임금보다 적게 받으면 어떻게 되나요?',
    a: ['최저임금에 못 미치는 임금을 정한 근로계약은 그 부분이 무효가 되고 최저임금으로 정한 것으로 봐요. 차액은 받을 수 있는 임금이에요. 사업주와 이야기해도 해결되지 않으면 고용노동부(국번없이 1350)에 상담할 수 있어요.'],
  },
];

function MinWageCheck() {
  const [s, setS] = useStoredState('juhyu-minwage-v1', { year: CURRENT_YEAR, type: 'month', amount: '', dayHours: '6', weekDays: '5' });
  const set = (p) => setS((x) => ({ ...x, ...p }));
  const min = MIN_WAGE[s.year] || MIN_WAGE[CURRENT_YEAR];
  const weeklyHours = num(s.dayHours) * num(s.weekDays);
  const juhyuH = weeklyHours >= 15 ? Math.min(weeklyHours, 40) / 40 * 8 : 0;
  const divisor = s.type === 'month' ? monthlyFromWeekly(weeklyHours, 1).paidHours
    : s.type === 'week' ? weeklyHours + juhyuH
      : s.type === 'day' ? num(s.dayHours) : 1;
  const implied = num(s.amount) && divisor ? num(s.amount) / divisor : 0;

  return (
    <div className="calc-grid" id="calc">
      <Card title="내 급여 입력" step="1">
        <Field label="비교할 연도">
          <Segmented label="연도" options={Object.keys(MIN_WAGE).map(Number).filter((y) => y >= CURRENT_YEAR).map((y) => ({ value: y, label: `${y}년 (${fmt(MIN_WAGE[y])}원)` }))} value={s.year} onChange={(v) => set({ year: v })} />
        </Field>
        <Field label="급여 단위">
          <Segmented label="급여 단위" options={[{ value: 'month', label: '월급' }, { value: 'week', label: '주급' }, { value: 'day', label: '일급' }, { value: 'hour', label: '시급' }]} value={s.type} onChange={(v) => set({ type: v })} />
        </Field>
        <Field label="받는 금액 (세전, 기본급 기준)" htmlFor="mw-amt"><MoneyInput id="mw-amt" value={s.amount} onChange={(v) => set({ amount: v })} placeholder="예: 1,100,000" /></Field>
        {s.type !== 'hour' && (
          <div className="grid-2">
            <Field label="하루 근무시간" htmlFor="mw-d" hint="휴게시간 제외"><MoneyInput id="mw-d" decimal value={s.dayHours} onChange={(v) => set({ dayHours: v })} suffix="시간" small /></Field>
            {s.type !== 'day' && <Field label="주 근무일" htmlFor="mw-w"><MoneyInput id="mw-w" value={s.weekDays} onChange={(v) => set({ weekDays: v })} suffix="일" small /></Field>}
          </div>
        )}
        <PrivacyNote />
      </Card>
      <div className="sticky-col">
        <Card title="최저임금 비교" step="2">
          <div className="result-label">내 급여의 시간당 금액</div>
          <div className="result-big num">{fmt(implied)}<span className="unit">원</span></div>
          {s.type !== 'hour' && s.type !== 'day' && (
            <p className="field-hint">{s.type === 'month' ? `월 유급시간 ${divisor}시간` : `주 유급시간 ${h(divisor)}시간`} (주 {h(weeklyHours)}시간{juhyuH ? ` + 주휴 ${h(juhyuH)}시간` : ''}) 기준</p>
          )}
          {implied > 0 && (
            <Notice level={implied + 1 >= min ? 'good' : 'danger'}>
              {implied + 1 >= min
                ? <><b>{s.year}년 최저임금({fmt(min)}원) 이상이에요.</b> 시간당 {fmt(implied - min)}원 많아요.</>
                : <><b>{s.year}년 최저임금({fmt(min)}원)보다 시간당 {fmt(min - implied)}원 낮게 계산돼요.</b> 근무시간과 급여 구성(주휴수당 포함 여부 등)을 확인해보세요.</>}
            </Notice>
          )}
          <p className="fineprint">최저임금 비교에는 매월 정기적으로 지급되는 임금이 들어가요. 연장·야간 가산 등은 빠지고, 일부 식대·복리후생비는 산입 여부가 달라서 기본급으로 비교하는 게 안전해요.</p>
          <Basis basis={LAW.minWage} />
        </Card>
      </div>
    </div>
  );
}

function Dday() {
  const mounted = useMounted();
  if (!mounted) return null;
  const now = new Date();
  const next = new Date(now.getFullYear() + 1, 0, 1);
  const d = Math.ceil((next - now) / 86400000);
  const nextWage = MIN_WAGE[now.getFullYear() + 1];
  if (!nextWage) return null;
  return <Notice level="info">📅 {now.getFullYear() + 1}년 최저임금 {fmt(nextWage)}원 적용까지 <b>D-{d}</b></Notice>;
}

export default function MinimumWagePage() {
  const years = Object.keys(MIN_WAGE).map(Number).sort((a, b) => b - a);
  return (
    <div className="wrap">
      <PageHead
        pageKey="minimumWage"
        eyebrow="최저임금"
        title="2026 최저임금 10,320원, 내 급여는?"
        lead="올해와 내년 최저임금을 확인하고, 받는 월급·주급·일급을 시급으로 바꿔 최저임금 이상인지 비교해보세요."
      />
      <Dday />
      <Section title="연도별 최저임금">
        <table className="table">
          <thead><tr><th>적용 연도</th><th className="r">시급</th><th className="r">월 환산 (209시간)</th></tr></thead>
          <tbody>
            {years.map((y) => {
              const prev = MIN_WAGE[y - 1];
              return (
                <tr key={y}>
                  <td>{y}년 {y === CURRENT_YEAR && <span className="badge good">올해</span>}{y === CURRENT_YEAR + 1 && <span className="badge gray">내년</span>}</td>
                  <td className="r num"><b>{fmt(MIN_WAGE[y])}원</b>{prev && <span className="basis">+{((MIN_WAGE[y] / prev - 1) * 100).toFixed(1)}%</span>}</td>
                  <td className="r num">{fmt(MIN_WAGE[y] * 209)}원</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Basis basis={MIN_WAGE_SOURCE} prefix="출처" />
      </Section>

      <Section title="내 급여, 최저임금 넘을까?">
        <MinWageCheck />
      </Section>

      <Section title="최저임금 관련해서 알아두면 좋은 것">
        <Prose>
          <ul>
            <li>최저임금은 매년 1월 1일부터 새 금액이 적용돼요. 1월 급여부터 시급이 바뀌었는지 확인하세요.</li>
            <li>주휴수당은 최저임금과 별도로 받아야 하는 돈이에요. &ldquo;시급에 주휴 포함&rdquo;이라고 했다면 시급을 주휴 포함 금액으로 나눠 최저임금 이상인지 봐야 해요.</li>
            <li>수습 감액(90%)은 1년 이상 계약 + 3개월 이내 + 단순노무직 아님 조건을 모두 채워야 가능해요.</li>
          </ul>
        </Prose>
      </Section>

      <Faq items={faq} />
      <Related keys={['calculator', 'hourly', 'weekly', 'paycheckCheck']} />
    </div>
  );
}
