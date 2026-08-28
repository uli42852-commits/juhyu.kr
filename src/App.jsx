import React, { useState, useEffect } from 'react';

/* ── design tokens ──────────────────────────────────────────
   컨셉: 급여 영수증. 알바생이 실제로 받는 급여명세서·무통장입금
   문자, 그걸 형광펜으로 밑줄 그어 사장님한테 들이미는 장면에서 출발.
   서체: 나눔고딕코딩(한글 모노스페이스, 영수증 프린터 느낌) + 노토산스(본문 가독성)
──────────────────────────────────────────────────────────── */
const C = {
  desk: '#dde2dd',
  paper: '#fdfdfa',
  ink: '#16181b',
  inkSoft: '#5c6158',
  inkFaint: '#9aa098',
  line: 'rgba(22,24,27,0.16)',
  lineStrong: 'rgba(22,24,27,0.34)',
  marker: '#eef23c',
  approve: '#0f6b3a',
  deny: '#a3231b',
};

const MIN_WAGE_2026 = 10320;
const DAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
const STORAGE_KEY = 'juhyu-calc-v1';

function won(n) {
  return Math.round(n).toLocaleString('ko-KR') + '원';
}

// 공유하기: 모바일 네이티브 공유창(카카오톡 포함)이 있으면 그걸 쓰고, 없으면 클립보드 복사
async function shareText(title, text, onCopied) {
  const shareData = { title, text, url: 'https://juhyu.kr' };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
  } catch (e) { /* 사용자가 공유 취소한 경우 등 — 무시 */ }
  try {
    await navigator.clipboard.writeText(`${text}\nhttps://juhyu.kr`);
    if (onCopied) onCopied();
  } catch (e) { /* clipboard 접근 실패 — 무시 */ }
}

