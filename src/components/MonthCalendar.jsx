import React from 'react';
import { WEEKDAYS, toKey, analyzeShift, daySchedule, h } from '../lib/pay.js';

/* 이번 달 달력: 날짜를 눌러 쉬는 날/추가 출근을 표시하면 예상 금액에 바로 반영된다. */
export default function MonthCalendar({ input, update }) {
  const { year, month } = input;
  const first = new Date(year, month - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const last = new Date(year, month, 0).getDate();
  const overrides = input.overrides || {};

  const toggle = (key, patternOn) => update((s) => {
    const next = { ...(s.overrides || {}) };
    if (next[key]) delete next[key];
    else next[key] = patternOn ? 'off' : 'on';
    return { overrides: next };
  });

  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push(<span className="blank" key={`b${i}`} />);
  for (let d = 1; d <= last; d += 1) {
    const w = (lead + d - 1) % 7;
    const key = toKey(year, month, d);
    const patternOn = !!input.days[w];
    const o = overrides[key];
    const on = o ? o === 'on' : patternOn;
    const hrs = on ? analyzeShift(daySchedule(input, w)).paidMin / 60 : 0;
    cells.push(
      <button
        type="button"
        key={key}
        className={`${on ? 'on' : ''} ${o ? 'override' : ''}`}
        aria-pressed={on}
        aria-label={`${month}월 ${d}일 ${on ? `근무 ${h(hrs)}시간` : '쉬는 날'}${o ? ' (변경됨)' : ''}`}
        onClick={() => toggle(key, patternOn)}
      >
        {d}
        {on && <small className="num">{h(hrs)}h</small>}
      </button>,
    );
  }

  const changed = Object.keys(overrides).filter((k) => k.startsWith(`${year}-${String(month).padStart(2, '0')}`)).length;

  return (
    <div>
      <div className="cal">
        {WEEKDAYS.map((d) => <span className="dow" key={d}>{d}</span>)}
        {cells}
      </div>
      <div className="cal-legend">
        <span>날짜를 누르면 근무 ↔ 쉬는 날이 바뀌어요</span>
        {changed > 0 && (
          <button
            type="button"
            className="link-btn"
            onClick={() => update((s) => {
              const prefix = `${year}-${String(month).padStart(2, '0')}`;
              const next = Object.fromEntries(Object.entries(s.overrides || {}).filter(([k]) => !k.startsWith(prefix)));
              return { overrides: next };
            })}
          >
            변경 {changed}건 되돌리기
          </button>
        )}
      </div>
    </div>
  );
}
