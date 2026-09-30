/* 급여명세서 텍스트 → 항목별 금액.
   명세서 양식이 사업장마다 달라서 "키워드 + 같은 줄의 숫자" 방식으로만 읽는다.
   (향후 OCR 결과 텍스트도 같은 함수로 처리할 수 있게 입력은 순수 텍스트로 둔다) */
import { num, calcDeductions } from './pay.js';

export const PAYSLIP_FIELDS = [
  { key: 'hours', label: '근무시간', unit: '시간', group: 'info' },
  { key: 'wage', label: '시급', unit: '원', group: 'info' },
  { key: 'base', label: '기본급', unit: '원', group: 'pay' },
  { key: 'juhyu', label: '주휴수당', unit: '원', group: 'pay' },
  { key: 'night', label: '야간수당', unit: '원', group: 'pay' },
  { key: 'overtime', label: '연장근로수당', unit: '원', group: 'pay' },
  { key: 'holiday', label: '휴일근로수당', unit: '원', group: 'pay' },
  { key: 'otherPay', label: '기타 수당', unit: '원', group: 'pay' },
  { key: 'grossTotal', label: '지급 합계(세전)', unit: '원', group: 'total' },
  { key: 'pension', label: '국민연금', unit: '원', group: 'deduct' },
  { key: 'health', label: '건강보험', unit: '원', group: 'deduct' },
  { key: 'ltc', label: '장기요양보험', unit: '원', group: 'deduct' },
  { key: 'employment', label: '고용보험', unit: '원', group: 'deduct' },
  { key: 'incomeTax', label: '소득세', unit: '원', group: 'deduct' },
  { key: 'localTax', label: '지방소득세', unit: '원', group: 'deduct' },
  { key: 'otherDeduct', label: '기타 공제', unit: '원', group: 'deduct' },
  { key: 'deductTotal', label: '공제 합계', unit: '원', group: 'total' },
  { key: 'net', label: '실지급액', unit: '원', group: 'total' },
];

// 위에서부터 먼저 맞는 규칙을 쓴다 (더 구체적인 키워드를 위에).
const RULES = [
  ['deductTotal', /공제\s*(합계|총액|계|액\s*계)/],
  ['grossTotal', /(지급\s*(합계|총액|액\s*계|계)|총\s*지급|급여\s*총액|세전)/],
  ['net', /(실\s*지급|실\s*수령|차인\s*지급|입금\s*액|실\s*급여)/],
  ['localTax', /(지방\s*소득세|주민세)/],
  ['incomeTax', /(소득세|사업소득|원천징수)/],
  ['ltc', /(장기\s*요양|요양\s*보험)/],
  ['pension', /국민\s*연금/],
  ['health', /건강\s*보험/],
  ['employment', /고용\s*보험/],
  ['otherDeduct', /(기타\s*공제|가불|공제)/],
  ['juhyu', /주휴/],
  ['night', /야간/],
  ['overtime', /(연장|초과)/],
  ['holiday', /휴일/],
  ['hours', /(근로\s*시간|근무\s*시간|총\s*시간)/],
  ['wage', /시\s*급/],
  ['base', /(기본\s*급|기본\s*임금|근무\s*수당|기본\s*수당)/],
  ['otherPay', /(수당|상여|식대|인센티브|보너스)/],
];

export function parsePayslip(text) {
  const out = {};
  const src = String(text || '');
  // "라벨 … 숫자" 쌍으로 자른다. 한 줄에 여러 항목이 있어도 각각 읽힌다.
  const re = /(-?\d[\d,]*(?:\.\d+)?)\s*(원|시간|h)?/g;
  let prevEnd = 0; let m;
  while ((m = re.exec(src)) !== null) {
    const label = src.slice(prevEnd, m.index).split(/\n/).pop().replace(/[:：=\-]/g, ' ').trim();
    prevEnd = m.index + m[0].length;
    if (!label || !/[가-힣]/.test(label)) continue;
    const rule = RULES.find(([, r]) => r.test(label));
    if (!rule) continue;
    const key = rule[0];
    const value = num(m[1]);
    if (!value) continue;
    if ((key === 'otherPay' || key === 'otherDeduct') && out[key]) out[key] += value;
    else if (out[key] === undefined) out[key] = value;
  }
  return out;
}