/* ── 공부방 글 ───────────────────────────────────────────── */
const ARTICLES = [
  {
    t: '주휴수당이란? 지급 조건 3가지',
    cat: 'worker',
    p: [
      '주휴수당은 근로기준법 제55조에 따라, 일주일 동안 정해진 근무일을 모두 채운(개근한) 근로자에게 하루치 임금을 유급으로 추가 지급하는 제도입니다. 실제로 일하지 않아도 돈을 받는 하루라는 뜻에서 "유급 주휴일"이라고 불러요.',
      '지급 조건은 세 가지로 정리됩니다. 첫째, 일주일 소정근로시간(근로계약서에 정한 근무시간)이 15시간 이상이어야 합니다. 둘째, 그 주에 정해진 근무일을 하루도 빠짐없이 출근해야 합니다(개근). 셋째, 다음 주에도 근로관계가 계속돼야 합니다(퇴사 확정 주 등 예외가 있어요).',
      '이 세 조건을 모두 충족하면 정규직이든 아르바이트든, 사업장 규모가 5인 미만이든 상관없이 주휴수당을 받을 권리가 있습니다. 사장님 재량이 아니라 법으로 정해진 의무예요.',
    ],
  },
  {
    t: '주휴수당 계산법 총정리 (공식+예시)',
    cat: 'worker',
    p: [
      '계산 공식은 "시급 × (주 소정근로시간 ÷ 40) × 8"입니다. 주 40시간 이상 일하는 근로자는 계산이 더 간단해서, 그냥 "시급 × 8"로 하루치 임금을 그대로 받아요.',
      '예를 들어 2026년 최저시급(10,320원)을 받으며 주 40시간(하루 8시간씩 5일) 일하는 경우, 주휴수당은 10,320원 × 8 = 82,560원입니다. 주 15시간만 일하는 경우라면 10,320원 × (15÷40) × 8 = 30,960원이 돼요.',
      '이 계산기 위쪽 계산기 탭에서 요일별 근무시간을 입력하면 소정근로시간과 주휴수당이 자동으로 계산됩니다. 매주 스케줄이 바뀌는 알바생이라면 주마다 다시 계산해보는 습관이 필요해요.',
    ],
  },
  {
    t: '알바생도 주휴수당 받을 수 있나요? (5인 미만 사업장 포함)',
    cat: 'worker',
    p: [
      '네, 받을 수 있습니다. 주휴수당은 근로기준법 제55조에 근거한 권리라서 정규직·계약직·아르바이트 같은 고용 형태와 무관하게 조건(주 15시간 이상 + 개근)만 충족하면 누구나 받을 수 있어요.',
      '흔히 "5인 미만 소규모 사업장은 주휴수당을 안 줘도 된다"고 오해하는 경우가 많은데, 이는 사실이 아닙니다. 주휴수당은 사업장 규모와 관계없이 모든 사업장에 적용되는 의무 조항이에요. (반면 연장·야간·휴일 가산수당 등 일부 조항은 5인 미만 사업장에 적용되지 않는 경우가 있어 이 부분과 혼동하는 경우가 많아요.)',
      '편의점, 카페, 음식점 등 사업장 크기와 무관하게 조건만 맞으면 사장님은 주휴수당을 지급할 의무가 있습니다.',
    ],
  },
  {
    t: '주휴수당 못 받았을 때 신고하는 법',
    cat: 'worker',
    p: [
      '주휴수당을 못 받았다면 이는 임금체불에 해당합니다. 우선 사업주에게 직접 요청해 미지급 사실을 알리고 지급을 요청하는 것이 첫 단계입니다.',
      '요청해도 지급되지 않으면 고용노동부에 진정을 제기할 수 있습니다. 고용노동부 대표번호 1350으로 상담하거나, 고용노동부 홈페이지·고용노동부 민원마당을 통해 온라인으로 임금체불 진정서를 접수할 수 있어요.',
      '신고할 때는 근로계약서, 출퇴근 기록(타임카드, 메신저 대화, 출근 사진 등), 급여명세서나 통장 입금 내역 같은 증빙자료를 미리 챙겨두는 것이 중요합니다. 최저임금에 미달하는 임금을 지급한 경우 사업주는 3년 이하의 징역 또는 2천만원 이하의 벌금에 처해질 수 있습니다.',
    ],
  },
  {
    t: '초단시간 근로자란? 주 15시간의 함정',
    cat: 'worker',
    p: [
      '근로기준법 제18조 3항에 따라, 4주 동안을 평균해 1주 소정근로시간이 15시간 미만인 근로자를 "초단시간 근로자"라고 부릅니다. 이 경우 주휴수당뿐 아니라 퇴직금, 연차유급휴가 규정도 적용되지 않아요.',
      '여기서 중요한 함정은, 기준이 "실제로 일한 시간"이 아니라 "근로계약서에 정한 소정근로시간"이라는 점입니다. 어느 주에 갑자기 일이 많아서 15시간을 넘겨 일했더라도, 원래 계약이 주 14시간이었다면 초단시간 근로자로 분류될 수 있어요.',
      '반대로 계약서상 주 15시간 이상으로 돼 있는데 사장님이 스케줄을 줄여서 실제로는 15시간 미만만 일하게 시키는 경우도 있습니다. 이런 경우는 계약 내용과 실제 근무가 다른 것이라 별도로 문제 삼을 수 있는 사안이니, 근로계약서 내용을 정확히 확인해두는 것이 중요해요.',
    ],
  },
  {
    t: '결근하면 주휴수당 못 받는다? 개근의 기준',
    cat: 'worker',
    p: [
      '주휴수당의 두 번째 조건인 "개근"은 그 주에 근로계약서상 정해진 근무일을 하루도 빠짐없이 출근했는지를 뜻합니다. 하루라도 결근하면 그 주의 주휴수당은 발생하지 않아요.',
      '다만 모든 결석이 다 "결근"으로 처리되는 것은 아닙니다. 연차유급휴가나 회사 사정으로 인한 휴업, 지각·조퇴는 일반적으로 개근 여부 판단에서 결근으로 보지 않는 경우가 많습니다. 반면 무단으로 출근하지 않은 날은 결근으로 처리돼 그 주 주휴수당이 사라질 수 있어요.',
      '지각이나 조퇴를 여러 번 했다고 해서 곧바로 결근으로 처리되지는 않지만, 사업장 취업규칙이나 실제 관행에 따라 다르게 적용될 수 있으니 애매하면 사업주와 미리 확인해두는 것이 안전합니다.',
    ],
  },
  {
    t: '2026년 최저임금과 주휴수당 — 얼마가 달라졌나',
    cat: 'worker',
    p: [
      '고용노동부가 결정한 2026년 최저임금은 시간당 10,320원으로, 2025년 대비 2.9% 올랐습니다. 최저임금은 매년 최저임금위원회(근로자위원·사용자위원·공익위원 각 9명, 총 27명)의 심의를 거쳐 결정돼요.',
      '최저시급이 오르면 주휴수당도 함께 늘어납니다. 예를 들어 주 40시간 근무자의 주휴수당은 2026년 기준 10,320원 × 8시간 = 82,560원으로, 전년보다 늘어난 금액이에요.',
      '최저임금은 매년 바뀌기 때문에, 작년 기준으로 계산해둔 금액을 그대로 쓰면 안 됩니다. 이 계산기는 2026년 최저임금 기준으로 기본값이 설정돼 있지만, 본인의 실제 계약 시급을 입력해서 계산하는 것이 정확해요.',
    ],
  },
  {
    t: '주휴수당 포함 월급 계산법 (209시간의 비밀)',
    cat: 'worker',
    p: [
      '최저임금은 시급으로 고시되지만, 월급으로 환산할 때는 보통 209시간을 곱합니다. 왜 209시간일까요? 주 40시간 근무자의 경우 한 주에 실제 일하는 40시간에 유급 주휴시간 8시간을 더하면 48시간이 되고, 이를 한 달(4.345주) 기준으로 환산하면 약 209시간이 나오기 때문이에요.',
      '즉 월급에는 이미 주휴수당이 포함돼 있는 경우가 많습니다. 2026년 최저임금 기준 월급은 10,320원 × 209시간 = 2,156,880원(세전)이에요.',
      '본인이 받는 임금에 주휴수당이 포함돼 있는지는 근로계약서의 급여 구성 항목으로 확인할 수 있습니다. 시급제로 근무일마다 급여를 받는 경우라면 주휴수당이 따로 계산돼 지급되는지 급여명세서를 통해 확인해보는 것이 좋아요.',
    ],
  },
  {
    t: '알바 그만둘 때 주휴수당은? 퇴사 주 정산',
    cat: 'worker',
    p: [
      '퇴사하는 마지막 주의 주휴수당을 받을 수 있는지는 조건에 따라 갈립니다. 핵심은 "퇴사 이후에도 근로관계가 계속되는가"인데, 이미 그만두기로 확정된 마지막 주는 이 조건을 충족하지 못해 주휴수당이 발생하지 않는다고 보는 경우가 일반적이에요.',
      '예를 들어 금요일까지 근무하고 퇴사하기로 했다면, 그 주에 개근했더라도 다음 주에 근로관계가 이어지지 않기 때문에 마지막 주 주휴수당은 지급되지 않는 것으로 보는 해석이 많습니다.',
      '반대로 퇴사일 이전 주들에 대해서는 조건(15시간 이상, 개근)을 충족했다면 정상적으로 주휴수당을 받을 수 있어요. 퇴사 시점의 정확한 정산 내역은 급여명세서로 꼭 확인하고, 의문이 있으면 사업주에게 명확히 물어보는 것이 좋습니다.',
    ],
  },
  {
    t: '사장님이 꼭 알아야 할 주휴수당 (고용주 관점)',
    cat: 'employer',
    p: [
      '주휴수당은 사업주 입장에서도 정확히 알아야 하는 의무 사항입니다. 주 15시간 이상 근무하는 근로자가 한 주를 개근했다면, 사업장 규모나 고용 형태와 무관하게 주휴수당을 지급해야 해요. 이를 지키지 않으면 임금체불로 신고당할 수 있습니다.',
      '일부 사업주들은 주휴수당 부담을 피하려고 일부러 근로시간을 주 15시간 미만으로 쪼개서 여러 명을 고용하는 경우가 있는데, 이런 스케줄 조정 자체가 위법은 아니지만 노동자와의 신뢰 문제, 잦은 인력 교체에 따른 비효율 등 부작용이 따를 수 있습니다.',
      '최저임금 미달 지급은 임금체불에 해당해 3년 이하의 징역 또는 2천만원 이하의 벌금에 처해질 수 있는 만큼, 급여 지급 전 주휴수당까지 포함해 최저임금 기준을 충족하는지 미리 확인하는 것이 안전합니다.',
    ],
  },
  {
    t: '청소년(미성년) 알바도 주휴수당 받나요?',
    cat: 'worker',
    p: [
      '네, 받을 수 있어요. 주휴수당 조건(주 15시간 이상 + 개근)은 성인과 미성년자 구분 없이 똑같이 적용돼요. 최저임금도 나이와 무관하게 성인과 동일하게 받아요.',
      '다만 18세 미만은 별도 보호 규정이 있어요. 하루 7시간, 주 35시간을 초과할 수 없고(합의 시 하루 1시간·주 5시간까지 연장 가능), 밤 10시~오전 6시 야간근로와 휴일근로는 원칙적으로 금지돼요. 이를 어기면 사장님은 2년 이하 징역 또는 2천만원 이하 벌금에 처해질 수 있어요.',
    ],
  },
  {
    t: '3.3% 떼는 알바도 주휴수당 받을 수 있나요?',
    cat: 'worker',
    p: [
      '급여에서 3.3%를 뗀다면 근로소득이 아니라 사업소득(프리랜서)으로 신고된 것일 가능성이 커요. 주휴수당은 근로기준법상 "근로자"에게 적용되는 권리라, 온전한 프리랜서 계약이라면 원칙적으로 대상이 아니에요.',
      '문제는 출퇴근 시간이 정해져 있고 사장님 지시를 받으며 일하는 사실상 근로자인데도 3.3%로 처리하는 경우예요. 이런 경우는 "위장 도급"으로 불법이고, 실질이 근로관계라면 주휴수당을 포함한 근로기준법상 권리를 주장할 수 있어요. 헷갈리면 실제 근무 형태부터 확인해보세요.',
    ],
  },
  {
    t: '알바 근로계약서 안 썼는데 주휴수당 받을 수 있나요?',
    cat: 'worker',
    p: [
      '네, 받을 수 있어요. 주휴수당은 근로계약서 작성 여부와 무관하게, 실제로 근로자로서 일했다는 사실(주 15시간 이상 + 개근)만 인정되면 발생하는 법정 권리예요.',
      '다만 근로계약서가 없으면 소정근로시간이나 근무 조건을 입증하기가 번거로워질 수 있어요. 출퇴근 기록, 급여 입금 내역, 근무 스케줄 메시지를 미리 챙겨두면 도움이 돼요. 참고로 근로계약서 미작성 자체도 사업주에게 500만원 이하 벌금이 부과될 수 있는 별도의 법 위반이에요.',
    ],
  },
  {
    t: '편의점 알바 주휴수당 계산 예시',
    cat: 'worker',
    p: [
      '편의점 알바는 짧은 시간대(4~6시간)로 여러 요일 나눠 일하는 경우가 많아요. 예를 들어 시급 10,320원에 주 4일, 하루 5시간씩(주 20시간) 일하고 개근했다면, 주휴수당은 10,320원 × (20÷40) × 8 = 41,280원이에요.',
      '야간(밤 10시 이후) 시간대에 일하면 통상임금의 50%를 더 얹는 야간수당이 별도로 발생할 수 있어요. 주휴수당과는 다른 항목이니 급여명세서에서 각각 나뉘어 계산됐는지 확인해보는 게 좋아요.',
    ],
  },
  {
    t: '카페 알바 주휴수당 계산 예시',
    cat: 'worker',
    p: [
      '카페 알바는 오픈·마감 교대로 하루 6~8시간씩 일하는 경우가 흔해요. 예를 들어 시급 10,320원에 주 3일, 하루 8시간씩(주 24시간) 일하고 개근했다면, 주휴수당은 10,320원 × (24÷40) × 8 = 49,536원이에요.',
      '시급 외에 매출 인센티브 같은 변동 수당이 있는 매장도 있는데, 이런 항목이 주휴수당 계산에 포함되는지는 사업장마다 달라 급여 규정을 따로 확인해보는 것이 좋아요.',
    ],
  },
  {
    t: '방학 단기알바도 주휴수당 받을 수 있나요?',
    cat: 'worker',
    p: [
      '네, 단기간이어도 그 주에 조건(15시간 이상 + 개근)을 충족하면 주휴수당이 발생해요. "단기"라는 이유만으로 대상에서 제외되지 않아요.',
      '다만 "다음 주에도 근로관계가 계속될 것"이라는 조건이 걸림돌이 될 수 있어요. 2주만 일하기로 확정돼 있다면, 마지막 주는 다음 주 근로관계가 없어 주휴수당이 발생하지 않는다고 보는 해석이 일반적이에요. 그 전 주까지는 조건을 채웠다면 정상적으로 받을 수 있어요.',
    ],
  },
  {
    t: '알바 잘렸을 때(해고) 주휴수당은?',
    cat: 'worker',
    p: [
      '해고를 당해도 그 전 주까지 조건(15시간 이상 + 개근)을 채웠다면 주휴수당은 그대로 받을 권리가 있어요. 해고 사유나 정당성과 별개로, 이미 발생한 주휴수당은 임금이라 반드시 지급돼야 해요.',
      '정당한 사유 없이 갑자기 해고당했다면 주휴수당 문제와는 별도로 "부당해고"로 다툴 수도 있어요. 이 경우 노동위원회에 구제 신청을 하는 절차가 따로 있어, 임금체불(주휴수당 미지급)과 부당해고는 각각 다른 절차로 대응해야 한다는 점을 알아두면 좋아요.',
    ],
  },
  {
    t: '알바 급여명세서 보는 법',
    cat: 'worker',
    p: [
      '2021년부터 사업주는 근로자에게 급여명세서를 교부할 의무가 있어요(위반 시 과태료). 명세서에는 기본급, 각종 수당(주휴수당·야간수당·연장수당 등), 공제 항목(세금, 4대보험료)이 항목별로 나뉘어 표시돼야 해요.',
      '명세서에 "주휴수당" 항목이 따로 없다면, 기본급에 이미 포함된 건지 아예 지급되지 않은 건지 확인이 필요해요. 애매하면 사업주에게 직접 물어보거나, 이 계산기로 본인이 받아야 할 금액을 먼저 계산해서 비교해보는 것도 방법이에요.',
    ],
  },
  {
    t: '주 3일 알바도 주휴수당 받나요? (요일 수보다 시간이 기준)',
    cat: 'worker',
    p: [
      '받을 수 있어요. 주휴수당 조건은 "며칠을 일했는가"가 아니라 "일주일 총 소정근로시간이 15시간을 넘는가"예요. 요일 수는 상관없어요.',
      '예를 들어 주 3일, 하루 6시간씩 일하면 주 18시간으로 조건을 충족해요. 반대로 주 6일을 나가더라도 하루 2시간씩만 일한다면 총 12시간이라 조건 미달일 수 있어요. 요일 수가 아니라 총 근무시간을 기준으로 계산하는 습관이 필요해요.',
    ],
  },
  {
    t: '지각·조퇴해도 주휴수당 받을 수 있나요?',
    cat: 'worker',
    p: [
      '대부분의 경우 받을 수 있어요. "개근"의 기준은 근무일에 출근했는지 여부이지, 정시에 출근해 정시에 퇴근했는지가 아니에요. 지각이나 조퇴는 일반적으로 결근으로 처리되지 않아요.',
      '다만 지나치게 잦은 지각·조퇴는 사업장 취업규칙에 따라 다르게 취급될 수 있고, 극단적인 경우(출근은 했지만 몇 분 만에 퇴근하는 식)는 실질적으로 근무를 하지 않은 것으로 볼 여지도 있어요. 애매한 경우는 사업주와 미리 확인해두는 것이 안전해요.',
    ],
  },
  {
    t: '이번 주 하루만 결근해도 주휴수당이 통째로 날아가요',
    cat: 'worker',
    p: [
      '주휴수당은 "다 받거나, 아예 못 받거나" 둘 중 하나예요. 주 40시간을 채워도 단 하루만 결근하면 그 주 주휴수당 전액이 사라져요. 시급 10,320원에 주 40시간 일하는 알바생이라면, 결근 하루로 82,560원을 통째로 못 받게 되는 셈이에요.',
      '지각·조퇴는 대부분 괜찮지만, "결근"으로 처리되는 순간 그 주는 0원이라는 걸 알아두면 스케줄 관리에 도움이 돼요. 몸이 안 좋으면 무단결근 대신 미리 연락해서 조정하는 게 손해를 줄이는 방법이에요.',
    ],
  },
  {
    t: '주 14시간 알바, 딱 1시간 차이로 주휴수당을 못 받아요',
    cat: 'worker',
    p: [
      '주휴수당 조건은 "주 15시간 이상"이에요. 주 14시간과 주 15시간, 겨우 1시간 차이인데 결과는 완전히 달라요. 14시간이면 주휴수당이 0원이고, 15시간을 채우는 순간 갑자기 발생해요.',
      '예를 들어 하루 3시간씩 주 5일(15시간) 일하면 주휴수당이 발생하지만, 하루 2.8시간씩(14시간)이면 발생하지 않아요. 스케줄을 짤 때 이 "15시간 문턱"을 넘는지 미리 계산해보는 게 좋아요.',
    ],
  },
  {
    t: '사장님이 주휴수당 빼먹으면 어떻게 되나요? 임금체불의 대가',
    cat: 'employer',
    p: [
      '주휴수당을 안 주는 건 실수로 넘길 일이 아니라 법 위반이에요. 최저임금에 미달하는 급여를 지급하면 사업주는 3년 이하의 징역 또는 2천만원 이하의 벌금에 처해질 수 있어요.',
      '사장님이 몰라서 안 준 경우도 많지만, 몰랐다는 게 면책 사유는 아니에요. 못 받은 게 확인되면 먼저 정중하게 요청하고, 그래도 안 주면 고용노동부(1350)에 신고하면 돼요. 신고했다는 이유로 불이익을 주는 것도 별도로 불법이에요.',
    ],
  },
  {
    t: '3개월 알바하면서 못 받은 주휴수당, 계산해보니 이 정도',
    cat: 'worker',
    p: [
      '주휴수당을 매주 놓치면 생각보다 금액이 커져요. 예를 들어 시급 10,320원에 주 20시간씩 일하는 알바생이 매주 주휴수당(약 41,280원)을 못 받았다면, 3개월(약 13주)이면 53만원 넘게 손해를 본 셈이에요.',
      '한 주 한 주는 작아 보여도 쌓이면 무시할 수 없는 금액이에요. 이 계산기로 본인의 스케줄 기준 주휴수당을 계산해보고, 실제 받은 급여와 비교해보는 걸 추천해요.',
    ],
  },
  {
    t: '알바 면접 때 이거 물어보면 주휴수당 손해 안 봐요',
    cat: 'worker',
    p: [
      '면접이나 근무 시작 전에 "주 스케줄이 몇 시간인지", "주휴수당은 어떻게 계산되는지" 미리 물어보면 나중에 분쟁을 줄일 수 있어요. 특히 주 15시간에 딱 걸치는 스케줄이라면 시간이 자주 바뀌는지도 확인해보는 게 좋아요.',
      '근로계약서에 소정근로시간이 명확히 적혀 있는지도 꼭 확인하세요. "그때그때 다르게"라고만 돼 있으면 나중에 주휴수당 계산 기준을 두고 다툼이 생길 수 있어요.',
    ],
  },
  {
    t: '알바 세금 환급받는 법 — 5월 종합소득세 신고 체크',
    cat: 'worker',
    p: [
      '알바로 번 돈에서 세금을 뗐다면, 정식 근로소득(4대보험 가입)인지 3.3% 사업소득인지에 따라 환급받는 절차가 달라져요. 근로소득자는 다음 해 초 회사가 진행하는 연말정산으로 대부분 자동 처리되고, 환급액이 있으면 2월 급여에 포함돼 들어와요.',
      '3.3% 사업소득으로 신고된 경우엔 연말정산이 아니라 다음 해 5월 종합소득세 신고를 직접(또는 홈택스로) 해야 환급 여부가 확인돼요. 소득이 적으면 냈던 세금 대부분을 돌려받는 경우가 많으니, 5월에 신고 자체를 잊지 않는 게 중요해요.',
    ],
  },
  {
    t: '알바도 4대보험 가입해야 하나요? — 주휴수당이랑 기준이 달라요',
    cat: 'worker',
    p: [
      '주휴수당은 "주 15시간"이 기준이지만, 4대보험(국민연금·건강보험)은 "월 60시간"이 핵심 기준이라 서로 달라요. 월 60시간 이상 일하면 국민연금·건강보험 가입 대상이 되고, 월 60시간 미만이어도 월 8일 이상 근무하거나 월소득 220만원 이상이면 가입 대상이 될 수 있어요.',
      '산재보험은 예외 없이 단 1시간을 일해도 무조건 가입 대상이에요. 고용보험은 월 60시간 미만이어도 3개월 이상 계속 근무하면 가입해야 해요. "짧게 일하니까 4대보험 안 들어도 된다"는 게 항상 맞는 말은 아니라는 점 기억해두세요.',
    ],
  },
  {
    t: '야간·연장근로수당이란? 주휴수당이랑 헷갈리지 마세요',
    cat: 'worker',
    p: [
      '주휴수당과 자주 헷갈리는 게 야간수당·연장근로수당이에요. 완전히 다른 개념이에요. 야간수당은 밤 10시~오전 6시 사이에 일한 시간에 대해 통상임금의 50%를 더 얹어주는 거고, 연장근로수당은 법정근로시간(하루 8시간·주 40시간)을 초과해 일한 시간에 대해 역시 50%를 더 얹어주는 거예요.',
      '다만 상시근로자 5인 미만 사업장은 이 가산수당 규정이 적용되지 않아요(주휴수당은 5인 미만도 적용되는 것과 다른 부분이에요). 본인이 일하는 곳이 5인 이상인지 먼저 확인하는 게 첫 단계예요.',
    ],
  },
  {
    t: '사장님이 급여명세서 쓸 때 자주 하는 실수 3가지',
    cat: 'employer',
    p: [
      '첫째, 주휴수당을 기본급에 뭉뚱그려 넣고 별도 항목으로 표시하지 않는 경우가 많아요. 2021년부터 급여명세서 교부가 의무화됐고, 항목별로 구분해서 적는 게 원칙이에요.',
      '둘째, 결근이 있었던 주에도 이전 스케줄 그대로 주휴수당을 계산해서 지급하거나, 반대로 15시간 넘겼는데 빼먹고 안 주는 실수도 흔해요. 셋째, 최저임금 인상 시점을 놓쳐서 예전 시급 기준으로 계속 계산하는 경우도 있어요. 매년 1월 1일 최저임금이 바뀐다는 걸 캘린더에 표시해두는 게 실수를 줄이는 방법이에요.',
    ],
  },
  {
    t: '사장님을 위한 주휴수당 체크리스트 — 이것만 확인하면 안 걸려요',
    cat: 'employer',
    p: [
      '매주 이것만 확인하면 돼요: ① 이번 주 소정근로시간이 15시간 이상인 알바생인가 ② 이번 주 결근 없이 개근했는가 ③ 다음 주에도 계속 근무하는가. 셋 다 "예"면 주휴수당 지급 대상이에요.',
      '급여명세서에는 주휴수당을 별도 항목으로 표시하고, 계산 근거(소정근로시간, 시급)도 함께 남겨두는 걸 추천해요. 나중에 노동청 신고나 분쟁이 생겼을 때 이 기록이 사업주를 보호해주는 증빙자료가 돼요.',
    ],
  },
];

