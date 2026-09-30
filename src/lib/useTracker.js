import { useCallback, useEffect, useRef, useState } from 'react';
import { TRACKER_KEY, PHOTO_PREFIX, EMPTY_TRACKER, normalizeTracker, newWorkplace, makeLog, uid } from './tracker.js';

function read() {
  try {
    const raw = window.localStorage.getItem(TRACKER_KEY);
    return raw ? normalizeTracker(JSON.parse(raw)) : { ...EMPTY_TRACKER };
  } catch (e) {
    return { ...EMPTY_TRACKER };
  }
}

function write(state) {
  try {
    window.localStorage.setItem(TRACKER_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}

export function savePhoto(logId, dataUrl) {
  try { window.localStorage.setItem(PHOTO_PREFIX + logId, dataUrl); return true; } catch (e) { return false; }
}
export function loadPhoto(logId) {
  try { return window.localStorage.getItem(PHOTO_PREFIX + logId); } catch (e) { return null; }
}
export function removePhoto(logId) {
  try { window.localStorage.removeItem(PHOTO_PREFIX + logId); } catch (e) { /* ignore */ }
}

/* 알바비 추적 상태. 서버 렌더링과 첫 화면을 맞추기 위해 저장값은 마운트 후 불러온다(loaded로 구분). */
export function useTracker() {
  const [state, setState] = useState(EMPTY_TRACKER);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const ref = useRef(EMPTY_TRACKER);

  useEffect(() => {
    ref.current = read();
    setState(ref.current);
    setLoaded(true);
    // 다른 탭에서 바뀐 경우 반영
    const onStorage = (e) => { if (e.key === TRACKER_KEY) { ref.current = read(); setState(ref.current); } };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // 최신 상태(ref)에서 바로 계산해 저장한다 — 호출 직후 결과를 돌려줄 수 있게.
  const commit = useCallback((fn) => {
    const next = fn(ref.current);
    ref.current = next;
    setSaveError(!write(next));
    setState(next);
    return next;
  }, []);

  const active = state.workplaces.find((w) => w.id === state.activeId) || state.workplaces[0] || null;

  const actions = {
    addWorkplace: (fields) => {
      const wp = newWorkplace(fields);
      commit((s) => ({ ...s, workplaces: [...s.workplaces, wp], activeId: wp.id }));
      return wp;
    },
    updateWorkplace: (id, patch) => commit((s) => ({ ...s, workplaces: s.workplaces.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),
    removeWorkplace: (id) => commit((s) => {
      s.logs.filter((l) => l.workplaceId === id && l.hasPhoto).forEach((l) => removePhoto(l.id));
      const workplaces = s.workplaces.filter((w) => w.id !== id);
      return {
        ...s,
        workplaces,
        activeId: workplaces[0] ? workplaces[0].id : null,
        logs: s.logs.filter((l) => l.workplaceId !== id),
        payments: s.payments.filter((p) => p.workplaceId !== id),
        payslips: s.payslips.filter((p) => p.workplaceId !== id),
      };
    }),
    setActive: (id) => commit((s) => ({ ...s, activeId: id })),
    saveLog: (wp, fields) => {
      let saved = null;
      commit((s) => {
        const existing = s.logs.find((l) => l.workplaceId === wp.id && l.date === fields.date);
        saved = makeLog(wp, fields, existing);
        return { ...s, logs: [...s.logs.filter((l) => l !== existing), saved] };
      });
      return saved;
    },
    deleteLog: (id) => commit((s) => { removePhoto(id); return { ...s, logs: s.logs.filter((l) => l.id !== id) }; }),
    setLogPhoto: (id, has) => commit((s) => ({ ...s, logs: s.logs.map((l) => (l.id === id ? { ...l, hasPhoto: has } : l)) })),
    addPayment: (wp, fields) => commit((s) => ({ ...s, payments: [...s.payments, { id: uid(), workplaceId: wp.id, createdAt: new Date().toISOString(), basis: 'net', memo: '', ...fields }] })),
    deletePayment: (id) => commit((s) => ({ ...s, payments: s.payments.filter((p) => p.id !== id) })),
    savePayslip: (wp, month, fields) => commit((s) => {
      const rest = s.payslips.filter((p) => !(p.workplaceId === wp.id && p.month === month));
      return { ...s, payslips: [...rest, { id: uid(), workplaceId: wp.id, month, fields, createdAt: new Date().toISOString() }] };
    }),
    replaceAll: (data) => commit(() => normalizeTracker(data)),
  };

  return { state, loaded, active, saveError, ...actions };
}