/* 명세서 자체의 앞뒤가 맞는지 + 예상 계산과 비교 */
export function analyzePayslip(fields, result) {
  const v = (k) => num(fields[k]);
  const has = (k) => v(k) > 0;
  const findings = [];

  const payKeys = ['base', 'juhyu', 'night', 'overtime', 'holiday', 'otherPay'];
  const deductKeys = ['pension', 'health', 'ltc', 'employment', 'incomeTax', 'localTax', 'otherDeduct'];
  const paySum = payKeys.reduce((s, k) => s + v(k), 0);
  const deductSum = deductKeys.reduce((s, k) => s + v(k), 0);
  const gross = has('grossTotal') ? v('grossTotal') : paySum;
  const deductTotal = has('deductTotal') ? v('deductTotal') : deductSum;

  // 1) 명세서 내부 합계 검산
  if (has('grossTotal') && paySum > 0 && Math.abs(paySum - v('grossTotal')) > 10) {
    findings.push({ level: 'warn', title: '지급 항목 합계가 지급 합계와 달라요', text: `항목을 더하면 ${fmtWon(paySum)}인데 지급 합계는 ${fmtWon(v('grossTotal'))}이에요. 입력하지 않은 항목이 있는지, 명세서에 적힌 합계가 맞는지 확인해보세요.` });
  }
  if (has('deductTotal') && deductSum > 0 && Math.abs(deductSum - v('deductTotal')) > 10) {
    findings.push({ level: 'warn', title: '공제 항목 합계가 공제 합계와 달라요', text: `공제 항목을 더하면 ${fmtWon(deductSum)}인데 공제 합계는 ${fmtWon(v('deductTotal'))}이에요.` });
  }
  if (has('net') && gross > 0) {
    const calcNet = gross - deductTotal;
    if (Math.abs(calcNet - v('net')) > 10) {
      findings.push({ level: 'warn', title: '세전 − 공제 ≠ 실지급액', text: `${fmtWon(gross)} − ${fmtWon(deductTotal)} = ${fmtWon(calcNet)}인데 실지급액은 ${fmtWon(v('net'))}이에요. 차이 ${fmtWon(Math.abs(calcNet - v('net')))}의 이유를 확인해보세요.` });
    } else {
      findings.push({ level: 'ok', title: '세전 − 공제 = 실지급액 (일치)', text: '명세서의 지급·공제·실지급액 계산은 앞뒤가 맞아요.' });
    }
  }

  // 2) 시급 역산 → 최저임금 확인
  if (has('hours') && has('base') && result) {
    const implied = v('base') / v('hours');
    const ok = implied + 1 >= result.minWage;
    findings.push({
      level: ok ? 'ok' : 'warn',
      title: `기본급 ÷ 근무시간 = 시간당 ${fmtWon(Math.round(implied))}`,
      text: ok
        ? `${result.year}년 최저임금(${fmtWon(result.minWage)}) 이상이에요.`
        : `${result.year}년 최저임금(${fmtWon(result.minWage)})보다 낮게 계산돼요. 근무시간이 모두 반영됐는지, 주휴수당 등이 기본급에 섞여 있는지 확인해보세요.`,
    });
  }

  // 3) 3.3% 여부
  if (gross > 0 && (has('incomeTax') || has('deductTotal'))) {
    const t33 = calcDeductions(gross, 'tax33').reduce((s, d) => s + d.amount, 0);
    const taxPart = v('incomeTax') + v('localTax');
    if (Math.abs(taxPart - t33) <= 20 || (!has('pension') && Math.abs(deductTotal - t33) <= 20)) {
      findings.push({ level: 'info', title: '3.3%가 공제된 것으로 보여요', text: '사업소득(프리랜서)으로 처리된 경우예요. 출퇴근 시간과 업무 지시를 받으며 일했다면 실제로는 근로자일 수 있으니, 주휴수당 등 근로자 권리가 적용되는지 확인해보세요.' });
    }
  }

  // 4) 주휴수당 항목 없음
  if (result && !has('juhyu') && result.juhyuWeeks > 0) {
    findings.push({ level: 'info', title: '명세서에 주휴수당 항목이 없어요', text: `예상 계산에선 주휴수당 ${fmtWon(result.items.find((i) => i.key === 'juhyu').amount)}이 나와요. 기본급에 포함된 건지, 따로 지급되지 않은 건지 사업주에게 확인해보세요.` });
  }

  // 5) 예상값과 항목별 비교
  const rows = [];
  if (result) {
    const exp = Object.fromEntries(result.items.map((i) => [i.key, i.amount]));
    const pair = (label, actual, expected, note) => rows.push({ label, actual, expected, diff: expected - actual, note });
    if (has('base')) pair('기본급', v('base'), (exp.base || 0) + (exp.extra || 0));
    if (has('juhyu') || exp.juhyu) pair('주휴수당', v('juhyu'), exp.juhyu || 0);
    if (has('night') || exp.night) pair('야간수당', v('night'), exp.night || 0, result.workplace !== 'over5' ? '5인 이상 사업장만 가산' : '');
    if (has('overtime') || exp.overtime) pair('연장근로수당', v('overtime'), exp.overtime || 0, result.workplace !== 'over5' ? '5인 이상 사업장만 가산' : '');
    if (gross) pair('지급 합계(세전)', gross, result.gross);
    if (deductTotal) pair('공제 합계', deductTotal, result.deductTotal, result.deductTotal === 0 ? '예상 계산에서 공제 방식 선택 안 함' : '');
    if (has('net')) pair('실지급액', v('net'), result.net);
  }

  return { findings, rows, gross, deductTotal };
}

function fmtWon(n) { return `${Math.round(n).toLocaleString('ko-KR')}원`; }