/* ── 계산 로직 ───────────────────────────────────────────── */
function useJuhyuCalc(storageKey = STORAGE_KEY) {
  const [wage, setWage] = useState(String(MIN_WAGE_2026));
  const [hours, setHours] = useState(Array(7).fill(''));
  const [fullAttendance, setFullAttendance] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.wage) setWage(d.wage);
        if (d.hours) setHours(d.hours);
        if (typeof d.fullAttendance === 'boolean') setFullAttendance(d.fullAttendance);
      }
    } catch (e) { /* ignore */ }
  }, [storageKey]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ wage, hours, fullAttendance })); } catch (e) { /* ignore */ }
  }, [wage, hours, fullAttendance, storageKey]);

  const setDayHour = (i, v) => {
    const next = [...hours]; next[i] = v; setHours(next);
  };

  const wageNum = parseFloat(wage) || 0;
  const weeklyHours = hours.reduce((s, h) => s + (parseFloat(h) || 0), 0);
  const eligibleByHours = weeklyHours >= 15;
  const eligible = eligibleByHours && fullAttendance;
  const ratio = Math.min(weeklyHours, 40) / 40;
  const juhyuPay = eligible ? wageNum * ratio * 8 : 0;
  const basePay = wageNum * weeklyHours;
  const totalPay = basePay + juhyuPay;

  return {
    wage, setWage, hours, setDayHour, fullAttendance, setFullAttendance,
    wageNum, weeklyHours, eligibleByHours, eligible, juhyuPay, basePay, totalPay,
  };
}

