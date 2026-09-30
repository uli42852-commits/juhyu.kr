import React, { useState } from 'react';
import { Card, Field, MoneyInput, Segmented, Notice, Basis, PrivacyNote } from './ui.jsx';
import { useStoredState } from '../lib/storage.js';
import { fmt, h } from '../lib/pay.js';
import { CURRENT_MIN_WAGE, CURRENT_YEAR, LAW } from '../lib/legal.js';

/* 기존 juhyu.kr 주휴수당 계산기 — 저장 키(juhyu-calc-v1 등)를 그대로 써서 기존 사용자 데이터를 유지한다. */
const DAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

export function weeklyJuhyu(wage, weeklyHours, fullAttendance) {
  const eligibleByHours = weeklyHours >= 15;
  const eligible = eligibleByHours && fullAttendance;
  const juhyuPay = eligible ? wage * (Math.min(weeklyHours, 40) / 40) * 8 : 0;
  const basePay = wage * weeklyHours;
  return { eligibleByHours, eligible, juhyuPay, basePay, totalPay: basePay + juhyuPay };
}

async function shareText(title, text, onCopied) {
  const url = 'https://juhyu.kr/weekly-holiday-pay/';
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return; }
  } catch (e) { /* 공유 취소 */ }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    if (onCopied) onCopied();
  } catch (e) { /* clipboard 실패 */ }
}

function useFlash() {
  const [on, setOn] = useState(false);
  return [on, () => { setOn(true); setTimeout(() => setOn(false), 1800); }];
}

