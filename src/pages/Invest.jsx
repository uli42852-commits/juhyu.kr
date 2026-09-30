import React from 'react';
import InvestApp from '../components/invest/InvestApp.jsx';
import { HubTabs, BottomNav } from '../components/Hub.jsx';
import { Faq, Related, Section, Prose } from '../components/Sections.jsx';

export const faq = [
  {
    q: '증권사 계좌를 연결해야 하나요?',
    a: ['아니요. 로그인이나 계좌 연결 없이, 보유 종목·매수 금액·배당을 직접 기록하는 방식이에요. 기록은 이 브라우저에만 저장되고 서버로 보내지 않아요.'],
  },
  {
    q: '배당금은 어떻게 기록하나요?',
    a: [
      '배당이 들어온 날 "배당 기록"에서 종목과 받은 금액을 적으면 이번 달·올해·전체 누적 배당이 자동으로 합산돼요.',
      '세금이 빠진 뒤 실제로 들어온 금액을 적어두면 내 돈의 흐름과 맞아요. 국내 주식 배당은 보통 배당소득세 15.4%(지방소득세 포함)가 원천징수되고, 미국 주식 배당은 미국에서 15%가 원천징수된 뒤 들어오는 경우가 많아요.',
    ],
  },
  {
    q: '평가금액과 수익률은 어떻게 계산되나요?',
    a: ['평가금액 = 보유수량 × 직접 입력한 현재가예요. 수익률 = (평가금액 − 투자원금) ÷ 투자원금이에요. 현재가를 자동으로 가져오지 않으니, 증권사 앱을 보고 가끔 "현재가 업데이트"에서 바꿔주세요.'],
  },
  {
    q: '달러로 산 해외 주식도 기록할 수 있나요?',
    a: ['네. 종목을 달러로 등록하고 환율을 직접 입력하면 원화로 합산돼요. 살 때 실제로 쓴 원화 금액을 적으면 그 금액이 투자원금이 돼요.'],
  },
  {
    q: '어떤 종목을 사야 할지도 알려주나요?',
    a: ['아니요. JUHYU는 내가 한 투자를 기록하고 정리하는 도구예요. 종목 추천, 매수·매도 권유, 투자 등급 같은 기능은 없어요. 투자 판단과 책임은 본인에게 있어요.'],
  },
  {
    q: '"알바 N시간치"는 무슨 뜻인가요?',
    a: ['투자금이나 배당금을 내 시급으로 나눈 단순 환산이에요. 예를 들어 시급 12,000원일 때 배당 12,000원은 알바 약 1시간치예요. 돈의 크기를 체감하기 위한 표현이지 수익을 약속하는 숫자가 아니에요.'],
  },
];

export default function InvestPage() {
  return (
    <div className="wrap">
      <HubTabs current="invest" />
      <InvestApp />
      <Section title="알바생 투자 기록, 이렇게 써요">
        <Prose>
          <ol>
            <li><strong>종목 등록</strong>: 종목명(티커), 보유수량, 평균매수가, 현재가를 적어요. 1주당 연 배당을 알면 예상 배당도 계산돼요.</li>
            <li><strong>투자할 때마다</strong>: "오늘 투자했나요?"에서 종목과 금액만 적으면 끝. 수량은 선택이에요.</li>
            <li><strong>배당 받은 날</strong>: 받은 금액을 적으면 이번 달·올해·누적 배당이 쌓여요.</li>
            <li><strong>가끔</strong>: 현재가를 업데이트하면 평가금액과 수익률이 바뀌어요.</li>
          </ol>
          <p>알바비 추적에 기록한 수입과 연결돼서, <a href="/money/">내 자산</a>에서 &ldquo;알바 → 저축 → 투자 → 배당&rdquo; 흐름으로 볼 수 있어요.</p>
        </Prose>
      </Section>
      <Faq items={faq} />
      <Related keys={['money', 'tracker', 'calculator', 'guide']} />
      <BottomNav current="invest" />
    </div>
  );
}