const JOB2_STORAGE_KEY = 'juhyu-calc-job2-v1';

/* ── 재사용 UI 조각 ──────────────────────────────────────── */

// 영수증 톱니 절취선 (위/아래)
function TornEdge({ flip }) {
  return (
    <div
      aria-hidden
      style={{
        height: 11,
        width: '100%',
        backgroundColor: C.desk,
        backgroundImage: `linear-gradient(135deg, ${C.paper} 50%, transparent 50%), linear-gradient(45deg, transparent 50%, ${C.paper} 50%)`,
        backgroundSize: '16px 16px',
        backgroundPosition: flip ? '0 -8px, 8px -8px' : '0 8px, 8px 8px',
        backgroundRepeat: 'repeat-x',
        transform: flip ? 'rotate(180deg)' : 'none',
      }}
    />
  );
}

// 새해 최저임금 적용일까지 D-day 배너
function MinWageDday() {
  const today = new Date();
  const year = today.getFullYear();
  const jan1NextYear = new Date(year + 1, 0, 1);
  const isNewYearWindow = today.getMonth() === 0 && today.getDate() <= 14; // 1월 1~14일: 방금 바뀐 것 안내
  const dday = Math.ceil((jan1NextYear - today) / (1000 * 60 * 60 * 24));

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      background: 'rgba(240,162,2,0.08)', border: `1px dashed ${C.amberDeep || '#c97f00'}`,
      borderRadius: 8, padding: '9px 14px', marginBottom: 14,
    }}>
      <span style={{ fontSize: 11, color: C.inkSoft, lineHeight: 1.5 }}>
        {isNewYearWindow
          ? `📅 ${year}년 새 최저임금이 적용됐어요. 계산기 기본값을 확인하세요.`
          : `📅 ${year + 1}년 새 최저임금 적용까지`}
      </span>
      {!isNewYearWindow && (
        <span style={{ fontSize: 13, fontWeight: 800, color: '#c97f00', fontFamily: "'Nanum Gothic Coding', monospace", flexShrink: 0 }}>
          D-{dday}
        </span>
      )}
    </div>
  );
}

// 영수증 줄 항목: 라벨 ......... 값
function ReceiptRow({ label, value, strong, dim }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '5px 0' }}>
      <span style={{ fontSize: strong ? 13.5 : 12.5, color: dim ? C.inkFaint : C.ink, fontWeight: strong ? 700 : 500, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ flex: 1, borderBottom: `1px dotted ${C.lineStrong}`, transform: 'translateY(-3px)' }} />
      <span style={{ fontSize: strong ? 15 : 13, color: dim ? C.inkFaint : C.ink, fontWeight: strong ? 800 : 600, whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  );
}

// 형광펜 마커 강조
function Marker({ children, color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        aria-hidden
        style={{
          position: 'absolute', left: -6, right: -6, top: '18%', bottom: '10%',
          background: C.marker, mixBlendMode: 'multiply', transform: 'rotate(-0.6deg)', borderRadius: 2,
        }}
      />
      <span style={{ position: 'relative', color, fontWeight: 800 }}>{children}</span>
    </span>
  );
}

/* ── 계산기 ──────────────────────────────────────────────── */
const LOG_STORAGE_KEY = 'juhyu-receipt-log-v1';

function useReceiptLog() {
  const [log, setLog] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOG_STORAGE_KEY);
      if (raw) setLog(JSON.parse(raw));
    } catch (e) { /* ignore */ }
  }, []);

  const persist = (next) => {
    setLog(next);
    try { localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
  };

  const addEntry = (entry) => {
    const next = [{ id: Date.now(), date: new Date().toISOString(), ...entry }, ...log].slice(0, 52);
    persist(next);
  };

  const removeEntry = (id) => persist(log.filter((e) => e.id !== id));

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTotal = log
    .filter((e) => e.date.slice(0, 7) === thisMonth && e.eligible)
    .reduce((s, e) => s + e.juhyuPay, 0);

  return { log, addEntry, removeEntry, monthTotal };
}

