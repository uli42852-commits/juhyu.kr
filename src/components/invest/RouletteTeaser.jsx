import React from 'react';

/* 투자 탭·홈에 놓는 작은 룰렛 카드 */
export default function RouletteTeaser({ href, onClick, count }) {
  const Btn = href ? 'a' : 'button';
  return (
    <div className="rl-card">
      <div>
        <div className="t">🎰 오늘 뭐 살까?</div>
        <div className="d">내 포트폴리오 {count}개 종목 중 오늘 살 종목을 골라보세요.</div>
      </div>
      <Btn className="btn btn-marker" href={href} type={href ? undefined : 'button'} onClick={onClick}>룰렛 돌리기</Btn>
    </div>
  );
}
