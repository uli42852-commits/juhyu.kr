import React from 'react';
import { Field, MoneyInput, Segmented, Switch } from './ui.jsx';
import { WEEKDAYS, analyzeShift, h, fmt } from '../lib/pay.js';
import { minWageFor } from '../lib/legal.js';

const BREAK_OPTIONS = [
  { value: '0', label: '없음' },
  { value: '30', label: '30분' },
  { value: '60', label: '1시간' },
  { value: '90', label: '90분' },
];

export function WageField({ input, update, id = 'wage' }) {
  const min = minWageFor(input.year);
  return (
    <Field
      label="시급"
      htmlFor={id}
      aside={<button type="button" className="chip-min" onClick={() => update({ wage: String(min) })}>{input.year} 최저 {fmt(min)}원</button>}
    >
      <MoneyInput id={id} value={input.wage} onChange={(v) => update({ wage: v })} placeholder={String(min)} />
    </Field>
  );
}

export function DaysField({ input, update }) {
  const toggle = (i) => update((s) => ({ days: s.days.map((d, j) => (j === i ? !d : d)) }));
  return (
    <Field label="일하는 요일" aside={<span className="field-hint" style={{ margin: 0 }}>주 {input.days.filter(Boolean).length}일</span>}>
      <div className="days">
        {WEEKDAYS.map((d, i) => (
          <button key={d} type="button" aria-pressed={!!input.days[i]} className={i === 6 ? 'sun' : ''} onClick={() => toggle(i)}>
            {d}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function TimeFields({ input, update }) {
  const shift = analyzeShift(input);
  const setDay = (i, patch) => update((s) => ({
    daySchedules: s.daySchedules.map((d, j) => (j === i ? { ...d, ...patch } : d)),
  }));
  return (
    <>
      <div className="grid-2">
        <Field label="출근" htmlFor="t-start">
          <input id="t-start" className="input" type="time" value={input.start} onChange={(e) => update({ start: e.target.value })} />
        </Field>
        <Field label="퇴근" htmlFor="t-end">
          <input id="t-end" className="input" type="time" value={input.end} onChange={(e) => update({ end: e.target.value })} />
        </Field>
      </div>
      <Field label="휴게시간 (무급)" hint={shift.valid ? `하루 실제 근로 ${h(shift.paidMin / 60)}시간${shift.nightMin ? ` · 그중 야간(22~06시) ${h(shift.nightMin / 60)}시간` : ''}` : '출퇴근 시간을 입력하세요'}>
        <Segmented label="휴게시간" options={BREAK_OPTIONS} value={String(input.breakMin)} onChange={(v) => update({ breakMin: v })} />
      </Field>
      <Switch
        label="요일마다 근무시간이 달라요"
        checked={!!input.perDay}
        onChange={(v) => update((s) => ({
          perDay: v,
          // 처음 켤 때는 공통 시간으로 채워준다
          daySchedules: v && !s.perDay ? s.daySchedules.map(() => ({ start: s.start, end: s.end, breakMin: s.breakMin })) : s.daySchedules,
        }))}
      />
      {input.perDay && (
        <div className="perday">
          <div className="perday-row" style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700 }}>
            <span />
            <span>출근</span><span>퇴근</span><span>휴게(분)</span>
          </div>
          {WEEKDAYS.map((d, i) => input.days[i] && (
            <div className="perday-row" key={d}>
              <span className="d">{d}</span>
              <input className="input" type="time" aria-label={`${d}요일 출근`} value={input.daySchedules[i].start} onChange={(e) => setDay(i, { start: e.target.value })} />
              <input className="input" type="time" aria-label={`${d}요일 퇴근`} value={input.daySchedules[i].end} onChange={(e) => setDay(i, { end: e.target.value })} />
              <input className="input num" type="text" inputMode="numeric" aria-label={`${d}요일 휴게시간(분)`} value={input.daySchedules[i].breakMin} onChange={(e) => setDay(i, { breakMin: e.target.value.replace(/\D/g, '') })} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function ConditionFields({ input, update, open = false }) {
  return (
    <details className="more" open={open}>
      <summary>더 정확하게 (사업장 규모·결근·추가근무·공제)</summary>
      <div className="more-body">
        <Field label="사업장 상시 근로자 수" hint="야간·연장근로 가산(50%)은 상시 5인 이상 사업장에만 적용돼요. 주휴수당은 규모와 상관없이 적용돼요.">
          <Segmented
            label="사업장 규모"
            options={[{ value: 'over5', label: '5인 이상' }, { value: 'under5', label: '5인 미만' }, { value: 'unknown', label: '잘 모름' }]}
            value={input.workplace}
            onChange={(v) => update({ workplace: v })}
          />
        </Field>
        <Field label="결근한 날이 있나요?" hint="합의해서 쉰 날이 아니라 정해진 근무일에 빠진 경우를 말해요. 결근한 주는 주휴수당이 발생하지 않아요.">
          <Segmented
            label="개근 여부"
            options={[{ value: true, label: '없어요 (개근)' }, { value: false, label: '있어요' }]}
            value={input.fullAttendance !== false}
            onChange={(v) => update({ fullAttendance: v })}
          />
        </Field>
        <Field label="스케줄 외 추가근무" htmlFor="extra" hint="이 기간에 원래 스케줄보다 더 일한 시간을 모두 더해서 넣어주세요.">
          <MoneyInput id="extra" value={input.extraHours} onChange={(v) => update({ extraHours: v })} placeholder="0" suffix="시간" decimal />
        </Field>
        <Field label="급여에서 빠지는 돈" hint="모르면 급여명세서나 근로계약서를 확인해보세요. 근로소득세는 부양가족 등에 따라 달라 따로 계산하지 않아요(월급이 적으면 0원인 경우가 많아요).">
          <Segmented
            label="공제 방식"
            options={[{ value: 'none', label: '공제 없음' }, { value: 'tax33', label: '3.3%' }, { value: 'insurance', label: '4대보험' }]}
            value={input.deduction}
            onChange={(v) => update({ deduction: v })}
          />
        </Field>
      </div>
    </details>
  );
}

export default function PayForm({ input, update, conditionsOpen }) {
  return (
    <>
      <WageField input={input} update={update} />
      <DaysField input={input} update={update} />
      <TimeFields input={input} update={update} />
      <ConditionFields input={input} update={update} open={conditionsOpen} />
    </>
  );
}
