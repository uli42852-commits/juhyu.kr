import React, { useEffect, useState } from 'react';
import { Card, PrivacyNote, Notice } from '../ui.jsx';
import { useHashRoute, useToast, Toast } from './common.jsx';
import Setup from './Setup.jsx';
import Dashboard from './Dashboard.jsx';
import LogForm from './LogForm.jsx';
import PaymentForm from './PaymentForm.jsx';
import { IssuesView, PayslipView, TimelineView, MessageView, ReportView, SettleView, SettingsView } from './Views.jsx';
import { useTracker } from '../../lib/useTracker.js';
import { todayKey } from '../../lib/tracker.js';

const FLOW = [
  ['1', '알바 정보 입력', '시급·급여일·평소 근무시간'],
  ['2', '매일 근무 기록', '출퇴근 시간만 5초면 끝'],
  ['3', '월급날 입금액 입력', '통장에 들어온 금액'],
  ['4', '차이 자동 확인', '어느 기록에서 차이가 나는지'],
];

function Intro({ onStart }) {
  return (
    <Card>
      <h2 style={{ fontSize: 22, fontWeight: 850, lineHeight: 1.35 }}>일한 시간을 기록하고<br />실제 받은 돈과 비교해보세요.</h2>
      <p className="field-hint" style={{ fontSize: 14.5, marginTop: 8 }}>로그인 없이 바로 시작해요. 기록은 이 기기의 브라우저에만 저장돼요.</p>
      <div style={{ display: 'grid', gap: 10, margin: '18px 0' }}>
        {FLOW.map(([n, t, d]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="step" style={{ marginRight: 0, width: 26, height: 26 }}>{n}</span>
            <span><b style={{ fontSize: 15.5 }}>{t}</b><span className="field-hint" style={{ display: 'block', marginTop: 0 }}>{d}</span></span>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-primary btn-block" onClick={onStart}>내 알바비 추적 시작하기</button>
      <PrivacyNote />
    </Card>
  );
}

export default function TrackerApp() {
  const t = useTracker();
  const { view, arg, go } = useHashRoute();
  const [toastMsg, toast] = useToast();
  const [ym, setYm] = useState('2026-09');
  useEffect(() => { setYm(todayKey().slice(0, 7)); }, []);

  const wp = t.active;
  const ymArg = /^\d{4}-\d{2}$/.test(arg) ? arg : ym;

  let body;
  if (!t.loaded) {
    body = <Intro onStart={() => go('/setup')} />;
  } else if (!wp || view === 'setup') {
    body = (view === 'setup' || view === 'start')
      ? <Setup
          onCancel={() => go('/')}
          onDone={(fields, next) => { t.addWorkplace(fields); go(next === 'log' ? `/log/${todayKey()}` : '/'); toast('알바 정보를 저장했어요'); }}
        />
      : <Intro onStart={() => go('/setup')} />;
  } else if (view === 'log') {
    body = <LogForm key={arg || 'today'} wp={wp} logs={t.state.logs.filter((l) => l.workplaceId === wp.id)} date={arg} go={go} toast={toast}
      onSave={(f) => t.saveLog(wp, f)} onDelete={t.deleteLog} onPhoto={t.setLogPhoto} />;
  } else if (view === 'pay') {
    body = <PaymentForm key={ymArg} wp={wp} state={t.state} month={/^\d{4}-\d{2}$/.test(arg) ? arg : ''} go={go} toast={toast}
      onAdd={(f) => t.addPayment(wp, f)} onDelete={t.deletePayment} />;
  } else if (view === 'issues') {
    body = <IssuesView state={t.state} wp={wp} ym={ymArg} go={go} />;
  } else if (view === 'payslip') {
    body = <PayslipView state={t.state} wp={wp} ym={ymArg} go={go} toast={toast} onSave={(m, f) => t.savePayslip(wp, m, f)} />;
  } else if (view === 'timeline') {
    body = <TimelineView state={t.state} wp={wp} go={go} />;
  } else if (view === 'message') {
    body = <MessageView state={t.state} wp={wp} ym={ymArg} go={go} toast={toast} />;
  } else if (view === 'report') {
    body = <ReportView state={t.state} wp={wp} ym={ymArg} go={go} toast={toast} />;
  } else if (view === 'settle') {
    body = <SettleView state={t.state} wp={wp} go={go} toast={toast} />;
  } else if (view === 'edit') {
    body = <Setup edit={wp} onCancel={() => go('/settings')} onDone={(f) => { t.updateWorkplace(wp.id, f); toast('수정했어요'); go('/settings'); }} />;
  } else if (view === 'settings') {
    body = <SettingsView state={t.state} wp={wp} go={go} toast={toast} onEdit={() => go('/edit')} onAddNew={() => go('/setup')} onRemove={t.removeWorkplace} onImport={t.replaceAll} />;
  } else {
    body = <Dashboard state={t.state} wp={wp} ym={ym} setYm={setYm} go={go} />;
  }

  return (
    <div id="tracker">
      <div className="tk-top">
        <div className="tk-title"><small>JUHYU 월급 탐정</small>알바비 추적</div>
        {t.loaded && wp && t.state.workplaces.length > 0 && view !== 'setup' && (
          <select className="tk-switch" aria-label="알바 선택" value={wp.id} onChange={(e) => (e.target.value === '__new' ? go('/setup') : t.setActive(e.target.value))}>
            {t.state.workplaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            <option value="__new">+ 알바 추가</option>
          </select>
        )}
      </div>
      {t.saveError && <Notice level="danger">저장 공간이 부족해 마지막 변경을 저장하지 못했어요. 사진을 줄이거나 설정에서 백업 후 정리해주세요.</Notice>}
      {body}
      <Toast msg={toastMsg} />
    </div>
  );
}
