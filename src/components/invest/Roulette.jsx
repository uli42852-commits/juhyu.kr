import React, { useEffect, useRef, useState } from 'react';
import { Card, Field, MoneyInput, Notice } from '../ui.jsx';
import { BackLink } from '../tracker/common.jsx';
import {
  rouletteCandidates, pickIndex, makeRouletteEntry, rouletteStats, holdingStats, investedIn, workIncomeIn, hoursOfWork, mainWage,
} from '../../lib/money.js';
import { fmt, num } from '../../lib/pay.js';
import { todayKey } from '../../lib/tracker.js';

const ROW = 64;
const won = (v) => `${fmt(v)}원`;
const label = (h) => h.ticker || h.name;
const curPrice = (v, c) => (c === 'USD' ? `$${Number(num(v).toFixed(2)).toLocaleString('en-US')}` : won(v));
const fmtShares = (v) => (Number.isInteger(v) ? fmt(v) : Number(v.toFixed(4)).toLocaleString('ko-KR'));
const TITLES = [(x) => `🎉 오늘은 ${x}!`, () => '🎰 운명의 종목', () => '오늘의 선택'];

export const ROULETTE_NOTE = '재미로 고르는 기능이에요. 후보는 내가 직접 고른 종목이고 모두 같은 확률로 뽑혀요. 투자 권유나 추천이 아니며, 살지 말지는 내가 정해요.';

const itemsKey = (items) => items.map((h) => h.id).join(',');

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}

