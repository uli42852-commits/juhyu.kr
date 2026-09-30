import React, { useEffect, useRef, useState } from 'react';
import { Card, MoneyInput, Notice } from '../ui.jsx';
import { BackLink, IssueList, copyText, shareOrCopy } from './common.jsx';
import { GapBox, SummaryStats } from './Dashboard.jsx';
import { fmt, h, logAmounts, num } from '../../lib/pay.js';
import {
  monthSummary, detectIssues, buildAskMessage, reportText, settlement, ymLabel, ymShift, dateLabel, minutesLabel, payslipOf, TRACKER_KEY,
} from '../../lib/tracker.js';
import { PAYSLIP_FIELDS, parsePayslip, analyzePayslip } from '../../lib/payslip.js';
import { loadPhoto } from '../../lib/useTracker.js';
import { HELP_LINE, DISCLAIMER } from '../../lib/legal.js';

function MonthSwitch({ ym, go, base }) {
  return (
    <div className="month-nav no-print" style={{ marginBottom: 12 }}>
      <button type="button" aria-label="이전 달" onClick={() => go(`/${base}/${ymShift(ym, -1)}`)}>‹</button>
      <span>{ymLabel(ym)}</span>
      <button type="button" aria-label="다음 달" onClick={() => go(`/${base}/${ymShift(ym, 1)}`)}>›</button>
    </div>
  );
}

function slipAnalysis(state, wp, s) {
  const slip = payslipOf(state, wp.id, s.ym);
  return slip ? analyzePayslip(slip.fields, s.calc) : null;
}

