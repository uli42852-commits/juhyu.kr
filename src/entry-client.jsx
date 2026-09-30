import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App, { ROUTES } from './App.jsx';
import { PAGES, pageByPath } from './site.js';
import './styles.css';

const found = pageByPath(window.location.pathname);
const pageKey = found ? found[0] : 'notFound';
const root = document.getElementById('root');

ROUTES[pageKey].load().then(({ default: Page }) => {
  const app = <React.StrictMode><App pageKey={pageKey} Page={Page} /></React.StrictMode>;
  // 정적 HTML이 이 경로용으로 렌더링된 경우에만 hydrate (SPA 폴백으로 다른 페이지 HTML이 온 경우 새로 그림)
  if (root.hasChildNodes() && root.dataset.page === pageKey) {
    hydrateRoot(root, app);
  } else {
    if (PAGES[pageKey]) document.title = PAGES[pageKey].title;
    root.textContent = '';
    createRoot(root).render(app);
  }
});
