import React from 'react';
import { PAGES } from '../site.js';
import { AdSlot } from './ui.jsx';

export function PageHead({ pageKey, eyebrow, title, lead }) {
  const page = PAGES[pageKey];
  return (
    <div className="page-head">
      <nav className="crumbs" aria-label="현재 위치"><a href="/">홈</a> › {page.nav}</nav>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}

export function Section({ title, lead, children, id }) {
  return (
    <section className="section" id={id}>
      {title && <h2>{title}</h2>}
      {lead && <p className="section-lead">{lead}</p>}
      {children}
    </section>
  );
}

/* FAQ — 답변은 문단 배열. 같은 데이터로 FAQPage 구조화 데이터도 만든다. */
export function Faq({ items, title = '자주 묻는 질문' }) {
  return (
    <Section title={title}>
      <div className="faq">
        {items.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <div className="a">{f.a.map((p) => <p key={p}>{p}</p>)}</div>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function Examples({ items, title = '계산 예시' }) {
  return (
    <Section title={title}>
      {items.map((ex) => (
        <div className="example" key={ex.title}>
          <h3>{ex.title}</h3>
          {ex.setup && <p className="field-hint" style={{ marginTop: 0, marginBottom: 8 }}>{ex.setup}</p>}
          <div className="calc-lines">
            {ex.lines.map((l) => <div key={l[0]}>{l[0]} {l[1] && <>= <b>{l[1]}</b></>}</div>)}
          </div>
          {ex.note && <p className="field-hint">{ex.note}</p>}
        </div>
      ))}
    </Section>
  );
}

export function Related({ keys, title = '다음으로 확인해보세요' }) {
  return (
    <Section title={title}>
      <AdSlot />
      <div className="links">
        {keys.map((k) => (
          <a key={k} className="link-card" href={PAGES[k].path}>
            <span className="ic" aria-hidden>{PAGES[k].icon}</span>
            <span>
              <span className="t">{PAGES[k].nav}</span>
              <span className="d">{PAGES[k].short}</span>
            </span>
          </a>
        ))}
      </div>
    </Section>
  );
}

export function Prose({ children }) {
  return <div className="prose">{children}</div>;
}
