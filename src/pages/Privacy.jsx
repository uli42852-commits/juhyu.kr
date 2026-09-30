import React from 'react';
import { PageHead } from '../components/Sections.jsx';
import { Card } from '../components/ui.jsx';
import { SITE } from '../site.js';

const STORED = [
  ['juhyu-tracker-v1 · juhyu-photo-*', '알바비 추적의 알바 정보·근무 기록·입금 기록·명세서, 근무 기록에 첨부한 사진'],
  ['juhyu-money-v1', '투자 종목·매수·배당·저축 기록, 월별 자산 기록, 룰렛 기록, 환율 설정'],
  ['juhyu-pay-v2', '급여 계산기·급여 검증·이번 달 알바비 입력값'],
  ['juhyu-payslip-v1', '급여명세서 확인에 입력한 금액'],
  ['juhyu-checklist-v1', '급여 확인 체크리스트 체크 상태'],
  ['juhyu-calc-v1 · juhyu-calc-job2-v1 · juhyu-receipt-log-v1', '주휴수당 계산기 입력값·투잡·영수증철'],
  ['juhyu-night-v1 · juhyu-hourly-v1 · juhyu-minwage-v1 · juhyu-severance-calc-v1', '각 계산기 입력값'],
];

export default function PrivacyPage() {
  return (
    <div className="wrap narrow">
      <PageHead pageKey="privacy" title="개인정보처리방침" lead={`시행일 ${SITE.updated}`} />
      <Card>
        <div className="prose">
          <p><strong>1. 수집하는 개인정보</strong><br />JUHYU(juhyu.kr, 주휴계산기)는 회원가입 없이 이용하며 이름·연락처·이메일 등 개인을 식별하는 정보를 수집하지 않아요.</p>
          <p><strong>2. 입력한 급여 정보의 처리</strong><br />시급, 근무시간, 받은 금액, 급여명세서 내용 등 입력한 정보는 서버로 전송되지 않고 이용자의 브라우저 안에서만 계산돼요. 다음 방문 때 편하게 쓰도록 브라우저 저장소(localStorage)에 아래 항목이 저장돼요.</p>
          <ul>{STORED.map(([k, v]) => <li key={k}><code>{k}</code> — {v}</li>)}</ul>
          <p>브라우저의 사이트 데이터를 삭제하면 저장된 내용도 함께 삭제돼요. 각 계산기의 &lsquo;초기화&rsquo; 버튼으로도 지울 수 있어요.</p>
          <p><strong>3. 광고</strong><br />이 사이트는 Google AdSense 광고를 게재할 수 있어요. Google 등 제3자 광고 사업자는 쿠키를 사용해 이용자의 이전 방문 기록을 바탕으로 광고를 제공할 수 있으며, 이용자는 <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google 광고 설정</a>에서 맞춤 광고를 해제할 수 있어요.</p>
          {SITE.contact && <p><strong>4. 문의</strong><br />개인정보 관련 문의: <a href={`mailto:${SITE.contact}`}>{SITE.contact}</a></p>}
        </div>
      </Card>
    </div>
  );
}