/* ── 차이 상세 ─────────────────────────────── */
export function IssuesView({ state, wp, ym, go }) {
  const s = monthSummary(state, wp, ym);
  const analysis = slipAnalysis(state, wp, s);
  const issues = detectIssues(s, { payslipAnalysis: analysis });
  const checks = issues.filter((i) => i.tone === 'check');
  const infos = issues.filter((i) => i.tone !== 'check');
  return (
    <>
      <BackLink go={go} />
      <MonthSwitch ym={ym} go={go} base="issues" />
      <div className="tk-grid two">
        <div className="tk-grid">
          <Card title={`${s.month}월 예상 vs 실제`}>
            <SummaryStats s={s} />
            <GapBox s={s} go={go} compact />
            {s.status === 'waiting' && <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => go(`/pay/${ym}`)}>받은 급여 입력</button>}
          </Card>
          <Card title="예상 금액 내역" aside="내 기록 기준">
            {s.calc.items.map((it) => (
              <div className="deduct-row" key={it.key}>
                <span>{it.label}{it.conditional ? ' (5인 이상이면)' : ''}</span>
                <span className="num" style={it.conditional ? { color: 'var(--warn)' } : undefined}>{it.conditional ? '+' : ''}{fmt(it.amount)}원</span>
              </div>
            ))}
            <div className="total-row"><span>세전</span><span className="num">{fmt(s.calc.gross)}원</span></div>
            {s.calc.deductions.map((d) => <div className="deduct-row" key={d.key}><span>− {d.label}</span><span className="num">{fmt(d.amount)}원</span></div>)}
            {s.calc.deductions.length > 0 && <div className="total-row"><span>공제 후</span><span className="num">{fmt(s.calc.net)}원</span></div>}
            <details className="more">
              <summary>주휴수당은 어떻게 계산됐나요?</summary>
              <div className="more-body">
                <p className="field-hint" style={{ marginTop: 0 }}>{s.calc.items.find((i) => i.key === 'juhyu').why}</p>
                <div className="weeks">
                  {s.calc.weekRows.map((w) => (
                    <div className="week-row" key={w.label}><span>{w.label} · {h(w.hours)}시간</span><span className="num">{w.eligible ? `주휴 ${fmt(w.juhyuPay)}원` : '15시간 미만'}</span></div>
                  ))}
                </div>
              </div>
            </details>
          </Card>
        </div>
        <div className="tk-grid">
          <Card title="확인해볼 항목" aside={checks.length ? `${checks.length}건` : ''}>
            <IssueList issues={checks} empty={s.status === 'waiting' ? '받은 급여를 입력하면 차이가 나는 부분을 찾아드려요.' : '차이 금액과 딱 맞아떨어지는 항목은 찾지 못했어요. 아래 점검 항목과 급여명세서를 함께 확인해보세요.'} />
          </Card>
          {infos.length > 0 && (
            <Card title="기록 점검">
              <IssueList issues={infos} />
            </Card>
          )}
          <Card>
            <p style={{ fontSize: 14.5, lineHeight: 1.7 }}>정확한 판단을 위해 <b>급여명세서와 근로계약 내용을 함께 확인</b>하세요. 차이가 있다고 해서 바로 잘못 지급된 것은 아니에요.</p>
            <div className="action-row" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-ghost" onClick={() => go(`/payslip/${ym}`)}>명세서와 비교</button>
              <button type="button" className="btn btn-primary" onClick={() => go(`/message/${ym}`)}>확인 메시지 만들기</button>
            </div>
            <p className="fineprint">대화로 해결되지 않으면 {HELP_LINE}에서 상담받을 수 있어요.</p>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ── 급여명세서 비교 ─────────────────────────── */
export function PayslipView({ state, wp, ym, go, onSave, toast }) {
  const s = monthSummary(state, wp, ym);
  const saved = payslipOf(state, wp.id, ym);
  const [fields, setFields] = useState(saved ? saved.fields : {});
  const [text, setText] = useState('');
  useEffect(() => { setFields(saved ? saved.fields : {}); }, [ym]); // eslint-disable-line react-hooks/exhaustive-deps
  const has = Object.values(fields).some((v) => num(v) > 0);
  const analysis = has ? analyzePayslip(fields, s.calc) : null;
  const rowMap = analysis ? Object.fromEntries(analysis.rows.map((r) => [r.label, r])) : {};

  return (
    <>
      <BackLink go={go} />
      <MonthSwitch ym={ym} go={go} base="payslip" />
      <div className="tk-grid two">
        <div className="tk-grid">
          <Card title={`${s.month}월 급여명세서`} aside="아는 것만 입력">
            <textarea className="input" style={{ minHeight: 100 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="명세서 내용을 붙여넣으면 금액을 자동으로 읽어요" aria-label="급여명세서 붙여넣기" />
            <button type="button" className="btn btn-ghost btn-sm" style={{ margin: '8px 0 16px' }} disabled={!text.trim()} onClick={() => {
              const p = parsePayslip(text);
              if (Object.keys(p).length) { setFields(Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)]))); toast(`${Object.keys(p).length}개 항목을 읽었어요`); } else toast('읽을 수 있는 항목이 없어요');
            }}>항목 읽어오기</button>
            <div className="grid-2">
              {PAYSLIP_FIELDS.filter((f) => f.key !== 'wage').map((f) => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <label htmlFor={`tp-${f.key}`} style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <MoneyInput id={`tp-${f.key}`} small value={fields[f.key] ?? ''} suffix={f.unit} decimal={f.key === 'hours'} onChange={(v) => setFields((x) => ({ ...x, [f.key]: v }))} />
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-primary btn-block" disabled={!has} onClick={() => { onSave(ym, fields); toast('명세서를 저장했어요'); }}>명세서 저장</button>
          </Card>
        </div>
        <div className="tk-grid">
          <Card title="내 기록 vs 명세서">
            {!analysis && <p className="field-hint" style={{ marginTop: 0 }}>명세서 금액을 입력하면 항목별로 비교해요.</p>}
            {analysis && (
              <>
                <table className="table compact">
                  <thead><tr><th>항목</th><th className="r">내 기록</th><th className="r">명세서</th><th className="r">결과</th></tr></thead>
                  <tbody>
                    {analysis.rows.map((r) => {
                      const ok = Math.abs(r.diff) <= Math.max(1000, r.expected * 0.01);
                      return (
                        <tr key={r.label}>
                          <td>{r.label}{r.note && <span className="basis">{r.note}</span>}</td>
                          <td className="r num">{fmt(r.expected)}</td>
                          <td className="r num">{fmt(r.actual)}</td>
                          <td className="r"><span className={`badge ${ok ? 'good' : 'warn'}`} style={{ marginLeft: 0 }}>{ok ? '일치' : '확인 필요'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {rowMap['지급 합계(세전)'] && (
                  <div className={`gap-box ${Math.abs(rowMap['지급 합계(세전)'].diff) <= 1000 ? 'match' : 'less'}`}>
                    <div className="gk">내 기록상 예상 급여 {fmt(s.calc.gross)}원 · 명세서 지급액 {fmt(analysis.gross)}원</div>
                    <div className="gv">차이 {fmt(Math.abs(s.calc.gross - analysis.gross))}원</div>
                  </div>
                )}
                {analysis.findings.map((f) => (
                  <Notice key={f.title} level={f.level === 'ok' ? 'good' : f.level === 'warn' ? 'warn' : 'info'}><b>{f.title}</b><br />{f.text}</Notice>
                ))}
                <p className="fineprint">"내 기록"은 {s.month}월에 기록한 근무 {s.logs.length}일 기준 예상치예요. 명세서의 급여 기간이 다르면 금액이 달라질 수 있어요.</p>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

/* ── 근무 기록 타임라인 ─────────────────────── */
function Photo({ id }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { setSrc(loadPhoto(id)); }, [id]);
  return src ? <img src={src} alt="첨부 사진" className="tl-photo" loading="lazy" /> : null;
}

export function TimelineView({ state, wp, go }) {
  const logs = state.logs.filter((l) => l.workplaceId === wp.id).sort((a, b) => b.date.localeCompare(a.date));
  const groups = [];
  logs.forEach((l) => {
    const ym = l.date.slice(0, 7);
    if (!groups.length || groups[groups.length - 1].ym !== ym) groups.push({ ym, logs: [] });
    groups[groups.length - 1].logs.push(l);
  });
  return (
    <>
      <BackLink go={go} />
      <div className="page-head" style={{ paddingTop: 4 }}>
        <h1 style={{ fontSize: 24 }}>근무 기록 타임라인</h1>
        <p className="lead">{wp.name}에서 일한 기록을 날짜별로 정리했어요. 출퇴근 시간, 메모, 사진을 한눈에 볼 수 있어요.</p>
      </div>
      {!logs.length && <Card><p className="field-hint" style={{ marginTop: 0 }}>아직 기록이 없어요.</p><button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => go('/log')}>오늘 근무 기록하기</button></Card>}
      {groups.map((g) => (
        <section key={g.ym} className="section" style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 17, marginBottom: 12 }}>{ymLabel(g.ym)} · {g.logs.length}일</h2>
          {g.logs.map((l) => {
            const a = logAmounts(l, wp.wage, wp.size);
            return (
              <div key={l.id} className={`tl-day ${a.nightMin ? 'night' : ''}`}>
                <div className="tl-date"><a href={`#/log/${l.date}`} style={{ color: 'inherit' }}>{dateLabel(l.date)}</a></div>
                <div className="tl-body">{l.start} 출근 · {l.end} 퇴근{num(l.breakMin) ? ` · 휴게 ${l.breakMin}분` : ''}</div>
                <div className="tl-body"><b style={{ color: 'var(--ink)' }}>{minutesLabel(a.paidMin)}</b> · 예상 <b className="num" style={{ color: 'var(--ink)' }}>{fmt(a.total)}원</b>{a.nightMin ? ` · 야간 ${minutesLabel(a.nightMin)}` : ''}</div>
                {l.memo && <div className="tl-memo">📝 {l.memo}</div>}
                {l.hasPhoto && <Photo id={l.id} />}
                <div className="basis">기록 {new Date(l.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}{l.updatedAt && l.updatedAt !== l.createdAt ? ` · 수정 ${new Date(l.updatedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}</div>
              </div>
            );
          })}
        </section>
      ))}
      <p className="fineprint">이 타임라인은 직접 입력한 근무 기록을 정리해두는 기능이에요. 기록한 시각이 함께 남아요. 근무표 사진이나 메신저 대화 같은 자료도 따로 보관해두면 확인할 때 도움이 돼요.</p>
    </>
  );
}

/* ── 급여 확인 메시지 ───────────────────────── */
export function MessageView({ state, wp, ym, go, toast }) {
  const s = monthSummary(state, wp, ym);
  const issues = detectIssues(s, { payslipAnalysis: slipAnalysis(state, wp, s) });
  const [msg, setMsg] = useState(() => buildAskMessage(s, issues));
  useEffect(() => { setMsg(buildAskMessage(s, issues)); }, [ym, s.received, s.logs.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <BackLink go={go} />
      <MonthSwitch ym={ym} go={go} base="message" />
      <Card title="급여 확인 메시지 만들기">
        <p className="field-hint" style={{ marginTop: -8, marginBottom: 12 }}>사실 중심의 정중한 문장으로 만들었어요. 편하게 고쳐서 카톡 등에 붙여넣으세요.</p>
        <textarea className="input" style={{ minHeight: 260, lineHeight: 1.75 }} value={msg} onChange={(e) => setMsg(e.target.value)} aria-label="메시지 내용" />
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={async () => toast((await copyText(msg)) ? '복사됐어요. 카톡에 붙여넣으세요' : '복사하지 못했어요. 길게 눌러 복사해주세요')}>메시지 복사하기</button>
        <Notice level="info">처음에는 "확인 부탁"으로 묻는 게 좋아요. 명세서를 받으면 <a href={`#/payslip/${ym}`}>급여명세서 비교</a>로 항목별로 맞춰보세요.</Notice>
      </Card>
    </>
  );
}

/* ── 월말 리포트 ───────────────────────────── */
export function ReportView({ state, wp, ym, go, toast }) {
  const s = monthSummary(state, wp, ym);
  const issues = detectIssues(s, { payslipAnalysis: slipAnalysis(state, wp, s) });
  const checks = issues.filter((i) => i.tone === 'check').length;
  const text = reportText(s, issues);
  const Row = ({ k, v, em }) => <div className={`report-row ${em ? 'em' : ''}`}><span>{k}</span><b>{v}</b></div>;
  return (
    <>
      <BackLink go={go} />
      <MonthSwitch ym={ym} go={go} base="report" />
      <article className="report">
        <hr className="report-rule" />
        <h1 style={{ fontSize: 21, fontWeight: 850, textAlign: 'center' }}>{s.month}월 알바비 리포트</h1>
        <p style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5, marginTop: 4 }}>{wp.name} · 시급 {fmt(num(wp.wage))}원</p>
        <hr className="report-rule" />
        <Row k="총 근무일" v={`${s.logs.length}일`} />
        <Row k="총 근무시간" v={minutesLabel(s.workMin)} />
        <Row k={`예상 급여 (${s.basis === 'gross' ? '세전' : '공제 후'})`} v={`${fmt(s.expected)}원`} em />
        <Row k="실제 입금액" v={s.payments.length ? `${fmt(s.received)}원` : '입력 전'} em />
        {s.payments.length > 0 && <Row k="차이" v={`${s.diff > 0 ? '−' : s.diff < 0 ? '+' : ''}${fmt(s.abs)}원`} em />}
        <Row k="확인이 필요한 항목" v={`${checks}건`} />
        <Row k="야간근무" v={`${s.nightLogs.length}회`} />
        <Row k="주휴 예상 주" v={`${s.calc.juhyuWeeks}주 / ${s.calc.weekRows.length}주`} />
        <hr className="report-rule" />
        <p className="fineprint" style={{ marginTop: 6 }}>입력한 근무 기록 기준 예상치예요. 정확한 판단은 급여명세서·근로계약서와 함께 확인하세요.</p>
      </article>
      <div className="action-row no-print" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>프린트 / PDF</button>
        <button type="button" className="btn btn-primary" onClick={async () => { const r = await shareOrCopy(`${s.month}월 알바비 리포트`, text); if (r === 'copied') toast('리포트를 복사했어요'); }}>공유하기</button>
      </div>
      <button type="button" className="btn btn-ghost btn-block no-print" style={{ marginTop: 8 }} onClick={() => go(`/issues/${ym}`)}>상세 기록 보기</button>
    </>
  );
}

/* ── 퇴사 전 최종 정산 ───────────────────────── */
export function SettleView({ state, wp, go, toast }) {
  const st = settlement(state, wp);
  const paidMonths = st.months.filter((m) => m.payments.length);
  const text = [
    `퇴사 전 알바비 정산 리포트 · ${wp.name}`,
    `기간 ${st.months[0] ? ymLabel(st.months[0].ym) : ''} ~ ${st.months.length ? ymLabel(st.months[st.months.length - 1].ym) : ''}`,
    `총 근무 ${st.workDays}일 · ${minutesLabel(st.workMin)}`,
    `총 예상 급여 ${fmt(st.expected)}원 · 실제 입금 ${fmt(st.received)}원`,
    ...st.months.map((m) => `- ${ymLabel(m.ym)}: 예상 ${fmt(m.expected)}원 / 입금 ${m.payments.length ? `${fmt(m.received)}원` : '입력 전'}${m.payments.length && m.status !== 'match' ? ` (차이 ${fmt(m.abs)}원)` : ''}`),
    '입력한 근무 기록 기준 예상치입니다. — juhyu.kr',
  ].join('\n');
  return (
    <>
      <BackLink go={go} />
      <article className="report">
        <hr className="report-rule" />
        <h1 style={{ fontSize: 21, fontWeight: 850, textAlign: 'center' }}>퇴사 전 알바비 정산 리포트</h1>
        <p style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5, marginTop: 4 }}>{wp.name}{wp.startDate ? ` · ${wp.startDate} 시작` : ''}{wp.endDate ? ` · ${wp.endDate} 종료 예정` : ''}</p>
        <hr className="report-rule" />
        <div className="report-row"><span>총 근무일 · 근무시간</span><b>{st.workDays}일 · {minutesLabel(st.workMin)}</b></div>
        <div className="report-row em"><span>총 예상 급여</span><b>{fmt(st.expected)}원</b></div>
        <div className="report-row em"><span>실제 지급액 (입력한 입금)</span><b>{fmt(st.received)}원</b></div>
        <div className="report-row em"><span>입금 기록이 있는 달의 차이</span><b>{st.diffPaidMonths > 0 ? '−' : st.diffPaidMonths < 0 ? '+' : ''}{fmt(Math.abs(st.diffPaidMonths))}원</b></div>
        <div className="report-row"><span>입금 기록이 없는 달</span><b>{st.unpaidMonths.length ? st.unpaidMonths.map((m) => `${m.month}월`).join(', ') : '없음'}</b></div>
        <div className="report-row"><span>확인이 필요한 항목</span><b>{st.checkCount}건</b></div>
        <div className="report-row"><span>급여명세서 기록</span><b>{st.payslips.length}개월</b></div>
        <hr className="report-rule" />
        <table className="table compact" style={{ marginTop: 10 }}>
          <thead><tr><th>월</th><th className="r">예상</th><th className="r">입금</th><th className="r">차이</th></tr></thead>
          <tbody>
            {st.months.map((m) => (
              <tr key={m.ym}>
                <td><a href={`#/issues/${m.ym}`}>{m.year !== st.months[0].year ? `${m.year}.` : ''}{m.month}월</a> <span className="basis" style={{ display: 'inline' }}>{m.logs.length}일</span></td>
                <td className="r num">{fmt(m.expected)}</td>
                <td className="r num">{m.payments.length ? fmt(m.received) : '—'}</td>
                <td className="r num" style={{ color: m.status === 'less' ? 'var(--warn)' : undefined }}>{m.payments.length ? `${m.diff > 0 ? '−' : m.diff < 0 ? '+' : ''}${fmt(m.abs)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {st.memos.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, margin: '18px 0 8px' }}>메모가 있는 근무 기록 ({st.memos.length})</h2>
            {st.memos.map((l) => <div key={l.id} className="deduct-row"><span>{dateLabel(l.date)} {l.start}~{l.end}</span><span style={{ textAlign: 'right' }}>{l.memo}</span></div>)}
          </>
        )}
        <p className="fineprint">퇴사하면 남은 임금은 원칙적으로 14일 이내에 정산받아요. 1년 이상, 주 평균 15시간 이상 일했다면 <a href="/severance-pay/">퇴직금</a>도 확인해보세요. {DISCLAIMER}</p>
      </article>
      <div className="action-row no-print" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>프린트 / PDF</button>
        <button type="button" className="btn btn-primary" onClick={async () => { const r = await shareOrCopy('퇴사 전 알바비 정산', text); if (r === 'copied') toast('정산 내용을 복사했어요'); }}>공유하기</button>
      </div>
      {paidMonths.length === 0 && <Notice level="info">입금 기록이 아직 없어요. 받은 급여를 입력하면 달마다 예상 금액과 비교돼요.</Notice>}
      <button type="button" className="btn btn-ghost btn-block no-print" style={{ marginTop: 8 }} onClick={() => go('/timeline')}>전체 근무 기록 보기</button>
    </>
  );
}

/* ── 설정·백업 ─────────────────────────────── */
export function SettingsView({ state, wp, go, onEdit, onAddNew, onRemove, onImport, toast }) {
  const fileRef = useRef(null);
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `juhyu-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importJson = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (window.confirm('백업 파일로 지금 기록을 바꿀까요? (사진은 포함되지 않아요)')) { onImport(data); toast('백업을 불러왔어요'); go('/'); }
    } catch (err) { toast('백업 파일을 읽지 못했어요'); }
    e.target.value = '';
  };
  const count = state.logs.filter((l) => l.workplaceId === wp.id).length;
  return (
    <>
      <BackLink go={go} />
      <Card title="알바 정보" aside={wp.name}>
        <div className="deduct-row"><span>시급</span><span className="num">{fmt(num(wp.wage))}원</span></div>
        <div className="deduct-row"><span>급여일</span><span>매월 {wp.payday === 'last' ? '말일' : `${wp.payday}일`}</span></div>
        <div className="deduct-row"><span>평소 근무</span><span>{wp.start}~{wp.end} · 휴게 {wp.breakMin}분</span></div>
        <div className="deduct-row"><span>사업장 규모 · 공제</span><span>{{ over5: '5인 이상', under5: '5인 미만', unknown: '잘 모름' }[wp.size]} · {{ none: '없음', tax33: '3.3%', insurance: '4대보험' }[wp.deduction]}</span></div>
        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={onEdit}>알바 정보 수정</button>
        <p className="fineprint">시급이나 조건을 바꾸면 지난 기록의 예상 금액도 새 조건으로 다시 계산돼요.</p>
      </Card>
      <Card title="다른 알바">
        <p className="field-hint" style={{ marginTop: -8 }}>투잡이라면 알바를 추가해 따로 기록할 수 있어요. 위쪽에서 알바를 바꿔 볼 수 있어요.</p>
        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={onAddNew}>+ 알바 추가</button>
      </Card>
      <Card title="백업">
        <p className="field-hint" style={{ marginTop: -8 }}>기록은 이 브라우저에만 저장돼요. 브라우저 데이터를 지우거나 기기를 바꾸면 사라지니, 가끔 파일로 백업해두세요.</p>
        <div className="action-row" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-ghost" onClick={exportJson}>백업 파일 저장</button>
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current && fileRef.current.click()}>백업 불러오기</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJson} />
        <p className="basis">저장 위치: 브라우저 localStorage ({TRACKER_KEY}). 사진은 백업 파일에 포함되지 않아요.</p>
      </Card>
      <Card title="삭제">
        <button type="button" className="btn btn-ghost btn-block" style={{ color: 'var(--bad)' }} onClick={() => { if (window.confirm(`${wp.name}의 알바 정보와 근무 기록 ${count}개를 모두 삭제할까요? 되돌릴 수 없어요.`)) { onRemove(wp.id); toast('삭제했어요'); go('/'); } }}>
          {wp.name} 삭제
        </button>
      </Card>
    </>
  );
}

