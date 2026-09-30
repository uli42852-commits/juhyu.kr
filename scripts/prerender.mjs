/* 빌드 후처리: 모든 페이지를 정적 HTML로 미리 렌더링하고 sitemap.xml을 만든다. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.vite', 'manifest.json'), 'utf8'));
const PAGE_FILES = {
  home: 'Home', tracker: 'Tracker', invest: 'Invest', money: 'Money', calculator: 'Calculator', paycheckCheck: 'PaycheckCheck', paycheck: 'Paycheck', monthly: 'Monthly',
  weekly: 'WeeklyHolidayPay', night: 'NightWorkPay', hourly: 'HourlyWage', minimumWage: 'MinimumWage', albaPay: 'AlbaPay',
  severance: 'Severance', guide: 'Guide', privacy: 'Privacy', notFound: 'NotFound',
};

// 페이지 청크와 그 의존 청크를 미리 받아 하이드레이션 대기 시간을 줄인다.
function preloadLinks(pageKey) {
  const seen = new Set();
  const walk = (id) => {
    const entry = manifest[id];
    if (!entry || seen.has(entry.file)) return;
    seen.add(entry.file);
    (entry.imports || []).forEach(walk);
  };
  walk(`src/pages/${PAGE_FILES[pageKey]}.jsx`);
  return [...seen].map((f) => `<link rel="modulepreload" crossorigin href="/${f}" />`).join('\n    ');
}

const { render, PAGES, SITE } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href);

async function write(file, pageKey) {
  const { html, head } = await render(pageKey);
  const out = template
    .replace(/<!--app-head-->[\s\S]*?<!--\/app-head-->/, `${head}\n    ${preloadLinks(pageKey)}`)
    .replace('<!--app-page-->', pageKey)
    .replace('<!--app-html-->', html);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  return out.length;
}

for (const [key, page] of Object.entries(PAGES)) {
  const file = path.join(dist, page.path, 'index.html');
  const size = await write(file, key);
  console.log(`  ${page.path.padEnd(22)} ${(size / 1024).toFixed(1)} kB`);
}
await write(path.join(dist, '404.html'), 'notFound');

const PRIORITY = { home: '1.0', tracker: '0.9', invest: '0.8', money: '0.8', calculator: '0.9', paycheckCheck: '0.9', weekly: '0.9', paycheck: '0.8', monthly: '0.8', minimumWage: '0.8', privacy: '0.2' };
const urls = Object.entries(PAGES).map(([key, p]) => `  <url>
    <loc>${SITE.origin}${p.path}</loc>
    <lastmod>${SITE.updated}</lastmod>
    <changefreq>${key === 'privacy' ? 'yearly' : 'monthly'}</changefreq>
    <priority>${PRIORITY[key] || '0.7'}</priority>
  </url>`).join('\n');
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true });
fs.rmSync(path.join(dist, '.vite'), { recursive: true, force: true });
console.log(`prerendered ${Object.keys(PAGES).length} pages + 404.html + sitemap.xml`);
