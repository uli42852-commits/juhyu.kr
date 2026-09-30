/* 사이트 전체 URL·메타데이터. 경로는 끝에 / 를 붙인 형태를 정식(canonical)으로 쓴다. */
export const SITE = {
  origin: 'https://juhyu.kr',
  name: '주휴계산기 JUHYU',
  brand: 'JUHYU',
  updated: '2026-09-30',
  contact: '', // 개인정보 문의 이메일 — 설정하면 개인정보처리방침에 노출된다
};

export const PAGES = {
  home: {
    path: '/',
    nav: '홈',
    icon: '🏠',
    title: '알바비 계산기 · 주휴수당 계산 — 알바비, 제대로 받고 있나요? | 주휴계산기 JUHYU',
    description: '시급과 근무시간만 넣으면 기본급·주휴수당·야간수당·실수령액까지 한 번에 계산하고, 실제로 받은 알바비와 비교해 무엇을 확인해야 하는지 알려드려요. 2026년 최저임금 10,320원 기준, 로그인 없이 무료.',
  },
  calculator: {
    path: '/calculator/',
    nav: '급여 계산기',
    icon: '🧮',
    short: '기본급·주휴·야간·공제까지 종합 계산',
    title: '알바 급여 계산기 — 기본급·주휴수당·야간수당·실수령액 한 번에 | JUHYU',
    description: '근무 요일과 출퇴근 시간만 입력하면 한 달·한 주 알바비를 항목별로 계산해요. 주휴수당, 야간·연장 가산, 3.3%·4대보험 공제 후 실수령액과 계산 근거까지 보여드려요.',
  },
  paycheckCheck: {
    path: '/paycheck-check/',
    nav: '급여 검증',
    icon: '🔍',
    short: '받은 돈이 맞는지 예상 금액과 비교',
    title: '알바비 제대로 받았는지 확인 — 내 급여 검증 | JUHYU',
    description: '통장에 들어온 알바비와 받아야 할 금액을 비교해요. 차이가 나면 금액이 주휴수당·야간수당·공제액 중 무엇과 비슷한지 짚어주고 확인할 항목을 알려드려요.',
  },
  paycheck: {
    path: '/paycheck/',
    nav: '급여명세서 확인',
    icon: '🧾',
    short: '명세서를 붙여넣고 항목별로 비교',
    title: '알바 급여명세서 확인 — 명세서 붙여넣고 항목별 비교 | JUHYU',
    description: '급여명세서 내용을 붙여넣거나 입력하면 기본급·주휴수당·야간수당·공제·실지급액을 읽어 예상 금액과 비교하고, 명세서 합계가 맞는지도 검산해요.',
  },
  monthly: {
    path: '/monthly-alba-pay/',
    nav: '이번 달 알바비',
    icon: '📅',
    short: '달력으로 이번 달 예상 수입 확인',
    title: '이번 달 알바비 얼마? — 월 예상 알바비 계산기 | JUHYU',
    description: '근무 스케줄을 넣으면 이번 달 달력 기준으로 근무시간·기본급·주휴수당·예상 총액을 계산해요. 쉬는 날과 추가 출근도 달력에서 바로 반영돼요.',
  },
  weekly: {
    path: '/weekly-holiday-pay/',
    nav: '주휴수당 계산기',
    icon: '🗓',
    short: '이번 주 주휴수당 받을 수 있는지 판정',
    title: '주휴수당 계산기 2026 — 조건·계산법·지급 판정 | 주휴계산기',
    description: '요일별 근무시간만 넣으면 주휴수당 지급 대상인지, 얼마를 받아야 하는지 바로 계산해요. 주 15시간·개근 조건, 계산 공식(시급×주 근무시간÷40×8), 투잡 합산까지.',
  },
  night: {
    path: '/night-work-pay/',
    nav: '야간수당 계산기',
    icon: '🌙',
    short: '밤 10시~새벽 6시 가산수당 계산',
    title: '야간수당 계산기 — 알바 야간근로·연장근로 가산수당 | JUHYU',
    description: '출퇴근 시간을 넣으면 밤 10시~새벽 6시 야간근로 시간과 50% 가산수당, 하루 8시간 초과 연장근로 가산을 계산해요. 5인 미만 사업장 적용 여부도 함께 안내해요.',
  },
  hourly: {
    path: '/hourly-wage/',
    nav: '시급 계산기',
    icon: '⏱',
    short: '시급 ↔ 일급·주급·월급 환산',
    title: '시급 계산기 — 시급을 일급·주급·월급으로, 월급을 시급으로 환산 | JUHYU',
    description: '시급과 근무시간으로 일급·주급(주휴 포함)·월급을 환산하고, 받은 월급을 시급으로 바꿔 최저임금 이상인지 확인해요.',
  },
  minimumWage: {
    path: '/minimum-wage/',
    nav: '최저임금',
    icon: '📈',
    short: '2026·2027 최저임금과 내 급여 비교',
    title: '2026 최저임금 10,320원 · 2027 최저임금 10,700원 — 내 급여 최저임금 확인 | JUHYU',
    description: '2026년 최저임금 시급 10,320원(월 2,156,880원), 2027년 10,700원. 받는 월급·주급·일급을 시급으로 환산해 최저임금 이상인지 바로 확인하세요.',
  },
  albaPay: {
    path: '/alba-pay/',
    nav: '알바비 확인법',
    icon: '✅',
    short: '월급날 확인할 것 체크리스트',
    title: '알바비 확인하는 법 — 월급날 체크리스트 5단계 | JUHYU',
    description: '알바비가 제대로 들어왔는지 확인하는 순서를 정리했어요. 근무시간 → 주휴수당 → 가산수당 → 공제 → 입금액까지, 체크리스트로 하나씩 확인하세요.',
  },
  severance: {
    path: '/severance-pay/',
    nav: '퇴직금 계산기',
    icon: '💼',
    short: '1년 이상 일했다면 예상 퇴직금',
    title: '알바 퇴직금 계산기 — 1년 이상·주 15시간 조건 확인 | JUHYU',
    description: '입사일·퇴사일과 최근 3개월 급여로 알바 퇴직금을 계산해요. 1년 이상, 주 평균 15시간 이상 근무 조건도 함께 확인하세요.',
  },
  guide: {
    path: '/guide/',
    nav: '알바 급여 가이드',
    icon: '📚',
    short: '주휴수당·급여명세서·신고 방법 Q&A',
    title: '알바 급여 가이드 — 주휴수당 조건부터 신고 방법까지 Q&A | JUHYU',
    description: '주휴수당 조건, 결근·지각, 3.3% 공제, 급여명세서 보는 법, 임금체불 신고까지 알바생·사장님이 자주 묻는 질문을 정리했어요.',
  },
  privacy: {
    path: '/privacy/',
    nav: '개인정보처리방침',
    title: '개인정보처리방침 | 주휴계산기 JUHYU',
    description: '주휴계산기(juhyu.kr)는 회원가입 없이 이용하며 입력한 급여 정보를 서버에 저장하지 않습니다.',
  },
};

export const TOOL_NAV = ['calculator', 'paycheckCheck', 'paycheck', 'monthly', 'weekly', 'night', 'hourly', 'minimumWage', 'albaPay', 'severance', 'guide'];

export function pageByPath(pathname) {
  const p = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return Object.entries(PAGES).find(([, v]) => v.path === p) || null;
}