export default function WeeklyHolidayCalc() {
  const [main, setMain] = useStoredState('juhyu-calc-v1', { wage: String(CURRENT_MIN_WAGE), hours: Array(7).fill(''), fullAttendance: true });
  const [job2, setJob2] = useStoredState('juhyu-calc-job2-v1', { job2On: false, wage2: String(CURRENT_MIN_WAGE), totalHours2: '', fullAttendance2: true });
  const [log, setLog] = useStoredState('juhyu-receipt-log-v1', []);
  const [copied, flashCopied] = useFlash();
  const [saved, flashSaved] = useFlash();
  const [msgCopied, flashMsg] = useFlash();
  const [showMsg, setShowMsg] = useState(false);

  const wage = parseFloat(main.wage) || 0;
  const hours = Array.isArray(main.hours) && main.hours.length === 7 ? main.hours : Array(7).fill('');
  const weeklyHours = hours.reduce((s, x) => s + (parseFloat(x) || 0), 0);
  const r = weeklyJuhyu(wage, weeklyHours, main.fullAttendance !== false);

  const wage2 = parseFloat(job2.wage2) || 0;
  const hours2 = parseFloat(job2.totalHours2) || 0;
  const r2 = weeklyJuhyu(wage2, hours2, job2.fullAttendance2 !== false);

  const setDay = (i, v) => setMain((s) => ({ ...s, hours: hours.map((x, j) => (j === i ? v : x)) }));

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTotal = log.filter((e) => e.date && e.date.slice(0, 7) === thisMonth && e.eligible).reduce((s, e) => s + e.juhyuPay, 0);

  const employerMsg = `안녕하세요, 이번 주 근무 관련해서 확인차 연락드려요.\n\n제가 이번 주 총 ${h(weeklyHours)}시간 근무했는데, 주휴수당 조건(주 15시간 이상 + 개근)에 해당하는 것 같아 주휴수당 ${fmt(r.juhyuPay)}원이 급여에 포함되는지 여쭤보고 싶어요.\n\n확인 부탁드립니다. 감사합니다!`;

  return (
    <div className="calc-grid" id="calc">
      <Card title="이번 주 근무" step="1">
        <Field label="시급" htmlFor="w-wage" aside={<button type="button" className="chip-min" onClick={() => setMain((s) => ({ ...s, wage: String(CURRENT_MIN_WAGE) }))}>{CURRENT_YEAR} 최저 {fmt(CURRENT_MIN_WAGE)}원</button>}>
          <MoneyInput id="w-wage" value={main.wage} onChange={(v) => setMain((s) => ({ ...s, wage: v }))} />
          {wage > 0 && wage < CURRENT_MIN_WAGE && <Notice level="danger">{CURRENT_YEAR}년 최저임금({fmt(CURRENT_MIN_WAGE)}원)보다 낮아요. 근로계약서의 시급을 확인해보세요.</Notice>}
        </Field>

        <Field label="요일별 근무시간 (휴게시간 제외)" hint="자주 쓰는 시간은 버튼으로, 그 외는 오른쪽 칸에 직접 입력하세요.">
          <div style={{ display: 'grid', gap: 8 }}>
            {DAYS.map((d, i) => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 22, fontWeight: 800, color: i === 6 ? 'var(--bad)' : 'var(--ink-2)', fontSize: 14.5 }}>{d[0]}</span>
                <div className="seg" style={{ flex: 1 }}>
                  {[0, 4, 6, 8].map((p) => (
                    <button key={p} type="button" aria-pressed={hours[i] === String(p)} onClick={() => setDay(i, hours[i] === String(p) ? '' : String(p))}>{p}</button>
                  ))}
                </div>
                <input
                  className="input num sm" style={{ width: 70, textAlign: 'center', padding: '0 6px' }}
                  type="text" inputMode="decimal" placeholder="직접" aria-label={`${d} 근무시간`}
                  value={hours[i]} onChange={(e) => setDay(i, e.target.value.replace(/[^\d.]/g, ''))}
                />
              </div>
            ))}
          </div>
        </Field>

        <Field label="이번 주 정해진 근무일, 하루도 안 빠지고 나갔나요?">
          <Segmented
            label="개근 여부"
            options={[{ value: true, label: '네, 개근했어요' }, { value: false, label: '결근이 있었어요' }]}
            value={main.fullAttendance !== false}
            onChange={(v) => setMain((s) => ({ ...s, fullAttendance: v }))}
          />
        </Field>
        <PrivacyNote />
      </Card>

      <div className="sticky-col">
        <Card title="주휴수당 판정" step="2" id="result-weekly">
          <div className="result-label">이번 주 주휴수당</div>
          <div className="result-big num">{fmt(r.juhyuPay)}<span className="unit">원</span></div>
          <Notice level={r.eligible ? 'good' : 'warn'}>
            <b>{r.eligible ? '이번 주는 주휴수당 지급 대상이에요' : '이번 주는 지급 대상이 아니에요'}</b>
            <br />
            {r.eligible && `주 ${h(weeklyHours)}시간 · 개근 → 주휴 ${h(Math.min(weeklyHours, 40) / 40 * 8)}시간분`}
            {!r.eligibleByHours && `주 근무시간이 ${h(weeklyHours)}시간으로 15시간 미만이에요. 초단시간 근로자는 주휴수당이 발생하지 않아요.`}
            {r.eligibleByHours && main.fullAttendance === false && '결근이 있는 주는 15시간을 넘겨 일했어도 주휴수당이 발생하지 않아요.'}
          </Notice>
          <div className="items">
            <div className="deduct-row"><span>주 근무시간</span><span className="num">{h(weeklyHours)}시간</span></div>
            <div className="deduct-row"><span>근무수당 (시급 × 시간)</span><span className="num">{fmt(r.basePay)}원</span></div>
            <div className="deduct-row"><span>주휴수당 (시급 × 시간 ÷ 40 × 8)</span><span className="num">{fmt(r.juhyuPay)}원</span></div>
            <div className="total-row"><span>이번 주 합계 (세전)</span><span className="num">{fmt(r.totalPay)}원</span></div>
          </div>
          <Basis basis={LAW.juhyu} />
          <Basis basis={LAW.shortTime} />

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => shareText('주휴수당 계산', r.eligible ? `이번 주 주휴수당 ${fmt(r.juhyuPay)}원! 주 ${h(weeklyHours)}시간 기준 총 ${fmt(r.totalPay)}원. 나도 계산해봤어요 →` : '내 주휴수당 계산해봤는데 이번 주는 지급 대상이 아니래요. 조건 확인해보세요 →', flashCopied)}>
              {copied ? '✓ 복사됐어요' : '📤 공유하기'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setLog((l) => [{ id: Date.now(), date: new Date().toISOString(), weeklyHours, eligible: r.eligible, juhyuPay: r.juhyuPay, totalPay: r.totalPay }, ...l].slice(0, 52)); flashSaved(); }}>
              {saved ? '✓ 저장됐어요' : '🧾 영수증철에 저장'}
            </button>
          </div>

          {log.length > 0 && (
            <details className="more">
              <summary>🧾 영수증철 {log.length}장 · 이번 달 주휴 {fmt(monthTotal)}원</summary>
              <div className="more-body">
                {log.map((e) => (
                  <div key={e.id} className="deduct-row" style={{ alignItems: 'center' }}>
                    <span>{new Date(e.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })} · {h(e.weeklyHours)}시간 <span className={`badge ${e.eligible ? 'good' : 'gray'}`}>{e.eligible ? '지급' : '미지급'}</span></span>
                    <span>
                      <span className="num">{fmt(e.juhyuPay)}원</span>
                      <button type="button" aria-label="삭제" onClick={() => setLog((l) => l.filter((x) => x.id !== e.id))} style={{ border: 0, background: 'none', color: 'var(--ink-3)', fontSize: 18, padding: '0 4px 0 10px' }}>×</button>
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {r.eligible && (
            <details className="more" open={showMsg} onToggle={(e) => setShowMsg(e.currentTarget.open)}>
              <summary>🧑‍💼 사장님께 물어볼 메시지 만들기</summary>
              <div className="more-body">
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>{employerMsg}</div>
                <button type="button" className="btn btn-primary btn-block btn-sm" style={{ marginTop: 8 }} onClick={async () => { try { await navigator.clipboard.writeText(employerMsg); flashMsg(); } catch (e) { /* ignore */ } }}>
                  {msgCopied ? '✓ 복사됐어요, 카톡에 붙여넣으세요' : '메시지 복사하기'}
                </button>
              </div>
            </details>
          )}
        </Card>

        <Card title="다른 알바도 하고 있다면 (투잡)" step="3">
          <Segmented
            label="투잡 계산"
            options={[{ value: false, label: '알바 1개' }, { value: true, label: '알바 2개' }]}
            value={!!job2.job2On}
            onChange={(v) => setJob2((s) => ({ ...s, job2On: v }))}
          />
          {job2.job2On && (
            <div style={{ marginTop: 14 }}>
              <div className="grid-2">
                <Field label="알바 2 시급" htmlFor="w2-wage"><MoneyInput id="w2-wage" small value={job2.wage2} onChange={(v) => setJob2((s) => ({ ...s, wage2: v }))} /></Field>
                <Field label="이번 주 총 시간" htmlFor="w2-h"><MoneyInput id="w2-h" small decimal suffix="시간" value={job2.totalHours2} onChange={(v) => setJob2((s) => ({ ...s, totalHours2: v }))} /></Field>
              </div>
              <Segmented
                label="알바 2 개근 여부"
                options={[{ value: true, label: '개근했어요' }, { value: false, label: '결근 있었어요' }]}
                value={job2.fullAttendance2 !== false}
                onChange={(v) => setJob2((s) => ({ ...s, fullAttendance2: v }))}
              />
              <div className="items">
                <div className="deduct-row"><span>알바 2 주휴수당</span><span className="num">{fmt(r2.juhyuPay)}원</span></div>
                <div className="deduct-row"><span>두 알바 주휴수당 합계</span><span className="num">{fmt(r.juhyuPay + r2.juhyuPay)}원</span></div>
                <div className="total-row"><span>이번 주 총 수령액 (세전)</span><span className="num">{fmt(r.totalPay + r2.totalPay)}원</span></div>
              </div>
            </div>
          )}
          <p className="fineprint">주휴수당은 사업장마다 따로 따져요. 두 알바를 합쳐 15시간을 넘어도, 한쪽이 15시간 미만이면 그쪽은 지급 대상이 아니에요.</p>
        </Card>
      </div>
    </div>
  );
}
