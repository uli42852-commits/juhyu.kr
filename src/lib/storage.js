import { useEffect, useState } from 'react';

/* localStorage는 사생활 보호 모드·차단 환경에서 예외를 던질 수 있어 항상 감싼다. */
export function readJSON(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function writeJSON(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}

/* 서버 렌더링 결과와 첫 화면이 같도록 저장값은 마운트 후에 불러온다. */
export function useStoredState(key, initial, { migrate } = {}) {
  const [state, setState] = useState(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let saved = readJSON(key);
    if (!saved && migrate) saved = migrate();
    if (saved && typeof saved === 'object' && !Array.isArray(saved) && typeof initial === 'object' && !Array.isArray(initial)) {
      setState((s) => ({ ...s, ...saved }));
    } else if (saved !== null && saved !== undefined) {
      setState(saved);
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (loaded) writeJSON(key, state);
  }, [key, state, loaded]);

  return [state, setState];
}

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
