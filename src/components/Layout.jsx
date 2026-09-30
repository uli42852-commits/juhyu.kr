import React from 'react';
import { PAGES, TOOL_NAV, SITE } from '../site.js';
import { HELP_LINE } from '../lib/legal.js';

export function Header({ current }) {
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <a href="/" className="brand" aria-label="JUHYU 홈">
          <span className="brand-mark">JU<b>HYU</b></span>
          <span className="brand-sub">알바비 확인</span>
        </a>
        <a href={PAGES.paycheckCheck.path} className="header-cta">받은 돈 확인하기</a>
      </div>
      <nav className="tool-nav" aria-label="계산기 목록">
        {TOOL_NAV.map((k) => (
          <a key={k} href={PAGES[k].path} aria-current={current === k ? 'page' : undefined}>{PAGES[k].nav}</a>
        ))}
      </nav>
    </header>
  );
}

export function Footer() {
  const col = (keys) => keys.map((k) => <li key={k}><a href={PAGES[k].path}>{PAGES[k].nav}</a></li>);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-cols">
          <div>
            <h3>계산하기</h3>
            <ul>{col(['calculator', 'monthly', 'weekly', 'night', 'hourly'])}</ul>
          </div>
          <div>
            <h3>확인하기</h3>
            <ul>{col(['tracker', 'paycheckCheck', 'paycheck', 'albaPay', 'minimumWage'])}</ul>
          </div>
          <div>
            <h3>더 알아보기</h3>
            <ul>{col(['guide', 'severance'])}</ul>
          </div>
          <div>
            <h3>JUHYU</h3>
            <ul>
              <li><a href={PAGES.privacy.path}>개인정보처리방침</a></li>
              <li><a href="https://www.moel.go.kr" target="_blank" rel="noopener noreferrer">고용노동부</a></li>
              <li><a href="https://www.minimumwage.go.kr" target="_blank" rel="noopener noreferrer">최저임금위원회</a></li>
            </ul>
          </div>
        </div>
        <p className="footer-note">
          JUHYU(주휴계산기)는 알바생이 받은 급여를 스스로 확인할 수 있도록 돕는 무료 도구예요. 입력한 정보는 서버로 전송되지 않고 브라우저에서만 계산돼요.
          계산 결과는 참고용이며 법률·노무 자문이 아니에요. 개별 근로계약 및 근무 형태에 따라 달라질 수 있으니 정확한 판단은 {HELP_LINE} 또는 공인노무사와 상담하세요.
          <br />기준 정보 최종 확인일 {SITE.updated}
        </p>
      </div>
    </footer>
  );
}

export default function Layout({ current, children }) {
  return (
    <>
      <a href="#main" className="sr-only">본문 바로가기</a>
      <Header current={current} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