function ReceiptLog({ log, removeEntry, monthTotal }) {
  const [open, setOpen] = useState(false);
  if (log.length === 0) return null;

  return (
    <div style={{ marginTop: 18 }}>
      <button onClick={() => setOpen((v) => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(22,24,27,0.03)', border: `1px solid ${C.line}`, borderRadius: 10,
        padding: '11px 14px', cursor: 'pointer',
      }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>
          🧾 영수증철 ({log.length}장)
        </span>
        <span style={{ fontSize: 11.5, color: C.approve, fontWeight: 700, fontFamily: "'Nanum Gothic Coding', monospace" }}>
          이번 달 {won(monthTotal)}
        </span>
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {log.map((e) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderBottom: `1px dashed ${C.line}`, fontFamily: "'Nanum Gothic Coding', monospace",
            }}>
              <span style={{ fontSize: 11, color: C.inkFaint, width: 68, flexShrink: 0 }}>
                {new Date(e.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
              </span>
              <span style={{
                fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 999, flexShrink: 0,
                background: e.eligible ? 'rgba(15,107,58,0.1)' : 'rgba(163,35,27,0.08)',
                color: e.eligible ? C.approve : C.deny,
              }}>
                {e.eligible ? '지급' : '미지급'}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, flex: 1 }}>
                {won(e.juhyuPay)}
              </span>
              <button
                onClick={() => removeEntry(e.id)}
                aria-label="삭제"
                style={{ background: 'transparent', border: 'none', color: C.inkFaint, fontSize: 14, cursor: 'pointer', padding: 4 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Calculator() {
  const {
    wage, setWage, hours, setDayHour, fullAttendance, setFullAttendance,
    wageNum, weeklyHours, eligibleByHours, eligible, juhyuPay, basePay, totalPay,
  } = useJuhyuCalc();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const { log, addEntry, removeEntry, monthTotal } = useReceiptLog();

  const fieldLabel = { fontSize: 11, color: C.inkSoft, fontWeight: 700, marginBottom: 7, letterSpacing: 0.3 };
  const monoInput = {
    width: '100%', background: 'transparent', border: 'none', borderBottom: `1.5px solid ${C.lineStrong}`,
    padding: '6px 2px', fontSize: 17, color: C.ink, fontWeight: 700,
    fontFamily: "'Nanum Gothic Coding', monospace", boxSizing: 'border-box',
  };

  const handleShare = () => {
    const summary = eligible
      ? `이번 주 주휴수당 ${won(juhyuPay)}! 소정근로 ${weeklyHours.toFixed(1)}h 기준 총 수령액 ${won(totalPay)}. 나도 계산해봤어요 →`
      : `내 주휴수당 계산해봤는데 이번 주는 지급 대상이 아니래요. 조건 확인해보세요 →`;
    shareText('주휴계산기', summary, () => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };

  const handleSaveEntry = () => {
    addEntry({ weeklyHours, eligible, juhyuPay, totalPay });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const [showMsg, setShowMsg] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);
  const todayStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  const employerMsg = `안녕하세요, 다름이 아니라 이번 주 근무 관련해서 확인차 연락드려요.\n\n제가 이번 주(${todayStr} 기준) 총 ${weeklyHours.toFixed(1)}시간 근무했고, 근로기준법상 주휴수당 조건(주 15시간 이상 + 개근)을 충족해서 주휴수당 ${won(juhyuPay)}이 포함된 급여를 받아야 할 것 같아 말씀드려요.\n\n확인 부탁드립니다. 감사합니다!`;

  const handleCopyMsg = async () => {
    try {
      await navigator.clipboard.writeText(employerMsg);
      setMsgCopied(true);
      setTimeout(() => setMsgCopied(false), 1800);
    } catch (e) { /* clipboard 접근 실패 — 무시 */ }
  };

  /* ── 투잡 계산기 (두 번째 알바 간단 합산) ── */
  const [job2On, setJob2On] = useState(false);
  const [wage2, setWage2] = useState(String(MIN_WAGE_2026));
  const [totalHours2, setTotalHours2] = useState('');
  const [fullAttendance2, setFullAttendance2] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(JOB2_STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.job2On === 'boolean') setJob2On(d.job2On);
        if (d.wage2) setWage2(d.wage2);
        if (d.totalHours2 !== undefined) setTotalHours2(d.totalHours2);
        if (typeof d.fullAttendance2 === 'boolean') setFullAttendance2(d.fullAttendance2);
      }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(JOB2_STORAGE_KEY, JSON.stringify({ job2On, wage2, totalHours2, fullAttendance2 })); } catch (e) { /* ignore */ }
  }, [job2On, wage2, totalHours2, fullAttendance2]);

  const wage2Num = parseFloat(wage2) || 0;
  const hours2Num = parseFloat(totalHours2) || 0;
  const eligible2 = hours2Num >= 15 && fullAttendance2;
  const ratio2 = Math.min(hours2Num, 40) / 40;
  const juhyuPay2 = eligible2 ? wage2Num * ratio2 * 8 : 0;
  const basePay2 = wage2Num * hours2Num;
  const totalPay2 = basePay2 + juhyuPay2;

  const combinedJuhyu = juhyuPay + (job2On ? juhyuPay2 : 0);
  const combinedTotal = totalPay + (job2On ? totalPay2 : 0);

  return (
    <div>
      {/* 발행일자 스타일 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.inkFaint, marginBottom: 14, fontFamily: "'Nanum Gothic Coding', monospace" }}>
        <span>NO. WEEKLY-REST-PAY</span>
        <span>2026 MIN.WAGE ￦10,320</span>
      </div>

      {/* 시급 입력 */}
      <div style={{ marginBottom: 18 }}>
        <div style={fieldLabel}>시급</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.inkSoft }}>￦</span>
          <input
            type="number" inputMode="numeric" value={wage} onChange={(e) => setWage(e.target.value)}
            placeholder="10320" style={monoInput}
          />
        </div>
        {wageNum > 0 && wageNum < MIN_WAGE_2026 && (
          <div style={{
            marginTop: 8, padding: '9px 12px', borderRadius: 8, background: 'rgba(163,35,27,0.06)',
            border: `1px solid ${C.deny}`,
          }}>
            <p style={{ fontSize: 11, lineHeight: 1.7, color: C.deny, margin: 0, fontWeight: 600 }}>
              ⚠ 2026년 최저시급(10,320원)보다 낮아요. 최저임금 미달은 사업주가 3년 이하 징역 또는 2천만원 이하 벌금에 처해질 수 있는 위법이에요.
            </p>
          </div>
        )}
      </div>

      {/* 요일별 근무시간 */}
      <div style={{ marginBottom: 16 }}>
        <div style={fieldLabel}>이번 주 근무시간</div>
        <div style={{ background: 'rgba(22,24,27,0.02)', border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 12px' }}>
          {DAYS.map((d, i) => (
            <div key={d} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: i < 6 ? '0 0 10px' : 0, marginBottom: i < 6 ? 10 : 0,
              borderBottom: i < 6 ? `1px dashed ${C.line}` : 'none',
            }}>
              <span style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 600, width: 44, flexShrink: 0 }}>{d}</span>
              <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'wrap' }}>
                {[0, 4, 6, 8].map((preset) => {
                  const on = hours[i] === String(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDayHour(i, on ? '' : String(preset))}
                      style={{
                        padding: '7px 0', width: 34, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        border: `1.5px solid ${on ? C.ink : C.lineStrong}`,
                        background: on ? C.ink : C.paper, color: on ? C.paper : C.inkSoft,
                        fontFamily: "'Nanum Gothic Coding', monospace",
                      }}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
              <input
                type="number" inputMode="decimal" min="0" step="0.5" value={hours[i]}
                onChange={(e) => setDayHour(i, e.target.value)}
                placeholder="직접"
                aria-label={`${d} 근무시간`}
                style={{
                  width: 56, minHeight: 38, textAlign: 'center', background: C.paper,
                  border: `1.5px solid ${C.lineStrong}`, borderRadius: 7,
                  fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: "'Nanum Gothic Coding', monospace",
                  boxSizing: 'border-box', flexShrink: 0,
                }}
              />
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10.5, color: C.inkFaint, margin: '6px 2px 0' }}>
          자주 쓰는 시간은 버튼으로 바로 찍고, 그 외 시간은 오른쪽 칸에 직접 입력하세요.
        </p>
      </div>

      {/* 개근 여부 */}
      <div style={{ marginBottom: 20 }}>
        <div style={fieldLabel}>이번 주 근무일, 하루도 안 빠지고 다 나갔나요?</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ v: true, t: '네, 개근했어요' }, { v: false, t: '아니요, 결근이 있었어요' }].map((o) => {
            const on = fullAttendance === o.v;
            return (
              <button key={o.t} onClick={() => setFullAttendance(o.v)} style={{
                flex: 1, padding: '11px 4px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${on ? C.ink : C.lineStrong}`,
                background: on ? C.ink : 'transparent', color: on ? C.paper : C.inkSoft,
              }}>
                {o.t}
              </button>
            );
          })}
        </div>
      </div>

      {/* 절취선 */}
      <div style={{ borderTop: `1.5px dashed ${C.lineStrong}`, margin: '4px 0 16px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: -20, top: -8, fontSize: 13, color: C.inkFaint }}>✂</span>
      </div>

      {/* 합계 영수증 */}
      <div style={{ fontFamily: "'Nanum Gothic Coding', monospace" }}>
        <ReceiptRow label="주 소정근로시간" value={`${weeklyHours.toFixed(1)} h`} dim />
        <ReceiptRow label="근무수당" value={won(basePay)} />
        <ReceiptRow label="주휴수당" value={won(juhyuPay)} />
        <div style={{ borderTop: `2px solid ${C.ink}`, marginTop: 8, paddingTop: 10 }}>
          <ReceiptRow label="합계 (세전)" value={won(totalPay)} strong />
        </div>
      </div>

      {/* 판정 */}
      <div style={{ textAlign: 'center', margin: '22px 0 6px' }}>
        <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 8, fontFamily: "'Nanum Gothic Coding', monospace" }}>
          — 주휴수당 지급 판정 —
        </div>
        <div style={{ fontSize: 20, fontFamily: "'Nanum Gothic Coding', monospace" }}>
          {eligible ? (
            <Marker color={C.approve}>이번 주는 지급 대상이에요</Marker>
          ) : (
            <Marker color={C.deny}>이번 주는 지급 대상이 아니에요</Marker>
          )}
        </div>
      </div>

      {!eligibleByHours && (
        <p style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.7, textAlign: 'center', margin: '10px 0 0' }}>
          주 소정근로시간이 15시간 미만이면 초단시간 근로자로 분류돼 주휴수당이 발생하지 않아요.
        </p>
      )}
      {eligibleByHours && !fullAttendance && (
        <p style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.7, textAlign: 'center', margin: '10px 0 0' }}>
          이번 주 결근이 있으면 15시간을 넘겨 일했어도 주휴수당이 발생하지 않아요.
        </p>
      )}

      {/* 투잡 계산기 */}
      <div style={{ marginTop: 18 }}>
        <button onClick={() => setJob2On((v) => !v)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(22,24,27,0.03)', border: `1px solid ${C.line}`, borderRadius: 10,
          padding: '11px 14px', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>
            💼 다른 알바도 같이 계산하기 (투잡)
          </span>
          <span style={{ fontSize: 13, color: C.inkFaint }}>{job2On ? '▲' : '▼'}</span>
        </button>
        {job2On && (
          <div style={{ marginTop: 8, background: 'rgba(22,24,27,0.02)', border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={fieldLabel}>알바 2 시급</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.inkSoft }}>￦</span>
                <input
                  type="number" inputMode="numeric" value={wage2} onChange={(e) => setWage2(e.target.value)}
                  placeholder="10320" style={{ ...monoInput, fontSize: 15 }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={fieldLabel}>알바 2 이번 주 총 근무시간</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <input
                  type="number" inputMode="decimal" min="0" step="0.5" value={totalHours2}
                  onChange={(e) => setTotalHours2(e.target.value)}
                  placeholder="0" style={{ ...monoInput, fontSize: 15 }}
                />
                <span style={{ fontSize: 12, color: C.inkFaint }}>h</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {[{ v: true, t: '개근했어요' }, { v: false, t: '결근이 있었어요' }].map((o) => {
                const on = fullAttendance2 === o.v;
                return (
                  <button key={o.t} onClick={() => setFullAttendance2(o.v)} style={{
                    flex: 1, padding: '9px 4px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${on ? C.ink : C.lineStrong}`,
                    background: on ? C.ink : 'transparent', color: on ? C.paper : C.inkSoft,
                  }}>
                    {o.t}
                  </button>
                );
              })}
            </div>
            <div style={{ fontFamily: "'Nanum Gothic Coding', monospace", borderTop: `1px dashed ${C.line}`, paddingTop: 10 }}>
              <ReceiptRow label="알바 2 주휴수당" value={won(juhyuPay2)} dim />
            </div>
          </div>
        )}
        {job2On && (totalHours2 || hours.some((h) => h)) && (
          <div style={{
            marginTop: 10, padding: '12px 14px', borderRadius: 10,
            background: 'rgba(15,107,58,0.06)', border: `1px solid ${C.approve}`,
          }}>
            <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 4 }}>두 알바 합산</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Nanum Gothic Coding', monospace" }}>
              <span style={{ fontSize: 12, color: C.inkSoft }}>주휴수당 합계</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.approve }}>{won(combinedJuhyu)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Nanum Gothic Coding', monospace", marginTop: 4 }}>
              <span style={{ fontSize: 12, color: C.inkSoft }}>이번 주 총 수령액</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{won(combinedTotal)}</span>
            </div>
          </div>
        )}
        <p style={{ fontSize: 10.5, color: C.inkFaint, margin: '8px 2px 0', lineHeight: 1.6 }}>
          주휴수당은 각 사업장에서 각각 별도로 조건을 따져요. 두 알바를 합쳐서 15시간을 넘겨도, 한쪽이 15시간 미만이면 그쪽은 지급 대상이 아니에요.
        </p>
      </div>

      {/* 공유 + 저장 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
        <button onClick={handleShare} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 999,
          border: `1.5px solid ${copied ? C.approve : C.lineStrong}`,
          background: copied ? 'rgba(15,107,58,0.08)' : 'transparent',
          color: copied ? C.approve : C.inkSoft, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>
          {copied ? '✓ 복사됐어요' : '📤 공유하기'}
        </button>
        <button onClick={handleSaveEntry} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 999,
          border: `1.5px solid ${saved ? C.approve : C.lineStrong}`,
          background: saved ? 'rgba(15,107,58,0.08)' : 'transparent',
          color: saved ? C.approve : C.inkSoft, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>
          {saved ? '✓ 저장됐어요' : '🧾 영수증철에 저장'}
        </button>
      </div>

      <ReceiptLog log={log} removeEntry={removeEntry} monthTotal={monthTotal} />

      {/* 사장님께 보낼 메시지 만들기 (지급 대상일 때만) */}
      {eligible && (
        <div style={{ marginTop: 14 }}>
          <button onClick={() => setShowMsg((v) => !v)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(22,24,27,0.03)', border: `1px solid ${C.line}`, borderRadius: 10,
            padding: '11px 14px', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>
              🧑‍💼 사장님께 보낼 메시지 만들기
            </span>
            <span style={{ fontSize: 13, color: C.inkFaint }}>{showMsg ? '▲' : '▼'}</span>
          </button>
          {showMsg && (
            <div style={{ marginTop: 8 }}>
              <div style={{
                background: '#fffef9', border: `1px solid ${C.lineStrong}`, borderRadius: 10,
                padding: '14px', fontSize: 12.5, lineHeight: 1.8, color: C.ink, whiteSpace: 'pre-wrap',
              }}>
                {employerMsg}
              </div>
              <button onClick={handleCopyMsg} style={{
                width: '100%', marginTop: 8, padding: '11px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                cursor: 'pointer', border: `1.5px solid ${msgCopied ? C.approve : C.ink}`,
                background: msgCopied ? 'rgba(15,107,58,0.08)' : C.ink,
                color: msgCopied ? C.approve : C.paper,
              }}>
                {msgCopied ? '✓ 복사됐어요, 카톡에 붙여넣으세요' : '메시지 복사하기'}
              </button>
              <p style={{ fontSize: 10.5, color: C.inkFaint, margin: '8px 2px 0', lineHeight: 1.6 }}>
                그대로 보내셔도 되고, 편하게 수정해서 쓰셔도 돼요.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 바코드 장식 */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
        <div aria-hidden style={{
          height: 26, width: 160,
          backgroundImage: `repeating-linear-gradient(90deg, ${C.ink} 0px, ${C.ink} 2px, transparent 2px, transparent 3px, ${C.ink} 3px, ${C.ink} 4px, transparent 4px, transparent 7px, ${C.ink} 7px, ${C.ink} 9px, transparent 9px, transparent 10px)`,
          opacity: 0.75,
        }} />
      </div>

      <p style={{ fontSize: 10.5, color: C.inkFaint, textAlign: 'center', lineHeight: 1.7, margin: '10px 0 0' }}>
        근로기준법 제55조·제18조 기준 · 조건: 소정근로 15h↑ + 개근<br />
        사업장 규모(5인 미만 포함)와 무관하게 적용돼요
      </p>
    </div>
  );
}

/* ── 공부방 ──────────────────────────────────────────────── */
function Articles() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const query = q.trim().toLowerCase();
  const catFiltered = cat === 'all' ? ARTICLES : ARTICLES.filter((a) => a.cat === cat);
  const filtered = query
    ? catFiltered.filter((a) => a.t.toLowerCase().includes(query) || a.p.some((p) => p.toLowerCase().includes(query)))
    : catFiltered;

  const CAT_OPTIONS = [
    { v: 'all', t: '전체' },
    { v: 'worker', t: '알바생용' },
    { v: 'employer', t: '사장님용' },
  ];

  return (
    <div>
      <p style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>
        주휴수당 조건부터 신고 방법까지, 알바생·사장님 모두 헷갈리는 것들을 정리했어요 (총 {ARTICLES.length}개)
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {CAT_OPTIONS.map((o) => {
          const on = cat === o.v;
          return (
            <button key={o.v} onClick={() => setCat(o.v)} style={{
              padding: '6px 13px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              border: `1.5px solid ${on ? C.ink : C.lineStrong}`,
              background: on ? C.ink : 'transparent', color: on ? C.paper : C.inkSoft,
            }}>
              {o.t}
            </button>
          );
        })}
      </div>
      <div style={{ position: 'relative', marginBottom: query ? 8 : 16 }}>
        <input
          value={q} onChange={(e) => setQ(e.target.value)} placeholder="궁금한 키워드로 검색 · 예) 신고, 퇴사, 결근"
          style={{
            width: '100%', background: 'transparent', borderRadius: 0, padding: '9px 22px 9px 2px', fontSize: 13,
            color: C.ink, border: 'none', borderBottom: `1.5px solid ${C.lineStrong}`, boxSizing: 'border-box',
          }}
        />
        {q && (
          <button
            onClick={() => setQ('')}
            aria-label="검색어 지우기"
            style={{
              position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', cursor: 'pointer', color: C.inkSoft,
              fontSize: 16, lineHeight: 1, padding: 4,
            }}
          >
            ×
          </button>
        )}
      </div>
      <p style={{ fontSize: 11, color: C.inkSoft, margin: '0 0 14px' }}>
        {filtered.length > 0 ? `${filtered.length}개 글 표시 중` : '해당하는 글이 없어요. 다른 조건으로 찾아보세요'}
      </p>
      {filtered.map((a, i) => {
        const teaser = a.p[0].length > 52 ? a.p[0].slice(0, 52) + '…' : a.p[0];
        const isEmployer = a.cat === 'employer';
        return (
          <details key={i} className="art-card" style={{
            background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12,
            marginBottom: 10, padding: '14px 14px 14px 16px', boxShadow: '0 1px 0 rgba(22,24,27,0.03)',
            borderLeft: `3px solid ${isEmployer ? '#2f5f8f' : C.approve}`,
          }}>
            <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, listStyle: 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                    background: isEmployer ? 'rgba(47,95,143,0.1)' : 'rgba(15,107,58,0.1)',
                    color: isEmployer ? '#2f5f8f' : C.approve,
                    fontFamily: "'Nanum Gothic Coding', monospace",
                  }}>
                    {isEmployer ? '사장님용' : '알바생용'}
                  </span>
                  <span style={{ color: C.inkFaint, fontFamily: "'Nanum Gothic Coding', monospace", fontSize: 10 }}>
                    #{String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, lineHeight: 1.4, marginBottom: 4 }}>
                  {a.t}
                </div>
                <div className="art-teaser" style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.6 }}>
                  {teaser}
                </div>
              </div>
              <span className="art-chevron" style={{
                flexShrink: 0, fontSize: 13, color: C.inkFaint, marginTop: 3,
                transition: 'transform 0.2s ease', display: 'inline-block',
              }}>
                ⌄
              </span>
            </summary>
            <div style={{ paddingTop: 12, marginTop: 10, borderTop: `1px dashed ${C.line}` }}>
              {a.p.map((para, j) => (
                <p key={j} style={{ fontSize: 12.5, lineHeight: 1.85, color: C.inkSoft, margin: j === 0 ? '0 0 10px' : '0 0 10px' }}>{para}</p>
              ))}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  shareText(a.t, `"${a.t}" — 주휴계산기에서 확인해보세요 →`, () => { setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 1800); });
                }}
                style={{
                  marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5,
                  color: copiedIdx === i ? C.approve : C.inkFaint, background: 'transparent',
                  border: `1px solid ${copiedIdx === i ? C.approve : C.lineStrong}`, borderRadius: 7,
                  padding: '6px 10px', cursor: 'pointer',
                }}
              >
                {copiedIdx === i ? '✓ 복사됐어요' : '📤 이 글 공유하기'}
              </button>
            </div>
          </details>
        );
      })}
      <p style={{ fontSize: 10.5, color: C.inkFaint, margin: '14px 0 0', lineHeight: 1.7 }}>
        위 내용은 일반적인 정보 제공 목적이며 법률 자문이 아니에요. 개별 사안은 고용노동부(국번없이 1350)나 노무사와 상담하는 것이 정확해요.
      </p>
    </div>
  );
}

