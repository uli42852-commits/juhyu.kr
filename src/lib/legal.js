/* 법정 기준값 — 계산에 쓰는 모든 숫자는 여기서만 관리한다.
   값을 바꿀 때는 checkedAt(확인일)과 source(출처)도 같이 갱신할 것. */

export const MIN_WAGE = {
  2025: 10030,
  2026: 10320,
  2027: 10700,
};

export const MIN_WAGE_SOURCE = {
  label: '고용노동부 최저임금 고시',
  url: 'https://www.moel.go.kr/info/lawinfo/instruction/view.do?bbs_seq=20260700602',
  checkedAt: '2026-09-30',
  note: '2026년 10,320원(2025. 8. 고시), 2027년 10,700원(2026. 8. 고시, 2027. 1. 1. 시행)',
};

export function minWageFor(year) {
  if (MIN_WAGE[year]) return MIN_WAGE[year];
  const years = Object.keys(MIN_WAGE).map(Number).sort((a, b) => a - b);
  return year < years[0] ? MIN_WAGE[years[0]] : MIN_WAGE[years[years.length - 1]];
}

export const CURRENT_YEAR = 2026;
export const CURRENT_MIN_WAGE = MIN_WAGE[CURRENT_YEAR];
export const NEXT_MIN_WAGE = MIN_WAGE[CURRENT_YEAR + 1];

/* 4대보험 근로자 부담분 (2026년) */
export const INSURANCE_2026 = {
  pension: 0.0475, // 국민연금 9.5%의 절반
  health: 0.03595, // 건강보험 7.19%의 절반
  longTermCareOfHealth: 0.1314, // 장기요양 = 건강보험료 × 13.14%
  employment: 0.009, // 고용보험 실업급여 근로자 부담
};

export const INSURANCE_SOURCE = {
  label: '국민건강보험공단·국민연금공단 2026년 보험료율 안내, 4대사회보험 정보연계센터',
  url: 'https://www.4insure.or.kr/pbiz/ntcn/inscSmlCalcView.do',
  checkedAt: '2026-09-30',
};

/* 3.3% = 사업소득 원천징수 3% + 지방소득세 0.3% */
export const BUSINESS_INCOME_TAX = 0.033;

/* 법 조문 — 설명에 출처로 붙인다. */
export const LAW = {
  juhyu: { label: '근로기준법 제55조, 같은 법 시행령 제30조', url: 'https://www.law.go.kr/법령/근로기준법' },
  shortTime: { label: '근로기준법 제18조 제3항 (초단시간 근로자)', url: 'https://www.law.go.kr/법령/근로기준법' },
  premium: { label: '근로기준법 제56조 (연장·야간·휴일 근로)', url: 'https://www.law.go.kr/법령/근로기준법' },
  partTimeOver: { label: '기간제 및 단시간근로자 보호 등에 관한 법률 제6조', url: 'https://www.law.go.kr/법령/기간제및단시간근로자보호등에관한법률' },
  small: { label: '근로기준법 시행령 제7조 [별표 1] (5인 미만 사업장 적용 범위)', url: 'https://www.law.go.kr/법령/근로기준법시행령' },
  breakTime: { label: '근로기준법 제54조 (휴게)', url: 'https://www.law.go.kr/법령/근로기준법' },
  payslip: { label: '근로기준법 제48조 제2항 (임금명세서 교부)', url: 'https://www.law.go.kr/법령/근로기준법' },
  minWage: { label: '최저임금법 제6조', url: 'https://www.law.go.kr/법령/최저임금법' },
  severance: { label: '근로자퇴직급여 보장법 제4조, 제8조', url: 'https://www.law.go.kr/법령/근로자퇴직급여보장법' },
};

export const DISCLAIMER = '개별 근로계약 및 근무 형태에 따라 달라질 수 있습니다. 이 결과는 참고용이며 법률·노무 자문이 아닙니다.';
export const HELP_LINE = '고용노동부 고객상담센터 국번없이 1350';
