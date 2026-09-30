import React from 'react';
import { Card } from '../ui.jsx';
import { TrackerCalendar, IssueList } from './common.jsx';
import { fmt, h } from '../../lib/pay.js';
import { monthSummary, detectIssues, ymLabel, ymShift, minutesLabel, todayKey } from '../../lib/tracker.js';
import { HELP_LINE } from '../../lib/legal.js';

export function GapBox({ s, go, compact }) {
  const paydayText = s.wp.payday === 'last' ? '말일' : `${s.wp.payday}일`;
  if (s.status === 'waiting') {
    return (
      <div className="gap-box waiting">
        <div className="gk">실제로 받은 금액을 입력하면 비교해드려요</div>
        <p>{s.month}월 근무분은 보통 다음 달 {paydayText}에 들어와요. 입금되면 금액을 입력해주세요.</p>
        {!compact && <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => go(`/pay/${s.ym}`)}>받은 급여 입력</button>}
      </div>
    );
  }
  if (s.status === 'match') {
    return (
      <div className="gap-box match">
        <div className="gk">예상 금액과 거의 같아요</div>
        <p>기록한 근무시간 기준 예상 금액과 실제 입금액의 차이가 {fmt(s.abs)}원이에요.</p>
      </div>
    );
  }
  return (
    <div className={`gap-box ${s.status}`}>
      <div className="gk">{s.status === 'less' ? '⚠ 확인이 필요한 금액' : '예상보다 더 들어온 금액'}</div>
      <div className="gv"><span className="hl">{fmt(s.abs)}원</span></div>
      <p>{s.status === 'less'
        ? '기록한 근무시간과 입력한 실제 입금액 사이에 차이가 있습니다. 어디서 차이가 났는지 확인해보세요.'
        : '추가 수당이나 다른 달 급여가 함께 들어왔을 수 있어요. 명세서와 비교해보세요.'}</p>
      {!compact && <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => go(`/issues/${s.ym}`)}>차이 확인하기</button>}
    </div>
  );
}

export function SummaryStats({ s }) {
  return (
    <div className="stat-grid">
      <div className="stat"><div className="k">일한 시간</div><div className="v">{minutesLabel(s.workMin)}</div></div>
      <div className="stat"><div className="k">근무일</div><div className="v">{s.logs.length}일</div></div>
      <div className="stat"><div className="k">받아야 할 예상 금액</div><div className="v">{fmt(s.expected)}원</div></div>
      <div className="stat"><div className="k">실제로 받은 금액</div>{s.payments.length ? <div className="v">{fmt(s.received)}원</div> : <div className="v muted">아직 입력 전</div>}</div>
      {s.payments.length > 0 && (
        <div className="stat wide"><div className="k">차이 (예상 − 실제)</div><div className="v big" style={{ color: s.status === 'less' ? 'var(--warn)' : s.status === 'match' ? 'var(--good)' : 'var(--primary)' }}>{s.diff > 0 ? '−' : s.diff < 0 ? '+' : ''}{fmt(s.abs)}원</div></div>
      )}
    </div>
  );
}

