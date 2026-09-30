import React from 'react';
import { renderToString } from 'react-dom/server';
import App, { ROUTES } from './App.jsx';
import { PAGES, SITE } from './site.js';
import { buildHead } from './head.js';

export { PAGES, SITE };

export async function render(pageKey) {
  const mod = await ROUTES[pageKey].load();
  const html = renderToString(<React.StrictMode><App pageKey={pageKey} Page={mod.default} /></React.StrictMode>);
  const head = buildHead(pageKey, { ...ROUTES[pageKey], faq: mod.faq });
  return { html, head };
}