/* ── 야간·연장근로수당 계산기 ────────────────────────────── */
const SEVERANCE_STORAGE_KEY = 'juhyu-severance-calc-v1';

function SeverancePayCalculator() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [wage3m, setWage3m] = useState('');
  const [avgHours15, setAvgHours15] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEVERANCE_STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.startDate) setStartDate(d.startDate);
        if (d.endDate) setEndDate(d.endDate);
        if (d.wage3m !== undefined) setWage3m(d.wage3m);
        if (typeof d.avgHours15 === 'boolean') setAvgHours15(d.avgHours15);
      }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(SEVERANCE_STORAGE_KEY, JSON.stringify({ startDate, endDate, wage3m, avgHours15 })); } catch (e) { /* ignore */ }
  }, [startDate, endDate, wage3m, avgHours15]);

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const workedDays = start && end && end > start ? Math.round((end - start) / (1000 * 60 * 60 * 24)) : 0;
  const eligibleByYear = workedDays >= 365;
  const eligible = eligibleByYear && avgHours15;

  let threeMonthsAgo = null;
  let daysIn3Months = 0;
  if (end) {
    threeMonthsAgo = new Date(end);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    daysIn3Months = Math.round((end - threeMonthsAgo) / (1000 * 60 * 60 * 24)) || 1;
  }
  const wage3mNum = parseFloat(wage3m) || 0;
  const avgDailyWage = daysIn3Months > 0 ? wage3mNum / daysIn3Months : 0;
  const severance = eligible ? avgDailyWage * 30 * (workedDays / 365) : 0;

  const fieldLabel = { fontSize: 11, color: C.inkSoft, fontWeight: 700, marginBottom: 7, letterSpacing: 0.3 };
  const dateInput = {
    width: '100%', background: 'transparent', border: 'none', borderBottom: `1.5px solid ${C.lineStrong}`,
    padding: '6px 2px', fontSize: 15, color: C.ink, fontWeight: 700,
    fontFamily: "'Nanum Gothic Coding', monospace", boxSizing: 'border-box',
  };
  const monoInput = {
    width: '100%', background: 'transparent', border: 'none', borderBottom: `1.5px solid ${C.lineStrong}`,
    padding: '6px 2px', fontSize: 17, color: C.ink, fontWeight: 700,
    fontFamily: "'Nanum Gothic Coding', monospace", boxSizing: 'border-box',
  };

  const handleShare = () => {
    const summary = eligible
      ? `예상 퇴직금 ${won(severance)}! 나도 계산해봤어요 →`
      : `내 퇴직금 계산해봤는데 아직 지급 대상이 아니래요. 조건 확인해보세요 →`;
    shareText('주휴계산기 — 퇴직금', summary, () => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };

  return (
    <div>
      <p style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.6, margin: '0 0 16px' }}>
        같은 사업장에서 1년 이상, 주 평균 15시간 이상 일했다면 퇴사할 때 퇴직금을 받을 수 있어요. 근로자퇴직급여보장법 기준이에요.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div>
          <div style={fieldLabel}>입사일</div>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={dateInput} />
        </div>
        <div>
          <div style={fieldLabel}>퇴사일(예정)</div>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={dateInput} />
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={fieldLabel}>퇴사 전 3개월간 받은 총 급여</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.inkSoft }}>￦</span>
          <input
            type="number" inputMode="numeric" value={wage3m} onChange={(e) => setWage3m(e.target.value)}
            placeholder="예: 6000000" style={monoInput}
          />
        </div>
        <p style={{ fontSize: 10.5, color: C.inkFaint, margin: '6px 2px 0' }}>
          급여명세서나 통장 입금내역에서 최근 3개월치를 더해서 입력하세요.
        </p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={fieldLabel}>재직 기간 내내 주 평균 15시간 이상 일했나요?</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ v: true, t: '네, 15시간 이상이었어요' }, { v: false, t: '아니요, 미만인 시기가 있었어요' }].map((o) => {
            const on = avgHours15 === o.v;
            return (
              <button key={o.t} onClick={() => setAvgHours15(o.v)} style={{
                flex: 1, padding: '10px 4px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${on ? C.ink : C.lineStrong}`,
                background: on ? C.ink : 'transparent', color: on ? C.paper : C.inkSoft,
              }}>
                {o.t}
              </button>
            );
          })}
        </div>
      </div>

      {start && end && end > start && (
        <>
          <div style={{ fontFamily: "'Nanum Gothic Coding', monospace" }}>
            <ReceiptRow label="재직일수" value={`${workedDays.toLocaleString('ko-KR')}일`} dim />
            <ReceiptRow label="1일 평균임금" value={won(avgDailyWage)} dim />
            <div style={{ borderTop: `2px solid ${C.ink}`, marginTop: 8, paddingTop: 10 }}>
              <ReceiptRow label="예상 퇴직금" value={won(severance)} strong />
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '22px 0 6px' }}>
            <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 8, fontFamily: "'Nanum Gothic Coding', monospace" }}>
              — 퇴직금 지급 판정 —
            </div>
            <div style={{ fontSize: 18, fontFamily: "'Nanum Gothic Coding', monospace" }}>
              {eligible ? (
                <Marker color={C.approve}>퇴직금 지급 대상이에요</Marker>
              ) : (
                <Marker color={C.deny}>아직 지급 대상이 아니에요</Marker>
              )}
            </div>
          </div>

          {!eligibleByYear && (
            <p style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.7, textAlign: 'center', margin: '10px 0 0' }}>
              같은 사업장에서 1년(365일) 이상 근무해야 퇴직금이 발생해요. 하루라도 못 채우면 대상이 아니에요.
            </p>
          )}
          {eligibleByYear && !avgHours15 && (
            <p style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.7, textAlign: 'center', margin: '10px 0 0' }}>
              4주 평균 소정근로시간이 15시간 미만이었던 달은 계속근로기간에서 빠질 수 있어요. 정확한 판단은 노무사·고용노동부 상담을 추천해요.
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
            <button onClick={handleShare} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 999,
              border: `1.5px solid ${copied ? C.approve : C.lineStrong}`,
              background: copied ? 'rgba(15,107,58,0.08)' : 'transparent',
              color: copied ? C.approve : C.inkSoft, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            }}>
              {copied ? '✓ 복사됐어요' : '📤 이 결과 공유하기'}
            </button>
          </div>
        </>
      )}

      <p style={{ fontSize: 10.5, color: C.inkFaint, textAlign: 'center', lineHeight: 1.7, margin: '16px 0 0' }}>
        근로자퇴직급여보장법 기준 · 실제 지급액은 상여금·연차수당 반영 여부 등에 따라 달라질 수 있어요.<br />
        미지급 시 사업주는 3년 이하 징역 또는 3천만원 이하 벌금에 처해질 수 있어요.
      </p>
    </div>
  );
}

