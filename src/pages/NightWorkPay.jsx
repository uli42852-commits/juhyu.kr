import React from 'react';
import { PageHead, Faq, Examples, Related, Section, Prose } from '../components/Sections.jsx';
import { Card, Field, MoneyInput, Segmented, Notice, Basis, PrivacyNote } from '../components/ui.jsx';
import { useStoredState } from '../lib/storage.js';
import { analyzeShift, fmt, h, num } from '../lib/pay.js';
import { CURRENT_MIN_WAGE, LAW, DISCLAIMER } from '../lib/legal.js';

export const faq = [
  {
    q: '야간수당은 몇 시부터 붙나요?',
    a: ['밤 10시부터 다음 날 새벽 6시 사이에 일한 시간이 야간근로예요. 이 시간에는 시급의 50%를 더 받아요(상시 5인 이상 사업장).'],
  },
  {
    q: '5인 미만 편의점도 야간수당을 줘야 하나요?',
    a: ['상시 근로자 5인 미만 사업장은 야간·연장·휴일근로 가산 규정이 적용되지 않아요. 다만 근로계약서나 취업규칙에 야간수당을 주기로 정했다면 그에 따라요. 주휴수당과 최저임금은 5인 미만도 똑같이 적용돼요.'],
  },
  {
    q: '야간이면서 하루 8시간을 넘기면 어떻게 되나요?',
    a: ['야간 가산(50%)과 연장 가산(50%)이 겹쳐서 붙어요. 그 시간은 기본 시급 100%에 50% + 50%를 더해 200%가 돼요.'],
  },
  {
    q: '"상시 5인 이상"은 어떻게 세나요?',
    a: ['일정 기간 동안 사용한 근로자 연인원을 가동 일수로 나눈 평균이에요. 알바·단시간 근로자도 포함되고, 사업주 본인과 가족만 일하는 경우 등은 제외돼요. 정확한 판단이 필요하면 고용노동부(1350)에 문의해보세요.'],
  },
  {
    q: '밤샘 근무 중 휴게시간은 야간근로에서 빠지나요?',
    a: ['휴게시간은 근로시간이 아니라서 빠져요. 이 계산기는 휴게시간이 언제였는지 모르므로 주간·야간 근무 비율대로 나눠 빼요. 휴게를 언제 했는지 알면 그 시간대 기준으로 다시 따져보세요.'],
  },
];

const DEFAULT = { wage: String(CURRENT_MIN_WAGE), start: '22:00', end: '06:00', breakMin: '60', days: '3', workplace: 'over5' };

