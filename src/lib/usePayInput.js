import { useEffect, useMemo } from 'react';
import { useStoredState, readJSON } from './storage.js';
import { calculatePay, comparePay } from './pay.js';
import { CURRENT_MIN_WAGE, CURRENT_YEAR } from './legal.js';

export const PAY_STORAGE_KEY = 'juhyu-pay-v2';
const LEGACY_KEY = 'juhyu-calc-v1'; // 예전 주휴수당 계산기 저장값

export const DEFAULT_PAY_INPUT = {
  wage: String(CURRENT_MIN_WAGE),
  days: [true, true, false, true, true, false, false],
  start: '11:00',
  end: '17:00',
  breakMin: '30',
  perDay: false,
  daySchedules: Array.from({ length: 7 }, () => ({ start: '11:00', end: '17:00', breakMin: '30' })),
  fullAttendance: true,
  workplace: 'unknown',
  extraHours: '',
  deduction: 'none',
  period: 'month',
  // 서버 렌더링 기준 월. 브라우저에서는 마운트 직후 오늘 날짜로 바뀐다.
  year: CURRENT_YEAR,
  month: 9,
  overrides: {},
  actual: '',
  actualBasis: 'net',
};

function migrateLegacy() {
  const old = readJSON(LEGACY_KEY);
  if (!old || !old.wage) return null;
  return { wage: String(old.wage) };
}

export function usePayInput() {
  const [input, setInput] = useStoredState(PAY_STORAGE_KEY, DEFAULT_PAY_INPUT, { migrate: migrateLegacy });

  // 기간은 저장하지 않고 항상 "이번 달"로 시작한다.
  useEffect(() => {
    const now = new Date();
    setInput((s) => ({ ...s, year: now.getFullYear(), month: now.getMonth() + 1 }));
  }, [setInput]);

  const update = (patch) => setInput((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  const result = useMemo(() => calculatePay(input), [input]);
  const verify = useMemo(() => comparePay(result, input.actual, input.actualBasis), [result, input.actual, input.actualBasis]);
  const reset = () => {
    const now = new Date();
    setInput({ ...DEFAULT_PAY_INPUT, year: now.getFullYear(), month: now.getMonth() + 1 });
  };

  return { input, update, result, verify, reset };
}
