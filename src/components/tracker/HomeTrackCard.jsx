import React from 'react';
import { useTracker } from '../../lib/useTracker.js';
import { monthSummary, todayKey, ymShift, minutesLabel } from '../../lib/tracker.js';
import { fmt } from '../../lib/pay.js';

/* 홈의 "이번 달 알바비" 카드 — 추적 기록이 있으면 실제 숫자, 없으면 시작 안내 */
export default function HomeTrackCard() {
  const { state, loaded, active } = useTracker();
  const hasData = loaded && active && state.logs.some((l) => l.workplaceId === active.id);

  if (!hasData) return null;

  const cur = todayKey().slice(0, 7);
  const now = monthSummary(state, active, cur);
  const prev = monthSummary(state, active, ymShift(cur, -1));
  const s = !now.payments.length && prev.payments.length ? prev : now;
  const diffText = s.payments.length ? `${s.diff > 0 ? '−' : s.diff < 0 ? '+' : ''}${fmt(s.abs)}원` : '입금 전';

  return (
    <section className="home-track" aria-label="이번 달 알바비">
      <h2>{s.month}월 알바비 · {active.name}</h2>
      <p>{now.logs.length ? `이번 달 ${now.logs.length}일, ${minutesLabel(now.workMin)}을 기록했어요.` : '이번 달 기록을 시작해보세요.'}</p>
      <div className="row">
        <div><div className="k">받아야 할 돈</div><div className="v">{fmt(s.expected)}원</div></div>
        <div><div className="k">받은 돈</div><div className="v">{s.payments.length ? `${fmt(s.received)}원` : '—'}</div></div>
        <div><div className="k">차이</div><div className={`v ${s.status === 'less' ? 'hl' : ''}`}>{diffText}</div></div>
      </div>
      {s.status === 'less' && <p style={{ marginBottom: 12 }}>⚠ 확인이 필요한 금액이 있어요. 이번 달 급여를 한번 더 확인해보세요.</p>}
      <div className="action-row">
        <a className="btn btn-marker" href={s.status === 'less' || s.status === 'more' ? `/tracker/#/issues/${s.ym}` : '/tracker/'}>{s.status === 'less' || s.status === 'more' ? '차이 확인하기' : '대시보드'}</a>
        <a className="btn btn-ghost" href={`/tracker/#/log/${todayKey()}`}>오늘 근무 기록</a>
      </div>
    </section>
  );
}
