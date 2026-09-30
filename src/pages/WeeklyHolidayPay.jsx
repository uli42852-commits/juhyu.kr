import React from 'react';
import WeeklyHolidayCalc from '../components/WeeklyHolidayCalc.jsx';
import { PageHead, Faq, Examples, Related, Section, Prose } from '../components/Sections.jsx';
import { Basis } from '../components/ui.jsx';
import { ARTICLES } from '../content/articles.js';
import { LAW, CURRENT_MIN_WAGE, NEXT_MIN_WAGE, CURRENT_YEAR } from '../lib/legal.js';
import { fmt } from '../lib/pay.js';

const pick = (prefix) => ARTICLES.find((a) => a.t.startsWith(prefix));
const FAQ_SOURCES = [
  ['주휴수당이란', '주휴수당은 누가, 어떤 조건에서 받나요?'],
  ['알바생도 주휴수당', '5인 미만 가게 알바도 주휴수당을 받나요?'],
  ['결근하면', '결근하면 주휴수당을 못 받나요?'],
  ['지각·조퇴', '지각·조퇴해도 주휴수당을 받을 수 있나요?'],
  ['주 3일 알바도', '주 3일만 일해도 받을 수 있나요?'],
  ['알바 그만둘 때', '그만두는 주에도 주휴수당을 받나요?'],
  ['3.3% 떼는', '3.3% 떼는 알바도 주휴수당 받을 수 있나요?'],
];

export const faq = FAQ_SOURCES.map(([prefix, q]) => ({ q, a: pick(prefix).p }));

export default function WeeklyHolidayPayPage() {
  return (
    <div className="wrap">
      <PageHead
        pageKey="weekly"
        eyebrow="주휴계산기"
        title="주휴수당 계산기"
        lead="요일별 근무시간을 넣으면 이번 주 주휴수당 지급 대상인지, 얼마를 받아야 하는지 바로 판정해드려요."
      />
      <WeeklyHolidayCalc />

      <Section title="주휴수당, 이것만 알면 돼요">
        <Prose>
          <p><strong>조건</strong>: ① 한 주 소정근로시간 15시간 이상 ② 그 주 정해진 근무일 개근 ③ 다음 주에도 근로관계가 이어질 것. 사업장 규모(5인 미만 포함)와 고용 형태(알바·계약직)는 상관없어요.</p>
          <p><strong>계산</strong>: 시급 × (주 소정근로시간 ÷ 40) × 8. 주 40시간 이상이면 시급 × 8시간이 최대예요.</p>
          <p><strong>{CURRENT_YEAR}년 기준</strong>: 최저시급 {fmt(CURRENT_MIN_WAGE)}원으로 주 40시간이면 주휴수당 {fmt(CURRENT_MIN_WAGE * 8)}원, 주 15시간이면 {fmt(CURRENT_MIN_WAGE * 3)}원이에요. {CURRENT_YEAR + 1}년에는 최저시급 {fmt(NEXT_MIN_WAGE)}원으로 주 40시간 기준 {fmt(NEXT_MIN_WAGE * 8)}원이 돼요.</p>
          <Basis basis={LAW.juhyu} />
          <Basis basis={LAW.shortTime} />
        </Prose>
      </Section>

      <Examples
        items={[
          {
            title: '편의점 알바: 주 4일 × 5시간',
            lines: [['주 근무시간', '20시간'], ['10,320원 × 20 ÷ 40 × 8', '41,280원']],
          },
          {
            title: '카페 알바: 주 3일 × 8시간',
            lines: [['주 근무시간', '24시간'], ['10,320원 × 24 ÷ 40 × 8', '49,536원']],
          },
          {
            title: '주 14시간 알바',
            lines: [['주 근무시간', '14시간 (15시간 미만)'], ['주휴수당', '0원']],
            note: '15시간 기준은 실제 일한 시간이 아니라 근로계약상 소정근로시간으로 판단해요. 딱 1시간 차이로 결과가 달라지니 계약서를 확인해보세요.',
          },
        ]}
      />

      <Section title="주휴수당만으로는 부족해요">
        <Prose>
          <p>주휴수당을 받았는지만 봐서는 알바비가 맞는지 알 수 없어요. 한 달 기본급, 야간·연장 가산, 공제까지 함께 봐야 실제 입금액과 비교할 수 있어요.</p>
          <p><a href="/calculator/">알바 급여 계산기</a>에서 이번 달 전체 금액을 계산하고, <a href="/paycheck-check/">급여 검증</a>에서 실제 받은 금액과 비교해보세요.</p>
        </Prose>
      </Section>

      <Faq items={faq} />
      <Related keys={['calculator', 'paycheckCheck', 'monthly', 'guide']} />
    </div>
  );
}