export default function Dashboard({ state, wp, ym, setYm, go }) {
  const s = monthSummary(state, wp, ym);
  const issues = detectIssues(s);
  const checkCount = issues.filter((i) => i.tone === 'check').length;
  const prevYm = ymShift(ym, -1);
  const prev = monthSummary(state, wp, prevYm);
  const showPrev = prev.logs.length > 0 && ym === todayKey().slice(0, 7);

  return (
    <div className="tk-grid two">
      <div className="tk-grid">
        <Card>
          <div className="period-bar" style={{ marginBottom: 14 }}>
            <strong style={{ fontSize: 17 }}>{ymLabel(ym)}</strong>
            <div className="month-nav">
              <button type="button" aria-label="이전 달" onClick={() => setYm(ymShift(ym, -1))}>‹</button>
              <button type="button" aria-label="다음 달" onClick={() => setYm(ymShift(ym, 1))}>›</button>
            </div>
          </div>
          <SummaryStats s={s} />
          <GapBox s={s} go={go} />
          <p className="basis" style={{ marginTop: 10 }}>
            {s.basis === 'gross' ? '세전' : '공제 후'} 기준 · 기록한 근무 {s.logs.length}일로 계산한 예상치예요{s.calc.conditionalExtra > 0 ? ` · 5인 이상이면 +${fmt(s.calc.conditionalExtra)}원` : ''}.
          </p>
        </Card>

        {s.logs.length > 0 && (
          <div className="streak">🗂 이번 달 <b>{s.logs.length}일</b>, <b>{h(s.workMin / 60)}시간</b>의 근무 기록이 쌓였어요.</div>
        )}

        <div className="action-row">
          <button type="button" className="btn btn-primary" onClick={() => go(`/log/${todayKey()}`)}>오늘 근무 기록</button>
          <button type="button" className="btn btn-ghost" onClick={() => go(`/pay/${s.status === 'waiting' && showPrev ? prevYm : ym}`)}>받은 급여 입력</button>
        </div>

        {showPrev && (
          <Card title={`지난달(${prev.month}월) 급여`} aside={prev.status === 'waiting' ? '입금 전' : ''}>
            <SummaryStats s={prev} />
            <GapBox s={prev} go={go} />
          </Card>
        )}

        <Card title="근무 기록 달력">
          <TrackerCalendar ym={ym} wp={wp} logs={s.logs} onPick={(d) => go(`/log/${d}`)} />
        </Card>
      </div>

      <div className="tk-grid">
        <Card title="확인해볼 항목" aside={checkCount ? `${checkCount}건` : ''}>
          <IssueList issues={issues.slice(0, 4)} empty={s.logs.length ? '지금은 따로 확인이 필요한 항목이 없어요.' : '근무를 기록하면 여기에서 확인할 항목을 찾아드려요.'} />
          {issues.length > 0 && <button type="button" className="link-btn" style={{ marginTop: 12 }} onClick={() => go(`/issues/${ym}`)}>차이 상세 보기 ›</button>}
        </Card>

        <div className="tile-grid">
          <button type="button" className="tile" onClick={() => go('/timeline')}><span className="ic">🗂</span><span className="t">근무 기록 타임라인</span><span className="d">날짜별 기록·메모·사진</span></button>
          <button type="button" className="tile" onClick={() => go(`/report/${ym}`)}><span className="ic">🧾</span><span className="t">{s.month}월 리포트</span><span className="d">한 장으로 정리·공유</span></button>
          <button type="button" className="tile" onClick={() => go(`/payslip/${ym}`)}><span className="ic">🔍</span><span className="t">급여명세서 비교</span><span className="d">항목별 일치·확인 필요</span></button>
          <button type="button" className="tile" onClick={() => go(`/message/${s.status === 'waiting' && showPrev ? prevYm : ym}`)}><span className="ic">💬</span><span className="t">급여 확인 메시지</span><span className="d">사장님께 정중하게 묻기</span></button>
          <button type="button" className="tile" onClick={() => go('/settle')}><span className="ic">📦</span><span className="t">퇴사 전 최종 정산</span><span className="d">전체 기록을 한 번에</span></button>
          <a className="tile" href="/money/#/save"><span className="ic">🐷</span><span className="t">받은 돈 모으기</span><span className="d">저축·투자로 옮긴 금액 기록</span></a>
          <a className="tile" href="/invest/#/buy"><span className="ic">📈</span><span className="t">투자 기록</span><span className="d">알바비로 산 종목 기록</span></a>
          <button type="button" className="tile" onClick={() => go('/settings')}><span className="ic">⚙</span><span className="t">알바 정보·백업</span><span className="d">시급·조건 수정, 파일 백업</span></button>
        </div>
        <p className="fineprint">예상 금액은 입력하신 정보 기준으로 계산한 값이에요. 정확한 판단은 급여명세서와 근로계약 내용을 함께 확인하세요. 상담: {HELP_LINE}</p>
      </div>
    </div>
  );
}
