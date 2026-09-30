/* 페이지별 <head> 태그 — 빌드 때 정적 HTML에 박아 넣는다. */
import { PAGES, SITE } from './site.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildHead(pageKey, route) {
  if (pageKey === 'notFound') {
    return [
      '<title>페이지를 찾을 수 없어요 | JUHYU</title>',
      '<meta name="robots" content="noindex" />',
    ].join('\n    ');
  }
  const page = PAGES[pageKey];
  const url = SITE.origin + page.path;
  const graph = [];

  if (pageKey === 'home') {
    graph.push({
      '@type': 'WebSite',
      name: SITE.name,
      alternateName: ['주휴계산기', 'JUHYU', '알바비 계산기'],
      url: `${SITE.origin}/`,
      inLanguage: 'ko-KR',
      description: page.description,
    });
  } else {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: `${SITE.origin}/` },
        { '@type': 'ListItem', position: 2, name: page.nav, item: url },
      ],
    });
  }
  if (route && route.tool) {
    graph.push({
      '@type': 'WebApplication',
      name: pageKey === 'home' ? '알바비 계산기' : page.nav,
      url,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      inLanguage: 'ko-KR',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
      description: page.description,
    });
  }
  if (route && route.faq && route.faq.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: route.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a.join(' ') },
      })),
    });
  }

  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');

  return [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${esc(SITE.name)}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    '<meta property="og:locale" content="ko_KR" />',
    '<meta name="twitter:card" content="summary" />',
    `<script type="application/ld+json">${ld}</script>`,
  ].join('\n    ');
}
