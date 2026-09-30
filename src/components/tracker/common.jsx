import React, { useEffect, useState } from 'react';
import { WEEKDAYS, toKey, analyzeShift, fmt } from '../../lib/pay.js';
import { ymParts, todayKey, minutesLabel } from '../../lib/tracker.js';

/* 해시 라우터: #/log/2026-09-30 → { view: 'log', arg: '2026-09-30' } — 뒤로가기 지원, 서버 렌더링은 항상 대시보드 */
export function useHashRoute() {
  const [hash, setHash] = useState('');
  useEffect(() => {
    const on = () => setHash(window.location.hash || '');
    on();
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const [, view = '', arg = ''] = hash.replace(/^#/, '').split('/');
  const go = (path) => {
    window.location.hash = path;
    window.scrollTo(0, 0);
  };
  return { view, arg: decodeURIComponent(arg), go };
}

export function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast" role="status">{msg}</div>;
}

export function useToast() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(() => setMsg(''), 2200);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg];
}

export function BackLink({ go, to = '/', label = '대시보드' }) {
  return (
    <button type="button" className="link-btn no-print" style={{ marginBottom: 10 }} onClick={() => go(to)}>‹ {label}</button>
  );
}

/* 근무 기록 달력: 기록한 날(검정), 근무 예정일(점선), 오늘(파란 테두리) */
export function TrackerCalendar({ ym, wp, logs, onPick }) {
  const { year, month } = ymParts(ym);
  const first = new Date(year, month - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const last = new Date(year, month, 0).getDate();
  const today = todayKey();
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push(<span className="blank" key={`b${i}`} />);
  for (let d = 1; d <= last; d += 1) {
    const key = toKey(year, month, d);
    const w = (lead + d - 1) % 7;
    const log = byDate.get(key);
    const planned = !log && wp.days && wp.days[w] && key >= (wp.startDate || '') && (!wp.endDate || key <= wp.endDate);
    const paid = log ? analyzeShift(log).paidMin : 0;
    cells.push(
      <button
        type="button"
        key={key}
        className={`${log ? 'logged' : ''} ${planned ? 'planned' : ''} ${key === today ? 'today' : ''}`}
        onClick={() => onPick(key)}
        aria-label={`${month}월 ${d}일 ${log ? `기록 ${minutesLabel(paid)}` : planned ? '근무 예정, 기록 없음' : '기록 없음'}`}
      >
        {d}
        {log && <small className="num">{Math.round(paid / 6) / 10}h</small>}
      </button>,
    );
  }
  return (
    <div>
      <div className="cal tcal">
        {WEEKDAYS.map((d) => <span className="dow" key={d}>{d}</span>)}
        {cells}
      </div>
      <div className="cal-legend">
        <span>■ 기록함</span><span>┅ 근무 예정</span><span>날짜를 눌러 기록·수정</span>
      </div>
    </div>
  );
}

export function IssueList({ issues, empty }) {
  if (!issues.length) return <p className="field-hint" style={{ marginTop: 0 }}>{empty || '지금은 따로 확인이 필요한 항목이 없어요.'}</p>;
  return (
    <div>
      {issues.map((i) => (
        <div key={i.key} className={`issue ${i.tone}`}>
          <span className="mark" aria-hidden />
          <div>
            <div className="t">{i.tone === 'check' ? '⚠ ' : ''}{i.title}</div>
            {i.lines.map((l) => <p className="l" key={l}>{l}</p>)}
            {i.date && <a href={`#/log/${i.date}`}>이 날 기록 보기 ›</a>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Money({ v, sign }) {
  return <>{sign && v > 0 ? '+' : ''}{fmt(v)}원</>;
}

/* 이미지 파일을 작게 줄여 dataURL로 (localStorage 용량 보호) */
export function compressImage(file, maxSide = 900, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
}

export async function shareOrCopy(title, text) {
  try {
    if (navigator.share) { await navigator.share({ title, text }); return 'shared'; }
  } catch (e) { return 'cancel'; }
  return (await copyText(text)) ? 'copied' : 'fail';
}