function NightCalculator() {
  const [s, setS] = useStoredState('juhyu-night-v1', DEFAULT);
  const set = (p) => setS((x) => ({ ...x, ...p }));
  const wage = num(s.wage);
  const days = Math.min(7, Math.max(0, Math.round(num(s.days))));
  const shift = analyzeShift(s);
  const dayH = shift.paidMin / 60;
  const nightH = shift.nightMin / 60;
  const dailyOver = Math.max(0, dayH - 8);
  const weekH = dayH * days;
  const weeklyOver = Math.max(0, weekH - 40 - dailyOver * days);
  const applies = s.workplace === 'over5';

  const base = wage * weekH;
  const nightAdd = wage * nightH * days * 0.5;
  const overAdd = wage * (dailyOver * days + weeklyOver) * 0.5;
  const total = base + (applies ? nightAdd + overAdd : 0);

  return (
    <div className="calc-grid" id="calc">
      <Card title="근무 정보" step="1">
        <Field label="시급" htmlFor="n-wage"><MoneyInput id="n-wage" value={s.wage} onChange={(v) => set({ wage: v })} /></Field>
        <div className="grid-2">
          <Field label="출근" htmlFor="n-s"><input id="n-s" className="input" type="time" value={s.start} onChange={(e) => set({ start: e.target.value })} /></Field>
          <Field label="퇴근" htmlFor="n-e"><input id="n-e" className="input" type="time" value={s.end} onChange={(e) => set({ end: e.target.value })} /></Field>
        </div>
        <div className="grid-2">
          <Field label="휴게시간" htmlFor="n-b"><MoneyInput id="n-b" value={s.breakMin} onChange={(v) => set({ breakMin: v })} suffix="분" small /></Field>
          <Field label="주 근무일" htmlFor="n-d"><MoneyInput id="n-d" value={s.days} onChange={(v) => set({ days: v })} suffix="일" small /></Field>
        </div>
        <Field label="사업장 상시 근로자 수">
          <Segmented label="사업장 규모" options={[{ value: 'over5', label: '5인 이상' }, { value: 'under5', label: '5인 미만' }]} value={s.workplace} onChange={(v) => set({ workplace: v })} />
        </Field>
        <PrivacyNote />
      </Card>
      <div className="sticky-col">
        <Card title="야간·연장 가산 결과" step="2">
          <div className="result-label">한 주 예상 (주휴수당 제외, 세전)</div>
          <div className="result-big num">{fmt(total)}<span className="unit">원</span></div>
          <div className="result-sub">
            <span>하루 근로 <b className="num">{h(dayH)}시간</b></span>
            <span>그중 야간 <b className="num">{h(nightH)}시간</b></span>
            {dailyOver > 0 && <span>하루 연장 <b className="num">{h(dailyOver)}시간</b></span>}
          </div>
          {!applies && <Notice level="info">5인 미만 사업장은 야간·연장 가산이 법으로 정해져 있지 않아 합계에 넣지 않았어요. 5인 이상이라면 아래 가산분을 더 받을 수 있어요.</Notice>}
          <div className="items">
            <div className="deduct-row"><span>기본급 ({h(weekH)}시간)</span><span className="num">{fmt(base)}원</span></div>
            <div className="deduct-row"><span>야간 가산 ({h(nightH * days)}시간 × 50%)</span><span className="num">{applies ? '' : '(미적용) '}{fmt(nightAdd)}원</span></div>
            <div className="deduct-row"><span>연장 가산 ({h(dailyOver * days + weeklyOver)}시간 × 50%)</span><span className="num">{applies ? '' : '(미적용) '}{fmt(overAdd)}원</span></div>
            <div className="total-row"><span>한 주 합계</span><span className="num">{fmt(total)}원</span></div>
          </div>
          {shift.valid && shift.breakMin < (shift.paidMin >= 480 ? 60 : shift.paidMin >= 240 ? 30 : 0) && (
            <Notice level="warn">근로시간 대비 휴게시간이 법정 기준(4시간 30분, 8시간 1시간)보다 짧아요.</Notice>
          )}
          <Basis basis={LAW.premium} />
          <Basis basis={LAW.small} />
          <p className="fineprint">주휴수당은 <a href="/calculator/">급여 계산기</a>에서 함께 계산돼요. {DISCLAIMER}</p>
        </Card>
      </div>
    </div>
  );
}

export default function NightWorkPayPage() {
  return (
    <div className="wrap">
      <PageHead
        pageKey="night"
        eyebrow="야간·연장근로"
        title="야간수당 계산기"
        lead="출퇴근 시간만 넣으면 밤 10시~새벽 6시 야간근로 시간과 가산수당, 하루 8시간을 넘긴 연장근로 가산을 계산해요."
      />
      <NightCalculator />
      <Examples
        items={[
          {
            title: '편의점 야간 22:00~06:00, 휴게 1시간, 5인 이상',
            lines: [
              ['근로시간: 8시간 − 1시간', '7시간 (모두 야간)'],
              ['기본급: 10,320원 × 7시간', '72,240원'],
              ['야간 가산: 10,320원 × 7시간 × 50%', '36,120원'],
              ['하루 합계', '108,360원'],
            ],
          },
          {
            title: 'PC방 18:00~03:00, 휴게 1시간, 5인 이상',
            lines: [
              ['근로시간: 9시간 − 1시간', '8시간'],
              ['야간시간: 22~03시 5시간 × (8/9)', '약 4.44시간'],
              ['야간 가산: 10,320원 × 4.44 × 50%', '약 22,933원'],
            ],
            note: '휴게시간을 언제 썼는지에 따라 야간시간이 조금 달라질 수 있어요.',
          },
        ]}
      />
      <Section title="가산수당 한눈에 보기">
        <table className="table">
          <thead><tr><th>구분</th><th>기준</th><th className="r">가산</th></tr></thead>
          <tbody>
            <tr><td>야간근로</td><td>밤 10시~새벽 6시</td><td className="r">+50%</td></tr>
            <tr><td>연장근로</td><td>하루 8시간·주 40시간 초과</td><td className="r">+50%</td></tr>
            <tr><td>휴일근로</td><td>8시간 이내 / 초과</td><td className="r">+50% / +100%</td></tr>
            <tr><td>단시간 근로자 초과근로</td><td>계약한 소정근로시간 초과</td><td className="r">+50%</td></tr>
          </tbody>
        </table>
        <Prose>
          <p style={{ marginTop: 12 }}>모두 상시 5인 이상 사업장 기준이고, 겹치면 가산이 더해져요.</p>
          <Basis basis={LAW.premium} />
          <Basis basis={LAW.partTimeOver} />
        </Prose>
      </Section>
      <Faq items={faq} />
      <Related keys={['calculator', 'paycheckCheck', 'weekly', 'hourly']} />
    </div>
  );
}
