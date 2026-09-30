import React, { useState } from 'react';
import { Card, Field, MoneyInput, Segmented, Notice } from '../ui.jsx';
import { DaysField } from '../PayForm.jsx';
import { analyzeShift, fmt, h } from '../../lib/pay.js';
import { minWageFor, CURRENT_YEAR } from '../../lib/legal.js';
import { todayKey } from '../../lib/tracker.js';

const BREAKS = [{ value: '0', label: '없음' }, { value: '30', label: '30분' }, { value: '60', label: '1시간' }, { value: '90', label: '90분' }];

/* 알바 정보 3단계 설정. edit가 있으면 수정 모드(한 화면). */
export default function Setup({ onDone, onCancel, edit }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState(() => edit || {
    name: '', wage: String(minWageFor(CURRENT_YEAR)), payday: '10', startDate: todayKey(), endDate: '',
    start: '17:00', end: '22:00', breakMin: '30', days: [true, false, true, false, true, false, false], size: 'unknown', deduction: 'none',
  });
  const set = (p) => setF((x) => ({ ...x, ...(typeof p === 'function' ? p(x) : p) }));
  const shift = analyzeShift(f);
  const min = minWageFor(CURRENT_YEAR);

  const step1 = (
    <>
      <Field label="알바 이름" htmlFor="s-name">
        <input id="s-name" className="input" style={{ fontWeight: 600 }} value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="예: 카페 알바" maxLength={20} />
      </Field>
      <Field label="시급" htmlFor="s-wage" aside={<button type="button" className="chip-min" onClick={() => set({ wage: String(min) })}>{CURRENT_YEAR} 최저 {fmt(min)}원</button>}>
        <MoneyInput id="s-wage" value={f.wage} onChange={(v) => set({ wage: v })} />
      </Field>
      {Number(f.wage) > 0 && Number(f.wage) < min && <Notice level="warn">{CURRENT_YEAR}년 최저임금({fmt(min)}원)보다 낮아요. 근로계약서의 시급을 확인해보세요.</Notice>}
      <Field label="급여 지급일" htmlFor="s-payday" hint="보통 지난달 일한 만큼을 이날 받아요.">
        <select id="s-payday" className="input" value={f.payday} onChange={(e) => set({ payday: e.target.value })}>
          {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => <option key={d} value={d}>매월 {d}일</option>)}
          <option value="last">매월 말일</option>
        </select>
      </Field>
      <div className="grid-2">
        <Field label="근무 시작일" htmlFor="s-sd"><input id="s-sd" className="input" type="date" value={f.startDate} onChange={(e) => set({ startDate: e.target.value })} /></Field>
        <Field label="종료 예정일 (선택)" htmlFor="s-ed"><input id="s-ed" className="input" type="date" value={f.endDate} onChange={(e) => set({ endDate: e.target.value })} /></Field>
      </div>
    </>
  );

  const step2 = (
    <>
      <p className="field-hint" style={{ marginTop: -6, marginBottom: 14 }}>평소 근무 기준이에요. 매일 기록할 때 기본값으로 채워지고, 날마다 바꿀 수 있어요.</p>
      <div className="grid-2">
        <Field label="보통 출근" htmlFor="s-st"><input id="s-st" className="input" type="time" value={f.start} onChange={(e) => set({ start: e.target.value })} /></Field>
        <Field label="보통 퇴근" htmlFor="s-en"><input id="s-en" className="input" type="time" value={f.end} onChange={(e) => set({ end: e.target.value })} /></Field>
      </div>
      <Field label="휴게시간" hint={shift.valid ? `하루 ${h(shift.paidMin / 60)}시간 근무${shift.nightMin ? ` · 야간(22~06시) ${h(shift.nightMin / 60)}시간 포함` : ''}${shift.paidMin > 480 ? ' · 8시간 초과' : ''}` : ''}>
        <Segmented label="휴게시간" options={BREAKS} value={String(f.breakMin)} onChange={(v) => set({ breakMin: v })} />
      </Field>
      <DaysField input={f} update={set} />
      <Field label="사업장 상시 근로자 수" hint="야간·연장 가산(50%)은 5인 이상 사업장에만 적용돼요. 주휴수당은 기록한 시간으로 자동 판단해요.">
        <Segmented label="사업장 규모" options={[{ value: 'over5', label: '5인 이상' }, { value: 'under5', label: '5인 미만' }, { value: 'unknown', label: '잘 모름' }]} value={f.size} onChange={(v) => set({ size: v })} />
      </Field>
      <Field label="급여에서 빠지는 돈" hint="모르면 '공제 없음'으로 두고 나중에 바꿔도 돼요.">
        <Segmented label="공제" options={[{ value: 'none', label: '공제 없음' }, { value: 'tax33', label: '3.3%' }, { value: 'insurance', label: '4대보험' }]} value={f.deduction} onChange={(v) => set({ deduction: v })} />
      </Field>
    </>
  );

  if (edit) {
    return (
      <Card title="알바 정보 수정">
        {step1}
        {step2}
        <div className="action-row">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>취소</button>
          <button type="button" className="btn btn-primary" onClick={() => onDone({ ...f, name: f.name.trim() || '내 알바' })}>저장</button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="steps" aria-label={`${step}/3단계`}>{[1, 2, 3].map((i) => <span key={i} className={i <= step ? 'on' : ''} />)}</div>
      {step === 1 && (
        <>
          <h2 className="card-title">알바 정보 <small>STEP 1/3</small></h2>
          {step1}
          <div className="action-row">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>취소</button>
            <button type="button" className="btn btn-primary" disabled={!Number(f.wage)} onClick={() => setStep(2)}>다음</button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <h2 className="card-title">근무 조건 <small>STEP 2/3</small></h2>
          {step2}
          <div className="action-row">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>이전</button>
            <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>다음</button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <h2 className="card-title">준비 완료 <small>STEP 3/3</small></h2>
          <div className="gap-box match" style={{ marginTop: 0 }}>
            <div className="gk">{f.name.trim() || '내 알바'}</div>
            <p>시급 {fmt(Number(f.wage))}원 · 매월 {f.payday === 'last' ? '말일' : `${f.payday}일`} 지급 · 주 {f.days.filter(Boolean).length}일 {f.start}~{f.end}</p>
          </div>
          <p style={{ fontSize: 17, fontWeight: 800, margin: '20px 0 6px' }}>이제부터 일한 기록을 남겨보세요.</p>
          <p className="field-hint" style={{ marginTop: 0 }}>하루 5초면 돼요. 기록이 쌓이면 월급날 받은 돈과 자동으로 비교해드려요.</p>
          <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
            <button type="button" className="btn btn-primary btn-block" onClick={() => onDone({ ...f, name: f.name.trim() || '내 알바' }, 'log')}>오늘 근무 기록하기</button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => onDone({ ...f, name: f.name.trim() || '내 알바' }, 'home')}>대시보드로 가기</button>
          </div>
        </>
      )}
    </Card>
  );
}
