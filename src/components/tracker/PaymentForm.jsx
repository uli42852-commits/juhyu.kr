import React, { useState } from 'react';
import { Card, Field, MoneyInput, Segmented } from '../ui.jsx';
import { BackLink } from './common.jsx';
import { fmt, num } from '../../lib/pay.js';
import { todayKey, defaultPayMonth, ymLabel, ymShift, ymOf } from '../../lib/tracker.js';

export default function PaymentForm({ wp, state, month: presetMonth, go, onAdd, onDelete, toast }) {
  const today = todayKey();
  const [f, setF] = useState({ date: today, month: presetMonth || defaultPayMonth(today), amount: '', basis: 'net', memo: '' });
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const monthOptions = [-3, -2, -1, 0].map((d) => ymShift(ymOf(f.date), d));
  if (!monthOptions.includes(f.month)) monthOptions.unshift(f.month);
  const list = state.payments.filter((p) => p.workplaceId === wp.id).sort((a, b) => b.date.localeCompare(a.date));

  const save = () => {
    onAdd({ date: f.date, month: f.month, amount: String(num(f.amount)), basis: f.basis, memo: f.memo.trim() });
    toast(`${Number(f.month.slice(5))}월분 ${fmt(num(f.amount))}원 저장`);
    go(`/issues/${f.month}`);
  };

  return (
    <>
      <BackLink go={go} />
      <Card title="받은 급여 입력" aside={wp.name}>
        <Field label="입금액" htmlFor="p-amt">
          <MoneyInput id="p-amt" value={f.amount} onChange={(v) => set({ amount: v })} placeholder="예: 962,300" />
        </Field>
        <Field label="입금일" htmlFor="p-date">
          <input id="p-date" className="input" type="date" value={f.date} onChange={(e) => e.target.value && set({ date: e.target.value, month: defaultPayMonth(e.target.value) })} />
        </Field>
        <Field label="몇 월에 일한 급여인가요?" htmlFor="p-month" hint={`월급날이 매월 ${wp.payday === 'last' ? '말일' : `${wp.payday}일`}이면 보통 지난달 근무분이에요.`}>
          <select id="p-month" className="input" value={f.month} onChange={(e) => set({ month: e.target.value })}>
            {monthOptions.map((m) => <option key={m} value={m}>{ymLabel(m)} 근무분</option>)}
          </select>
        </Field>
        <Field label="이 금액은…" hint="통장 입금액은 공제 후 금액이라, 설정한 공제 방식을 뺀 예상 금액과 비교해요.">
          <Segmented label="금액 기준" options={[{ value: 'net', label: '통장에 들어온 돈' }, { value: 'gross', label: '세전 금액' }]} value={f.basis} onChange={(v) => set({ basis: v })} />
        </Field>
        <Field label="메모 (선택)" htmlFor="p-memo">
          <input id="p-memo" className="input" style={{ fontWeight: 500, fontSize: 16 }} value={f.memo} maxLength={100} onChange={(e) => set({ memo: e.target.value })} placeholder="예: 9월분, 명세서 받음" />
        </Field>
        <button type="button" className="btn btn-primary btn-block" disabled={!num(f.amount)} onClick={save}>저장하고 비교하기</button>
      </Card>

      {list.length > 0 && (
        <Card title="입금 기록">
          <div className="pay-list">
            {list.map((p) => (
              <div className="pay-item" key={p.id}>
                <span>{p.date.slice(5).replace('-', '/')} 입금 · {ymLabel(p.month)}분{p.memo ? ` · ${p.memo}` : ''}</span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <b className="num">{fmt(num(p.amount))}원</b>
                  <button type="button" aria-label="입금 기록 삭제" style={{ border: 0, background: 'none', color: 'var(--ink-3)', fontSize: 18, padding: '0 2px 0 10px' }} onClick={() => { if (window.confirm('이 입금 기록을 삭제할까요?')) onDelete(p.id); }}>×</button>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
