import React from 'react';
import PayCalculator from '../components/PayCalculator.jsx';
import HomeTrackCard from '../components/tracker/HomeTrackCard.jsx';
import { Faq, Related, Section, Prose } from '../components/Sections.jsx';
import { CURRENT_YEAR, CURRENT_MIN_WAGE } from '../lib/legal.js';
import { fmt } from '../lib/pay.js';

export const faq = [
  {
    q: '주휴수당만 계산하고 싶어요.',
    a: [
      '위 계산기 결과의 "주휴수당" 항목을 누르면 이번 달 주별로 주휴수당이 계산된 과정을 볼 수 있어요.',
      '한 주만 빠르게 확인하고 싶다면 주휴수당 계산기(/weekly-holiday-pay/)에서 요일별 시간을 넣고 지급 대상인지 판정받을 수 있어요.',
    ],
  },
  {
    q: '계산한 금액과 실제로 받은 금액이 달라요.',
    a: [
      '"내 급여 검증"에 받은 금액을 넣으면 차이가 얼마인지, 그 차이가 주휴수당·야간수당·공제액 중 무엇과 비슷한지 알려드려요.',
      '차이가 있다고 바로 잘못 지급된 것은 아니에요. 급여 기간, 실제 근무시간, 공제 방식이 입력과 다를 수 있으니 급여명세서와 항목별로 비교해보세요.',
    ],
  },
  {
    q: '입력한 시급이나 근무시간이 어딘가에 저장되나요?',
    a: ['서버로 전송되지 않아요. 다음에 다시 계산하기 편하도록 이 브라우저(localStorage)에만 저장되고, 브라우저 사이트 데이터를 지우면 함께 삭제돼요.'],
  },
  {
    q: '5인 미만 가게에서 일하면 뭐가 달라지나요?',
    a: [
      '주휴수당과 최저임금은 사업장 규모와 상관없이 똑같이 적용돼요.',
      '반면 야간(밤 10시~새벽 6시)·연장(하루 8시간·주 40시간 초과)·휴일근로의 50% 가산은 상시 5인 이상 사업장에만 적용돼요. 규모를 모르면 계산기에서 "잘 모름"을 고르면 가산분을 따로 보여드려요.',
    ],
  },
  {
    q: '실수령액에 근로소득세도 포함되나요?',
    a: ['3.3% 공제나 4대보험(국민연금·건강·장기요양·고용) 근로자 부담분은 계산해드려요. 근로소득세는 부양가족 수와 간이세액표에 따라 달라서 따로 계산하지 않아요. 알바 월급 수준이면 0원이거나 소액인 경우가 많아요.'],
  },
];

export default function Home() {
  return (
    <>
      <div className="wrap">
        <section className="hero">
          <h1>알바비, <span className="hl">제대로</span><br />받고 있나요?</h1>
          <p className="lead">근무시간을 기록하고<br />받아야 할 돈과 실제 받은 돈을 비교해보세요.</p>
          <div className="hero-ctas split">
            <a className="btn btn-primary btn-wide" href="/tracker/#/start">내 알바비 추적 시작하기</a>
            <a className="btn btn-ghost" href="#calc">내 알바비 계산하기</a>
            <a className="btn btn-ghost" href="/paycheck/">급여명세서 확인하기</a>
          </div>
          <div className="hero-meta">
            <span>{CURRENT_YEAR} 최저임금 {fmt(CURRENT_MIN_WAGE)}원 반영</span>
            <span>주휴·야간·공제까지</span>
            <span>로그인 없이, 브라우저에서만 저장</span>
          </div>
        </section>

        <HomeTrackCard />

        <div className="tile-grid" style={{ marginTop: 12, marginBottom: 32 }}>
          <a className="tile" href="/tracker/#/start"><span className="ic">🗓</span><span className="t">근무 기록</span><span className="d">출퇴근만 5초 기록</span></a>
          <a className="tile" href="/paycheck-check/"><span className="ic">🔍</span><span className="t">급여 검증</span><span className="d">받은 돈과 예상 비교</span></a>
          <a className="tile" href="/paycheck/"><span className="ic">🧾</span><span className="t">급여명세서</span><span className="d">항목별로 확인</span></a>
          <a className="tile" href="/tracker/#/report"><span className="ic">📊</span><span className="t">알바비 리포트</span><span className="d">한 달을 한 장으로</span></a>
        </div>

        <PayCalculator variant="full" sticky={false} />

        <Related title="상황별로 바로 확인하기" keys={['paycheckCheck', 'paycheck', 'monthly', 'weekly', 'night', 'minimumWage']} />

        <Section title="알바비는 이렇게 계산돼요">
          <Prose>
            <p><strong>기본급</strong> = 시급 × 실제 근로시간(출근~퇴근에서 휴게시간을 뺀 시간)</p>
            <p><strong>+ 주휴수당</strong> = 주 15시간 이상 일하고 개근한 주마다 하루치 임금 (시급 × 주 근무시간 ÷ 40 × 8, 최대 8시간)</p>
            <p><strong>+ 가산수당</strong> = 5인 이상 사업장에서 밤 10시~새벽 6시, 하루 8시간·주 40시간 초과 근무에 시급의 50%</p>
            <p><strong>− 공제</strong> = 3.3%(사업소득) 또는 4대보험 근로자 부담분, 소득세 등</p>
            <p>그래서 &ldquo;시급 × 일한 시간&rdquo;만으로 계산하면 받아야 할 돈보다 적게 나오는 경우가 많아요. JUHYU는 항목마다 왜 그 금액이 나왔는지 근거와 함께 보여드려요.</p>
          </Prose>
        </Section>

        <Faq items={faq} />
        <Related keys={['albaPay', 'guide', 'hourly', 'severance']} title="더 알아보기" />
      </div>
    </>
  );
}