/* 세로 슬롯머신. 빠르게 돌다가 감속해서 가운데 칸에 멈춘다. */
function Slot({ items, spin, onDone }) {
  const stripRef = useRef(null);
  const [strip, setStrip] = useState(items.length ? [items[items.length - 1], ...items] : []);
  const [finalIdx, setFinalIdx] = useState(-1);
  const [win, setWin] = useState(false);

  // 멈춰 있을 때는 후보 목록을 그대로 보여준다(첫 후보가 가운데)
  useEffect(() => {
    if (spin) return;
    setWin(false);
    setStrip(items.length ? [items[items.length - 1], ...items, items[0]] : []);
    const el = stripRef.current;
    if (el) { el.style.transition = 'none'; el.style.transform = 'translateY(0px)'; }
  }, [itemsKey(items), spin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!spin) return undefined;
    const n = spin.items.length;
    const loops = Math.max(4, Math.ceil(28 / n));
    const start = Math.floor(Math.random() * n);
    const seq = [];
    const total = n * loops + ((spin.index - start + n) % n);
    for (let i = -1; i <= total + 1; i += 1) seq.push(spin.items[((start + i) % n + n) % n]);
    setStrip(seq);
    setFinalIdx(total + 1);
    setWin(false);
    const el = stripRef.current;
    const reduced = prefersReducedMotion();
    const duration = reduced ? 400 : 3000;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setWin(true);
      try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) { /* ignore */ }
      onDone();
    };
    let raf1; let raf2; let timer;
    if (el) {
      el.style.transition = 'none';
      el.style.transform = 'translateY(0px)';
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          el.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.72, 0.16, 1)`;
          el.style.transform = `translateY(${-total * ROW}px)`;
        });
      });
      el.addEventListener('transitionend', finish, { once: true });
    }
    timer = setTimeout(finish, duration + 300); // transitionend가 안 오는 환경 대비
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); clearTimeout(timer); if (el) el.removeEventListener('transitionend', finish); };
  }, [spin]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`slot ${win ? 'win' : ''}`} aria-hidden>
      <span className="slot-ptr top">▼</span>
      <div className="slot-band" />
      <div className="slot-strip" ref={stripRef}>
        {strip.map((h, i) => (
          <div key={i} className={`slot-item ${win && i === finalIdx ? 'final' : ''}`}>{label(h)}{h.name && h.ticker && h.name !== h.ticker && <small>{h.name.slice(0, 10)}</small>}</div>
        ))}
      </div>
      <span className="slot-ptr bot">▲</span>
    </div>
  );
}

export default function Roulette({ m, tracker, go, toast }) {
  const money = m.state;
  const cands = rouletteCandidates(money);
  const chosen = cands.filter((c) => c.checked).map((c) => c.holding);
  const [spin, setSpin] = useState(null); // { items, index, key }
  const [phase, setPhase] = useState('idle'); // idle | spinning | result
  const [result, setResult] = useState(null); // 저장된 룰렛 기록
  const [editCands, setEditCands] = useState(true);
  const [title, setTitle] = useState(TITLES[0]);
  const resultRef = useRef(null);
  const planned = money.roulette.plannedAmount;

  const ym = todayKey().slice(0, 7);
  const workIn = workIncomeIn(tracker.state, ym);
  const invMonth = investedIn(money, ym).total;
  const plan = num(money.roulette.monthlyPlan);
  const wage = mainWage(tracker.state);

  const toggle = (id) => {
    if (phase === 'spinning') return;
    setSpin(null); // 후보가 바뀌면 슬롯을 멈춘 상태로 되돌린다(다시 돌지 않게)
    const ex = new Set(money.roulette.excluded);
    if (ex.has(id)) ex.delete(id); else ex.add(id);
    m.setRoulette({ excluded: [...ex] });
  };
  const setAll = (on) => { if (phase === 'spinning') return; setSpin(null); m.setRoulette({ excluded: on ? [] : money.holdings.map((h) => h.id) }); };

  const start = () => {
    if (chosen.length < 2 || phase === 'spinning') return;
    const index = pickIndex(chosen.length);
    setResult(null);
    setPhase('spinning');
    setEditCands(false);
    setTitle(() => TITLES[pickIndex(TITLES.length)]);
    setSpin({ items: chosen, index, key: Date.now() });
  };

  const onDone = () => {
    // 결과만 기록한다. 실제 매수는 사용자가 "매수 기록 저장"을 눌렀을 때만.
    const entry = makeRouletteEntry(spin.items, spin.index, { plannedAmount: planned });
    m.addRouletteEntry(entry);
    setResult(entry);
    setPhase('result');
    setTimeout(() => { if (resultRef.current) resultRef.current.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' }); }, 120);
  };

  const stats = rouletteStats(money);
  const resHolding = result ? money.holdings.find((h) => h.id === result.resultId) : null;
  const rs = resHolding ? holdingStats(money, resHolding) : null;
  const prob = chosen.length ? Math.round(1000 / chosen.length) / 10 : 0;

  if (money.holdings.length < 2) {
    return (
      <>
        <BackLink go={go} label="내 투자" />
        <Card title="🎰 오늘 뭐 살까?">
          <p>내 포트폴리오에서 오늘 살 종목을 골라보는 룰렛이에요. 종목을 <b>2개 이상</b> 등록하면 돌릴 수 있어요.</p>
          <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={() => go('/add')}>종목 추가하기</button>
        </Card>
      </>
    );
  }

  return (
    <>
      <BackLink go={go} label="내 투자" />
      <div className="tk-grid two">
        <div className="tk-grid">
          <Card title="🎰 오늘 뭐 살까?" aside="내 포트폴리오 룰렛">
            <p className="field-hint" style={{ marginTop: -8, marginBottom: 10 }}>내 포트폴리오에서 오늘 살 종목을 골라보세요.</p>

            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 12 }}>
              <div className="stat"><div className="k">이번 달 알바 수입</div><div className="v" style={{ fontSize: 15.5 }}>{won(workIn)}</div></div>
              <div className="stat"><div className="k">이번 달 투자</div><div className="v" style={{ fontSize: 15.5 }}>{won(invMonth)}</div></div>
              <div className="stat"><div className="k">{plan ? '남은 투자 예정' : '투자 예정'}</div><div className="v" style={{ fontSize: 15.5 }}>{plan ? won(Math.max(0, plan - invMonth)) : '—'}</div></div>
            </div>

            <Slot items={chosen} spin={spin} onDone={onDone} />

            <Field label="오늘 투자할 금액 (선택)" htmlFor="rl-amt" hint={num(planned) && wage ? `알바 약 ${hoursOfWork(num(planned), wage)}시간치예요. 결과가 나와도 자동으로 기록되지 않아요.` : '결과가 나와도 자동으로 기록되지 않아요.'}>
              <MoneyInput id="rl-amt" value={planned} onChange={(v) => m.setRoulette({ plannedAmount: v })} placeholder="예: 30,000" />
            </Field>

            <button type="button" className="spin-btn" onClick={start} disabled={chosen.length < 2 || phase === 'spinning'} aria-live="polite">
              {phase === 'spinning' ? '돌아가는 중…' : phase === 'result' ? '🔄 다시 돌리기' : '🎰 룰렛 돌리기'}
            </button>
            {chosen.length < 2 && <p className="field-hint" style={{ textAlign: 'center' }}>후보를 2개 이상 선택해주세요.</p>}
            {chosen.length >= 2 && <p className="basis" style={{ textAlign: 'center' }}>후보 {chosen.length}개 · 각 {prob}% 같은 확률</p>}
          </Card>

          {phase === 'result' && result && (
            <div className="pick-result" ref={resultRef} aria-live="polite">
              <div className="rk">{title(result.resultLabel)}</div>
              <div className="rv"><span>{result.resultLabel}</span></div>
              {resHolding && resHolding.name && resHolding.name !== result.resultLabel && <div className="rn">{resHolding.name}</div>}
              <hr />
              {rs && (
                <div className="stat-grid">
                  <div className="stat"><div className="k">보유수량</div><div className="v" style={{ fontSize: 18 }}>{fmtShares(rs.shares)}주</div></div>
                  <div className="stat"><div className="k">평균매수가</div><div className="v" style={{ fontSize: 18 }}>{curPrice(rs.avgPrice, resHolding.currency)}</div></div>
                  <div className="stat"><div className="k">현재 평가금액</div><div className="v" style={{ fontSize: 18 }}>{won(rs.valueKrw)}</div></div>
                  <div className="stat"><div className="k">예상 연 배당</div><div className="v" style={{ fontSize: 18 }}>{won(rs.annualDivKrw)}</div></div>
                </div>
              )}
              {num(result.plannedAmount) > 0 && (
                <>
                  <hr />
                  <div className="deduct-row" style={{ fontSize: 15 }}><span>오늘 투자 예정</span><b className="num">{won(num(result.plannedAmount))}</b></div>
                </>
              )}
              <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
                <button type="button" className="btn btn-primary btn-block" onClick={() => go(`/buy/${result.resultId}/${result.id}`)}>이 종목 매수 기록하기</button>
                <div className="action-row">
                  <button type="button" className="btn btn-ghost" onClick={start}>🔄 다시 돌리기</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditCands(true)}>후보 종목 수정</button>
                </div>
              </div>
              <p className="fineprint" style={{ textAlign: 'center' }}>룰렛 결과는 기록만 돼요. 실제로 샀다면 &lsquo;매수 기록하기&rsquo;로 남겨주세요.</p>
            </div>
          )}

          {(editCands || phase === 'idle') && (
            <Card title="오늘 매수 후보" aside={`${chosen.length}/${cands.length}개 선택`}>
              <div className="action-row" style={{ marginBottom: 12 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAll(true)} disabled={phase === 'spinning'}>전체 선택</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAll(false)} disabled={phase === 'spinning'}>전체 해제</button>
              </div>
              <div className="cand-grid">
                {cands.map(({ holding: h, checked }) => {
                  const st = holdingStats(money, h);
                  return (
                    <button key={h.id} type="button" role="checkbox" aria-checked={checked} className="cand" disabled={phase === 'spinning'} onClick={() => toggle(h.id)}>
                      <span className="box" aria-hidden>{checked ? '✓' : ''}</span>
                      <span><span className="t">{label(h)}</span><span className="d">보유 {fmtShares(st.shares)}주 · 평가 {fmt(Math.round(st.valueKrw / 1000))}천원</span></span>
                    </button>
                  );
                })}
              </div>
              <p className="fineprint">포트폴리오에 종목을 추가하면 여기에도 자동으로 나타나요.</p>
            </Card>
          )}
        </div>

        <div className="tk-grid">
          <Card title="🎰 나의 룰렛" aside="재미용 통계">
            <div className="stat-grid">
              <div className="stat"><div className="k">총 룰렛 횟수</div><div className="v">{stats.spins}회</div></div>
              <div className="stat"><div className="k">가장 많이 나온 종목</div><div className="v">{stats.top ? `${stats.top.label} ${stats.top.count}회` : '—'}</div></div>
              <div className="stat"><div className="k">룰렛 돌린 날 중 매수한 날</div><div className="v">{stats.boughtDays}/{stats.days}일</div></div>
              <div className="stat"><div className="k">결과 종목을 실제로 산 날</div><div className="v">{stats.matchedDays}일</div></div>
            </div>
            <p className="basis">통계는 재미로 보는 숫자이고 투자 성과와는 관계없어요.</p>
          </Card>
          <Card title="룰렛 기록">
            {!stats.list.length && <p className="field-hint" style={{ marginTop: 0 }}>아직 돌린 기록이 없어요.</p>}
            {stats.list.slice(0, 30).map((e) => (
              <div className="hist-row" key={e.id}>
                <span>{Number(e.date.slice(5, 7))}월 {Number(e.date.slice(8))}일 <span className="basis" style={{ display: 'inline' }}>{new Date(e.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span></span>
                <b>{e.label}</b>
                <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 'auto', color: e.purchase ? 'var(--good)' : 'var(--ink-3)' }}>
                  {e.purchase ? `실제 매수 ✅ ${fmt(e.purchaseKrw)}원` : e.boughtOther ? '다른 종목 매수' : '실제 매수 ❌'}
                </span>
              </div>
            ))}
          </Card>
          <Notice level="info">{ROULETTE_NOTE}</Notice>
          <Field label="이번 달 투자 예정 금액 (선택)" htmlFor="rl-plan" hint="정해두면 남은 금액을 위에서 보여줘요.">
            <MoneyInput id="rl-plan" value={money.roulette.monthlyPlan} onChange={(v) => m.setRoulette({ monthlyPlan: v })} placeholder="예: 200,000" />
          </Field>
        </div>
      </div>
    </>
  );
}

export { default as RouletteTeaser } from './RouletteTeaser.jsx';
