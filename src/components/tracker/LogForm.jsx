import React, { useEffect, useRef, useState } from 'react';
import { Card, Field, Segmented, Notice } from '../ui.jsx';
import { BackLink, compressImage } from './common.jsx';
import { logAmounts, legalBreakMin, fmt } from '../../lib/pay.js';
import { dateLabel, minutesLabel, todayKey } from '../../lib/tracker.js';
import { savePhoto, loadPhoto, removePhoto } from '../../lib/useTracker.js';

const BREAKS = [{ value: '0', label: '없음' }, { value: '30', label: '30분' }, { value: '60', label: '1시간' }, { value: '90', label: '90분' }];

export default function LogForm({ wp, logs, date: initialDate, go, onSave, onDelete, onPhoto, toast }) {
  const [date, setDate] = useState(initialDate || todayKey());
  const existing = logs.find((l) => l.date === date);
  const blank = { start: wp.start, end: wp.end, breakMin: String(wp.breakMin), memo: '' };
  const [f, setF] = useState(existing ? { start: existing.start, end: existing.end, breakMin: existing.breakMin, memo: existing.memo } : blank);
  const [photo, setPhoto] = useState(null);
  const [photoErr, setPhotoErr] = useState('');
  const fileRef = useRef(null);

  // 날짜를 바꾸면 그 날 기록(없으면 평소 조건)으로 채운다
  useEffect(() => {
    const ex = logs.find((l) => l.date === date);
    setF(ex ? { start: ex.start, end: ex.end, breakMin: ex.breakMin, memo: ex.memo } : blank);
    setPhoto(ex && ex.hasPhoto ? loadPhoto(ex.id) : null);
    setPhotoErr('');
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (p) => setF((x) => ({ ...x, ...p }));
  const calc = logAmounts({ ...f, date }, wp.wage, wp.size);
  const needBreak = legalBreakMin(calc.paidMin);

  const save = () => {
    const saved = onSave({ ...f, date, hasPhoto: !!photo });
    if (saved && photo) {
      if (!savePhoto(saved.id, photo)) {
        onPhoto(saved.id, false);
        setPhotoErr('사진이 너무 커서 저장하지 못했어요. 근무 기록은 저장됐어요.');
        return;
      }
    } else if (saved && !photo) {
      removePhoto(saved.id);
    }
    toast(`${dateLabel(date)} 기록 완료`);
    go('/');
  };

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try { setPhoto(await compressImage(file)); setPhotoErr(''); } catch (err) { setPhotoErr('사진을 불러오지 못했어요.'); }
    e.target.value = '';
  };

  return (
    <>
      <BackLink go={go} />
      <Card title={existing ? '근무 기록 수정' : '근무 기록'} aside={wp.name}>
        <Field label="날짜" htmlFor="l-date">
          <input id="l-date" className="input" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </Field>
        <div className="quick" aria-label="빠른 입력">
          <button type="button" onClick={() => set({ start: wp.start, end: wp.end, breakMin: String(wp.breakMin) })}>평소처럼 ({wp.start}~{wp.end})</button>
          <button type="button" onClick={() => set({ end: addMin(f.end, 30) })}>퇴근 +30분</button>
          <button type="button" onClick={() => set({ end: addMin(f.end, 60) })}>퇴근 +1시간</button>
        </div>
        <div className="grid-2">
          <Field label="출근" htmlFor="l-s"><input id="l-s" className="input" type="time" value={f.start} onChange={(e) => set({ start: e.target.value })} /></Field>
          <Field label="퇴근" htmlFor="l-e"><input id="l-e" className="input" type="time" value={f.end} onChange={(e) => set({ end: e.target.value })} /></Field>
        </div>
        <Field label="휴게시간">
          <Segmented label="휴게시간" options={BREAKS} value={String(f.breakMin)} onChange={(v) => set({ breakMin: v })} />
        </Field>

        <div className="live-calc" aria-live="polite">
          <div>
            <div className="k">실근무시간</div>
            <div className="v">{minutesLabel(calc.paidMin)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="k">예상 임금 (주휴 제외)</div>
            <div className="v hl">{fmt(calc.total)}원</div>
          </div>
        </div>
        {calc.nightMin > 0 && (
          <Notice level="info">야간(22~06시) {minutesLabel(calc.nightMin)} 포함{wp.size === 'over5' ? ` · 야간 가산 ${fmt(calc.night)}원 반영` : wp.size === 'unknown' ? ` · 5인 이상이면 +${fmt(calc.nightIfOver5)}원` : ''}</Notice>
        )}
        {calc.paidMin > 480 && <Notice level="info">하루 8시간을 넘겼어요{wp.size === 'over5' ? ` · 연장 가산 ${fmt(calc.overtime)}원 반영` : ''}.</Notice>}
        {calc.valid && calc.breakMin < needBreak && <Notice level="warn">이 근무시간이면 법정 휴게시간은 {needBreak}분 이상이에요. 실제로 쉰 시간이 맞는지 확인해보세요.</Notice>}

        <Field label="메모 (선택)" htmlFor="l-memo" hint="예: 마감 30분 추가, 매니저 요청으로 1시간 연장">
          <textarea id="l-memo" className="input" style={{ minHeight: 76 }} value={f.memo} maxLength={300} onChange={(e) => set({ memo: e.target.value })} />
        </Field>
        <Field label="사진 (선택)" hint="근무표·출퇴근 기록 화면 등. 이 기기에만 저장돼요.">
          {photo ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <img src={photo} alt="첨부한 사진" className="tl-photo" style={{ marginTop: 0 }} />
              <button type="button" className="link-btn" onClick={() => setPhoto(null)}>사진 빼기</button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current && fileRef.current.click()}>📎 사진 첨부</button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </Field>
        {photoErr && <Notice level="warn">{photoErr}</Notice>}

        <button type="button" className="btn btn-primary btn-block" onClick={save} disabled={!calc.valid}>근무 기록 저장</button>
        {existing && (
          <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => { if (window.confirm(`${dateLabel(date)} 기록을 삭제할까요?`)) { onDelete(existing.id); toast('기록을 삭제했어요'); go('/'); } }}>
            이 기록 삭제
          </button>
        )}
      </Card>
    </>
  );
}

function addMin(t, m) {
  const [hh, mm] = String(t || '00:00').split(':').map(Number);
  const tot = (hh * 60 + mm + m) % 1440;
  return `${String(Math.floor(tot / 60)).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`;
}
