import React from 'react';
import { useStoredState } from '../lib/storage.js';
import { CURRENT_YEAR, CURRENT_MIN_WAGE, NEXT_MIN_WAGE } from '../lib/legal.js';
import { fmt } from '../lib/pay.js';

export const CHECK_ITEMS = [
  { id: 'hours', t: '실제 근무시간과 급여명세서의 근무시간이 같은가요?', d: '출퇴근 기록, 근무표 사진, 메신저 대화로 날짜별 시간을 맞춰보세요.' },
  { id: 'break', t: '휴게시간이 실제로 쉰 만큼만 빠졌나요?', d: '휴게시간은 무급이에요. 쉬지 못했는데 휴게시간으로 빠졌다면 근무시간이에요.' },
  { id: 'juhyu', t: '주휴수당 조건을 확인했나요?', d: '주 15시간 이상 + 정해진 근무일 개근이면 주마다 하루치 임금이 추가돼요.' },
  { id: 'night', t: '밤 10시~새벽 6시 근무가 있었다면 반영됐나요?', d: '상시 5인 이상 사업장이면 그 시간에 시급의 50%가 더 붙어요.' },
  { id: 'overtime', t: '하루 8시간·주 40시간을 넘긴 근무가 있었나요?', d: '5인 이상 사업장이면 넘긴 시간에 50% 가산이 붙어요. 단시간 근로자는 계약시간 초과분도 해당될 수 있어요.' },
  { id: 'deduct', t: '어떤 공제 항목이 얼마나 빠졌는지 알고 있나요?', d: '3.3%(사업소득), 4대보험, 소득세, 기타 공제(유니폼·식비 등)를 구분해서 확인하세요.' },
  { id: 'deposit', t: '실제 입금액과 명세서의 실지급액이 같은가요?', d: '통장 입금 내역과 명세서의 실지급액을 비교해보세요.' },
  { id: 'wage', t: '시급이 올해 최저임금 이상인가요?', d: `${CURRENT_YEAR}년 최저임금은 시간당 ${fmt(CURRENT_MIN_WAGE)}원, ${CURRENT_YEAR + 1}년은 ${fmt(NEXT_MIN_WAGE)}원이에요.` },
  { id: 'payslip', t: '급여명세서를 받았나요?', d: '사업주는 임금 지급 시 항목과 계산 방법이 적힌 임금명세서를 줘야 해요.' },
];

export default function Checklist({ compact = false }) {
  const [checked, setChecked] = useStoredState('juhyu-checklist-v1', {});
  const items = compact ? CHECK_ITEMS.slice(0, 7) : CHECK_ITEMS;
  const done = items.filter((i) => checked[i.id]).length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <div>
      <div className="field-label" style={{ marginBottom: 4 }}>
        <span>{done}/{items.length} 확인</span>
        {done > 0 && <button type="button" className="link-btn" onClick={() => setChecked({})}>초기화</button>}
      </div>
      <div className="progress" aria-hidden><span style={{ width: `${pct}%` }} /></div>
      <div className="checklist">
        {items.map((i) => (
          <button
            key={i.id}
            type="button"
            role="checkbox"
            aria-checked={!!checked[i.id]}
            className="check"
            onClick={() => setChecked((s) => ({ ...s, [i.id]: !s[i.id] }))}
          >
            <span className="box" aria-hidden>{checked[i.id] ? '✓' : ''}</span>
            <span>
              <span className="t">{i.t}</span>
              <span className="d">{i.d}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="fineprint">체크 상태는 이 브라우저에만 저장돼요.</p>
    </div>
  );
}
