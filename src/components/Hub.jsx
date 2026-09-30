import React, { useEffect } from 'react';

export const HUB = [
  { key: 'tracker', href: '/tracker/', ic: '💼', t: '알바비', d: '근무·급여 확인' },
  { key: 'invest', href: '/invest/', ic: '📈', t: '투자', d: '종목·배당 기록' },
  { key: 'money', href: '/money/', ic: '💰', t: '내 자산', d: '돈의 흐름' },
];

/* 알바비 · 투자 · 내 자산을 오가는 상단 탭 */
export function HubTabs({ current }) {
  return (
    <nav className="hub-tabs" aria-label="알바부터 투자까지">
      {HUB.map((x) => (
        <a key={x.key} href={x.href} aria-current={current === x.key ? 'page' : undefined}>
          <span className="ic" aria-hidden>{x.ic}</span>{x.t}<small>{x.d}</small>
        </a>
      ))}
    </nav>
  );
}

/* 모바일 하단 탭 (홈·알바비·투자·내 자산) — 앱처럼 쓰는 페이지에서만 */
export function BottomNav({ current }) {
  useEffect(() => {
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, []);
  const items = [{ key: 'home', href: '/', ic: '🏠', t: '홈' }, ...HUB];
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {items.map((x) => (
        <a key={x.key} href={x.href} aria-current={current === x.key ? 'page' : undefined}>
          <span className="ic" aria-hidden>{x.ic}</span>{x.t}
        </a>
      ))}
    </nav>
  );
}
