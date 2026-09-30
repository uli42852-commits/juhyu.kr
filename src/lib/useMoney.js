import { useCallback, useEffect, useRef, useState } from 'react';
import { MONEY_KEY, EMPTY_MONEY, normalizeMoney, newHolding, upsertSnapshot, uid } from './money.js';
import { todayKey } from './tracker.js';

function read() {
  try {
    const raw = window.localStorage.getItem(MONEY_KEY);
    return raw ? normalizeMoney(JSON.parse(raw)) : normalizeMoney(null);
  } catch (e) {
    return normalizeMoney(null);
  }
}
function write(state) {
  try { window.localStorage.setItem(MONEY_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
}
const hasData = (m) => m.holdings.length || m.savings.length || m.dividends.length;

/* 투자·배당·저축 상태. useTracker와 같은 방식(마운트 후 로드, ref로 즉시 저장). */
export function useMoney() {
  const [state, setState] = useState(EMPTY_MONEY);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const ref = useRef(EMPTY_MONEY);

  useEffect(() => {
    let m = read();
    // 이번 달 자산을 기록해둔다 → 다음 달부터 이 달 평가금액이 그래프에 남는다
    if (hasData(m)) { const next = upsertSnapshot(m); if (next !== m) { m = next; write(m); } }
    ref.current = m;
    setState(m);
    setLoaded(true);
    const onStorage = (e) => { if (e.key === MONEY_KEY) { ref.current = read(); setState(ref.current); } };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const commit = useCallback((fn) => {
    let next = fn(ref.current);
    if (hasData(next)) next = upsertSnapshot(next);
    ref.current = next;
    setSaveError(!write(next));
    setState(next);
    return next;
  }, []);

  const now = () => new Date().toISOString();
  const actions = {
    /* 종목 등록: 보유수량·평균매수가를 넣으면 첫 매수 기록으로 남긴다 */
    addHolding: (fields, initial) => {
      const h = newHolding(fields);
      commit((s) => ({
        ...s,
        holdings: [...s.holdings, h],
        trades: initial && Number(initial.shares) > 0
          ? [...s.trades, { id: uid(), holdingId: h.id, type: 'buy', date: initial.date || todayKey(), shares: String(initial.shares), price: String(initial.price || 0), krw: String(initial.krw || ''), memo: initial.initial ? '보유 종목 등록' : '처음 등록', initial: !!initial.initial, createdAt: now() }]
          : s.trades,
      }));
      return h;
    },
    updateHolding: (id, patch) => commit((s) => ({ ...s, holdings: s.holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
    removeHolding: (id) => commit((s) => ({
      ...s,
      holdings: s.holdings.filter((h) => h.id !== id),
      trades: s.trades.filter((t) => t.holdingId !== id),
      dividends: s.dividends.filter((d) => d.holdingId !== id),
    })),
    addTrade: (fields) => {
      const t = { id: uid(), type: 'buy', memo: '', krw: '', createdAt: now(), ...fields };
      commit((s) => ({ ...s, trades: [...s.trades, t] }));
      return t;
    },
    removeTrade: (id) => commit((s) => ({ ...s, trades: s.trades.filter((t) => t.id !== id) })),
    addDividend: (fields) => commit((s) => ({ ...s, dividends: [...s.dividends, { id: uid(), currency: 'KRW', memo: '', createdAt: now(), ...fields }] })),
    removeDividend: (id) => commit((s) => ({ ...s, dividends: s.dividends.filter((d) => d.id !== id) })),
    addSaving: (fields) => commit((s) => ({ ...s, savings: [...s.savings, { id: uid(), type: 'save', memo: '', createdAt: now(), ...fields }] })),
    removeSaving: (id) => commit((s) => ({ ...s, savings: s.savings.filter((x) => x.id !== id) })),
    setRoulette: (patch) => commit((s) => ({ ...s, roulette: { ...s.roulette, ...patch } })),
    addRouletteEntry: (entry) => commit((s) => ({ ...s, roulette: { ...s.roulette, history: [...s.roulette.history, entry].slice(-500) } })),
    linkRoulette: (entryId, tradeId) => commit((s) => ({ ...s, roulette: { ...s.roulette, history: s.roulette.history.map((e) => (e.id === entryId ? { ...e, purchaseId: tradeId } : e)) } })),
    setSettings: (patch) => commit((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    replaceAll: (data) => commit(() => normalizeMoney(data)),
  };

  return { state, loaded, saveError, ...actions };
}
