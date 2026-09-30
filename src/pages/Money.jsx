import React from 'react';
import MoneyApp from '../components/money/MoneyApp.jsx';
import { HubTabs, BottomNav } from '../components/Hub.jsx';
import { Faq, Related, Section, Prose } from '../components/Sections.jsx';

export const faq = [
  {
    q: '"현재 기록 자산"은 어떻게 계산되나요?',
    a: ['저축 잔액 + 투자자산 평가금액 + 받은 배당 누적이에요. 알바 수입 자체는 더하지 않아요. 번 돈은 쓰기도 하니까, 저축이나 투자로 옮긴 만큼만 자산으로 쌓이는 구조예요.'],
  },
  {
    q: '알바생 돈 관리, 뭐부터 하면 좋을까요?',
    a: [
      '먼저 알바비가 제대로 들어왔는지 확인하고(알바비 추적), 월급날 일정 금액을 떼어 저축부터 기록해보세요. 금액보다 매달 같은 흐름을 만드는 게 중요해요.',
      '투자를 한다면 여윳돈으로, 어디에 얼마를 넣었는지 기록해두면 나중에 흐름이 보여요. JUHYU는 기록을 도와줄 뿐 특정 상품을 권하지 않아요.',
    ],
  },
  {
    q: '자산 변화 그래프는 언제 기록되나요?',
    a: ['이 페이지나 투자 페이지를 열 때마다 이번 달 자산이 저장돼요. 그래서 다음 달이 되면 지난달 값이 그대로 남아요. 기록이 없던 달은 그때까지의 투자원금으로 계산해요.'],
  },
  {
    q: '평가손익을 "이번 달 번 돈"에 더하지 않는 이유는요?',
    a: ['평가손익은 팔기 전까지 확정되지 않고, 일해서 번 돈과 성격이 달라요. 그래서 알바 수입, 평가손익, 배당을 각각 따로 보여드려요.'],
  },
  {
    q: '기록은 어디에 저장되나요?',
    a: ['로그인 없이 이 브라우저(localStorage)에만 저장돼요. 기기를 바꾸거나 브라우저 데이터를 지우면 사라지니, "전체 백업"으로 파일을 저장해두세요.'],
  },
];

export default function MoneyPage() {
  return (
    <div className="wrap">
      <HubTabs current="money" />
      <MoneyApp />
      <Section title="알바부터 투자까지, 내 돈의 흐름">
        <Prose>
          <p><strong>일한다 → 번다 → 확인한다 → 모은다 → 투자한다 → 배당받는다 → 자산이 쌓인다.</strong></p>
          <p>JUHYU는 이 흐름을 한 곳에 기록해요. <a href="/tracker/">알바비 추적</a>에서 근무와 입금을, <a href="/invest/">투자 기록</a>에서 종목과 배당을 적으면 여기서 이번 달 흐름과 자산 변화를 한눈에 볼 수 있어요.</p>
          <p>숫자는 모두 직접 입력한 기록 기준이에요. 투자 권유나 금융 자문이 아니에요.</p>
        </Prose>
      </Section>
      <Faq items={faq} />
      <Related keys={['tracker', 'invest', 'calculator', 'paycheckCheck']} />
      <BottomNav current="money" />
    </div>
  );
}
