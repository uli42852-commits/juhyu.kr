import React, { useState } from 'react';
import { PageHead, Related } from '../components/Sections.jsx';
import { AdSlot } from '../components/ui.jsx';
import { ARTICLES } from '../content/articles.js';
import { HELP_LINE } from '../lib/legal.js';

export const faq = ARTICLES.slice(0, 10).map((a) => ({ q: a.t, a: [a.p[0]] }));

const CATS = [{ v: 'all', t: '전체' }, { v: 'worker', t: '알바생용' }, { v: 'employer', t: '사장님용' }];

export default function GuidePage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const query = q.trim().toLowerCase();
  const list = ARTICLES
    .map((a, i) => ({ ...a, i }))
    .filter((a) => cat === 'all' || a.cat === cat)
    .filter((a) => !query || a.t.toLowerCase().includes(query) || a.p.some((p) => p.toLowerCase().includes(query)));

  return (
    <div className="wrap narrow">
      <PageHead
        pageKey="guide"
        eyebrow="알바 급여 가이드"
        title="알바 급여, 자주 묻는 질문"
        lead={`주휴수당 조건부터 급여명세서, 신고 방법까지 헷갈리는 것들을 정리했어요 (총 ${ARTICLES.length}개).`}
      />
      <div className="seg" style={{ marginBottom: 10 }} role="group" aria-label="대상">
        {CATS.map((c) => <button key={c.v} type="button" aria-pressed={cat === c.v} onClick={() => setCat(c.v)}>{c.t}</button>)}
      </div>
      <input className="input" style={{ fontSize: 16, fontWeight: 500 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="키워드로 찾기 · 예) 결근, 퇴사, 3.3%" aria-label="가이드 검색" />
      <p className="field-hint">{list.length ? `${list.length}개 글` : '해당하는 글이 없어요. 다른 키워드로 찾아보세요.'}</p>
      <div className="faq" style={{ marginTop: 12 }}>
        {list.map((a) => (
          <details key={a.i} id={`q${a.i + 1}`}>
            <summary>
              <span>
                <span className={`badge ${a.cat === 'employer' ? 'gray' : 'good'}`} style={{ marginLeft: 0, marginRight: 6 }}>{a.cat === 'employer' ? '사장님용' : '알바생용'}</span>
                {a.t}
              </span>
            </summary>
            <div className="a">{a.p.map((p) => <p key={p}>{p}</p>)}</div>
          </details>
        ))}
      </div>
      <p className="fineprint">위 내용은 일반적인 정보 제공 목적이며 법률 자문이 아니에요. 개별 사안은 {HELP_LINE}이나 공인노무사와 상담하는 것이 정확해요.</p>
      <AdSlot />
      <Related keys={['calculator', 'paycheckCheck', 'weekly', 'albaPay']} title="직접 계산해보기" />
    </div>
  );
}
