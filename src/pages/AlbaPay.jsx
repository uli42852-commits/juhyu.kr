import React from 'react';
import { PageHead, Faq, Related, Section, Prose } from '../components/Sections.jsx';
import { Card, Basis } from '../components/ui.jsx';
import Checklist from '../components/Checklist.jsx';
import { LAW, HELP_LINE } from '../lib/legal.js';

export const faq = [
  {
    q: '알바비는 보통 언제 받나요?',
    a: ['근로계약서에 정한 날짜에 받아요. 임금은 매월 1회 이상 일정한 날짜를 정해 지급해야 해요. 퇴사했다면 원칙적으로 14일 이내에 남은 임금을 정산받아야 해요.'],
  },
  {
    q: '출퇴근 기록은 어떻게 남겨두면 좋나요?',
    a: ['근무표 사진, 출퇴근 앱 기록, 메신저로 주고받은 스케줄, 교통카드 이용 내역 등이 도움이 돼요. 날짜별로 출근·퇴근·휴게시간을 메모해두면 급여명세서와 비교하기 쉬워요.'],
  },
  {
    q: '급여에서 유니폼값·식비를 빼도 되나요?',
    a: ['임금은 원칙적으로 전액을 직접 지급해야 해요. 법령이나 단체협약에 정한 경우가 아니면 임의로 공제할 수 없어요. 명세서에 모르는 공제 항목이 있다면 근거를 물어보세요.'],
  },
];

const STEPS = [
  { t: '근무시간 기록하기', d: '일한 날마다 출근·퇴근·휴게시간을 남겨두면 명세서의 총 근무시간과 바로 비교할 수 있어요.', href: '/tracker/#/start', cta: '알바비 추적으로 기록' },
  { t: '받아야 할 금액 계산', d: '기본급, 주휴수당, 해당되면 야간·연장 가산까지 더해 세전 금액을 구해요.', href: '/calculator/', cta: '급여 계산기' },
  { t: '공제 확인', d: '3.3%인지 4대보험인지, 그 외 빠진 금액이 있는지 확인해요.', href: '/paycheck/', cta: '명세서 공제 확인' },
  { t: '입금액과 비교', d: '통장에 들어온 금액과 예상 실수령액을 비교해요.', href: '/paycheck-check/', cta: '급여 검증' },
  { t: '차이가 있으면 물어보기', d: '어느 항목에서 차이가 나는지 정리해서 사업주에게 계산 근거를 물어봐요.', href: '/weekly-holiday-pay/', cta: '문의 메시지 만들기' },
];

export default function AlbaPayPage() {
  return (
    <div className="wrap">
      <PageHead
        pageKey="albaPay"
        eyebrow="월급날 체크"
        title="알바비 제대로 받았는지 확인하는 법"
        lead="월급날, 입금 문자만 보고 넘기지 마세요. 5단계로 확인하면 내가 받은 알바비가 맞는지 스스로 판단할 수 있어요."
      />

      <Section title="5단계로 확인하기">
        <div style={{ display: 'grid', gap: 10 }}>
          {STEPS.map((s, i) => (
            <Card key={s.t}>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, display: 'flex', alignItems: 'center' }}><span className="step">{i + 1}</span>{s.t}</h3>
              <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '6px 0 10px' }}>{s.d}</p>
              <a href={s.href} className="link-btn">{s.cta} →</a>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="급여 확인 체크리스트" lead="확인한 항목을 눌러 체크하세요. 체크 상태는 이 브라우저에 저장돼요.">
        <Card><Checklist /></Card>
      </Section>

      <Section title="알아두면 좋은 기본 원칙">
        <Prose>
          <p><strong>임금명세서</strong>: 사업주는 임금을 줄 때 항목별 금액과 계산 방법, 공제 내역이 적힌 명세서를 줘야 해요.</p>
          <Basis basis={LAW.payslip} />
          <p><strong>주휴수당</strong>: 주 15시간 이상 + 개근이면 사업장 규모와 상관없이 받아요.</p>
          <Basis basis={LAW.juhyu} />
          <p><strong>가산수당</strong>: 야간·연장·휴일 50% 가산은 상시 5인 이상 사업장에 적용돼요.</p>
          <Basis basis={LAW.premium} />
          <p>확인해도 이해되지 않는 차이가 있다면 {HELP_LINE}에서 상담받을 수 있어요. 이 페이지는 확인을 돕는 정보이며 법률 자문이 아니에요.</p>
        </Prose>
      </Section>

      <Faq items={faq} />
      <Related keys={['tracker', 'paycheckCheck', 'paycheck', 'calculator']} />
    </div>
  );
}