/* ── main app ────────────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState('calc');

  /* ── schema.org 구조화 데이터 (FAQPage + WebSite) ── */
  useEffect(() => {
    const faqEntities = ARTICLES.map((a) => ({
      '@type': 'Question',
      name: a.t,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a.p[0],
      },
    }));

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: '주휴계산기',
          url: 'https://juhyu.kr',
          description: '시급과 요일별 근무시간만 입력하면 주휴수당 지급 대상인지, 얼마를 받아야 하는지 바로 계산해주는 무료 계산기',
          inLanguage: 'ko-KR',
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqEntities,
        },
      ],
    };

    let script = document.getElementById('ld-json-main');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'ld-json-main';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
  }, []);

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: C.desk, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 48px', boxSizing: 'border-box', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic+Coding:wght@400;700;800&family=Noto+Sans+KR:wght@400;500;600;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input:focus { outline: none; border-color: ${C.ink} !important; }
        button { font-family: inherit; }
        summary { list-style: none; }
        summary::-webkit-details-marker { display: none; }
        input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .art-card { transition: box-shadow 0.15s ease, transform 0.1s ease; }
        .art-card:active { transform: scale(0.985); background: #f7f6f1 !important; }
        .art-card[open] { box-shadow: 0 4px 14px rgba(22,24,27,0.08) !important; }
        .art-card[open] .art-chevron { transform: rotate(180deg); }
        .art-card[open] .art-teaser { display: none; }
        .art-card summary::-webkit-details-marker { display: none; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* 영수증 카드 */}
        <div style={{ boxShadow: '0 18px 40px rgba(22,24,27,0.16)' }}>
          <TornEdge />
          <div style={{ background: C.paper, padding: '22px 26px 8px' }}>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{
                fontFamily: "'Nanum Gothic Coding', monospace", fontWeight: 800, fontSize: 21,
                letterSpacing: 4, color: C.ink,
              }}>
                주 휴 계 산 기
              </div>
              <div style={{ fontFamily: "'Nanum Gothic Coding', monospace", fontSize: 10, letterSpacing: 2, color: C.inkFaint, marginTop: 6 }}>
                WEEKLY REST PAY RECEIPT
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`, height: 3, margin: '14px 0 4px' }} />
            <p style={{ textAlign: 'center', fontSize: 11.5, color: C.inkSoft, lineHeight: 1.6, margin: '10px 0 18px' }}>
              시급이랑 이번 주 근무시간을 넣으면<br />주휴수당 받을 수 있는지 바로 확인돼요
            </p>

            <MinWageDday />

            <div style={{ border: `1px dashed ${C.lineStrong}`, borderRadius: 8, padding: '8px 12px', textAlign: 'center', fontSize: 10, color: C.inkFaint, marginBottom: 18 }}>
              광고 영역 · AdSense 승인 후 스크립트 삽입
            </div>

            {/* 탭 (티켓 스텁) */}
            <div style={{ display: 'flex', marginBottom: 20, position: 'relative' }}>
              {[{ v: 'calc', t: '주휴수당' }, { v: 'severance', t: '퇴직금' }, { v: 'guide', t: '공부방' }].map((o, idx) => {
                const on = tab === o.v;
                return (
                  <button key={o.v} onClick={() => { setTab(o.v); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{
                    flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    border: 'none', borderBottom: `2.5px solid ${on ? C.ink : 'transparent'}`,
                    background: 'transparent', color: on ? C.ink : C.inkFaint,
                    fontFamily: "'Nanum Gothic Coding', monospace",
                  }}>
                    {o.t}
                  </button>
                );
              })}
            </div>

            {tab === 'calc' && <Calculator />}
            {tab === 'severance' && <SeverancePayCalculator />}
            {tab === 'guide' && <Articles />}
          </div>
          <div style={{ background: C.paper, padding: '4px 26px 0' }} />
          <TornEdge flip />
        </div>

        <div style={{ border: `1px dashed ${C.lineStrong}`, borderRadius: 8, padding: '9px 14px', textAlign: 'center', fontSize: 10.5, color: C.inkFaint, marginTop: 16 }}>
          광고 영역 · AdSense 승인 후 스크립트 삽입
        </div>

        <details style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, marginTop: 14, padding: '0 16px' }}>
          <summary style={{ padding: '13px 0', fontSize: 12, fontWeight: 700, color: C.ink, cursor: 'pointer' }}>
            🛡 개인정보처리방침
          </summary>
          <div style={{ paddingBottom: 16 }}>
            <p style={{ fontSize: 11.5, lineHeight: 1.8, color: C.inkSoft, margin: '0 0 10px' }}>
              주휴계산기는 회원가입 없이 이용하며 이름·이메일 등 개인 식별 정보를 수집하지 않아요. 입력하신 시급·근무시간 정보는 서버로 전송되지 않고 이용자의 브라우저(localStorage)에만 저장돼요.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 1.8, color: C.inkSoft, margin: '0 0 10px' }}>
              본 사이트는 Google AdSense 광고를 게재할 수 있어요. Google 등 제3자 광고 사업자는 쿠키를 사용해 관심 기반 광고를 제공할 수 있으며, Google 광고 설정에서 맞춤 광고를 해제할 수 있어요.
            </p>
            <p style={{ fontSize: 11.5, lineHeight: 1.8, color: C.inkSoft, margin: 0 }}>
              브라우저 사이트 데이터를 삭제하면 저장된 내용도 함께 삭제돼요.
            </p>
          </div>
        </details>

        <p style={{ fontSize: 10.5, color: C.inkFaint, textAlign: 'center', lineHeight: 1.7, margin: '16px 0 0' }}>
          이 계산기는 참고용이며 법률·노무 자문이 아니에요.
        </p>
      </div>
    </div>
  );
}
