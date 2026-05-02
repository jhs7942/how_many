// 시드 기반 PRNG (mulberry32)
//
// [학습] 왜 Math.random() 대신 시드 기반 난수가 필요한가?
// 그룹 플로우(여러 디바이스가 동일한 게임을 동시에 보는)에서 "방장이 본 결과 == 참여자가 본 결과" 가 보장돼야 한다.
// Math.random()은 호출 시각·환경에 따라 결과가 달라지므로 동일 시드를 주고 같은 횟수만큼 호출하면 같은 수열이 나오는
// 결정적(deterministic) PRNG 가 필요하다. mulberry32는 그 중 가장 짧고 빠른 구현 중 하나다.
//
// [학습] 비트 연산자(`|=`, `>>>`, `^`)
// 비트로 직접 값을 섞어 해시 효과를 낸다. JS의 `|0` 패턴은 "32비트 정수로 강제 변환" 트릭이다.
// 사용자 코드에서 자주 쓸 일은 없지만, "왜 이렇게 생겼는지" 이해해두면 해시 코드를 읽을 때 막히지 않는다.
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 방 코드 생성 (6자리 영숫자)
//
// [학습] 사용 가능한 문자에서 0/O, 1/I/L 같이 헷갈리는 글자는 일부러 뺐다.
// 사용자가 음성으로 코드를 불러주거나 손으로 적을 때 오인을 줄이기 위함.
// 32^6 ≈ 10억 — 동시 활성 방 수에 비하면 충돌 확률 무시 가능 수준.
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// 배열에서 n개 항목을 무작위 추출 (Fisher-Yates 셔플 후 잘라내기)
// 풍부한 데이터 풀에서 화면 노출용 일부만 sampling — HM-31 콘텐츠 7개 정책 대응
//
// [학습] Fisher-Yates 셔플 — 가장 단순하면서도 편향 없이 모든 순열을 균등하게 만들어내는 알고리즘.
// arr.sort(() => Math.random() - 0.5) 같은 흔한 패턴은 사실 분포가 한쪽으로 쏠리는 버그를 가진다.
// 무작위 추출이 통계적으로 중요하다면 sort-random 대신 이 방식을 써야 한다.
export function sampleN<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return [...arr];
  // [학습] 원본 배열을 직접 셔플하면 호출부가 의도치 않게 영향을 받는다 ("부수효과").
  // 한 번 복사한 뒤 그 복사본만 셔플 — 입력은 항상 안전하게 유지하는 게 함수형 스타일의 기본기.
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// 게임 타입 선택 (후보 수에 따라 확률 분기)
//
// [학습] "도메인 규칙을 한 함수에 모은다" 패턴
// 4종 게임(spin/shuffle/slot/rope) 중 어떤 걸 보여줄지 결정하는 룰은 페이지 곳곳에 흩어져 있으면 일관성을 잃는다.
// 한 함수로 모아두면 "후보 7명 이상이면 rope 제외" 같은 정책이 바뀌어도 한 곳만 수정하면 된다.
export function pickGameType(count: number): 'spin' | 'shuffle' | 'slot' | 'rope' {
  const r = Math.random();
  if (count >= 7) {
    // rope는 줄이 많으면 화면 부족, shuffle은 컵이 작아져 가독성 저하 → 둘 다 제외
    return r < 0.5 ? 'spin' : 'slot';
  }
  if (r < 0.25) return 'spin';
  if (r < 0.5) return 'shuffle';
  if (r < 0.75) return 'slot';
  return 'rope';
}

// 앱 베이스 URL 반환 — Capacitor 앱은 localhost로 서빙되므로 배포 URL로 대체
//
// [학습] Capacitor 환경 감지
// Capacitor는 Next.js에서 빌드한 정적 파일을 안드로이드 WebView에 내장해 띄우는 구조다.
// 그 결과 `window.location.origin`이 "http://localhost" 또는 "capacitor://localhost"가 되어버려서
// 그 값을 그대로 공유 링크 / 이미지 URL에 쓰면 다른 사람 휴대폰에서 깨진다.
// 앱 환경이 감지되면 NEXT_PUBLIC_APP_URL(=실제 vercel 도메인)으로 강제 치환하는 이유다.
export function getAppBaseUrl(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_APP_URL ?? '';
  const origin = window.location.origin;
  // Capacitor: 'http(s)://localhost' (포트 없음) 또는 'capacitor://localhost'
  if (/^https?:\/\/localhost$/.test(origin) || origin.startsWith('capacitor://')) {
    return process.env.NEXT_PUBLIC_APP_URL ?? 'https://how-many-mauve.vercel.app';
  }
  return origin;
}

// 외부 지도 서비스 종류
export type MapService = 'kakao' | 'naver';

// 외부 지도 서비스를 새 탭에서 연다.
// 팝업 차단을 감지해 boolean 반환 — 호출부가 토스트 등 사용자 피드백을 띄울 수 있도록.
//
// [학습] window.open 의 반환값
// 정상 열림 → window 객체, 차단 → null 또는 곧바로 closed === true.
// "결과를 알 수 없을 때" 호출부에 boolean으로 알려주는 게 UX 측면에서 중요하다 —
// 차단되어 아무 일도 안 일어나면 사용자는 "버튼이 안 먹나?" 라고 느끼기 때문.
export function openMap(service: MapService, query: string): boolean {
  const encoded = encodeURIComponent(query);
  const url =
    service === 'kakao'
      ? `https://map.kakao.com/?q=${encoded}`
      : `https://map.naver.com/v5/search/${encoded}`;
  const popup = window.open(url, '_blank');
  if (!popup || popup.closed) return false;
  return true;
}

// 클립보드 복사 (Capacitor 네이티브 우선, 웹 폴백)
//
// [학습] 3단 폴백 패턴
// 1) Capacitor 네이티브 Clipboard — 안드로이드/iOS 앱 환경에서 가장 안정적
// 2) navigator.clipboard.writeText — 모던 브라우저 표준 API (HTTPS·focus 필요)
// 3) document.execCommand('copy') — 사실상 deprecated이지만 구형/비-secure 컨텍스트의 마지막 보루
// 위에서 실패하면 try/catch가 받아서 자연스럽게 다음 단계로 흘러간다 — "조용히 포기하지 않고, 가능한 모든 수단을 차례대로 시도".
// document.execCommand 케이스에서 textarea를 fixed + opacity 0 으로 깐 건 "보이지 않지만 select() 가 동작하도록" 하기 위함.
export async function copyToClipboard(text: string): Promise<void> {
  try {
    const { Clipboard } = await import('@capacitor/clipboard');
    await Clipboard.write({ string: text });
  } catch {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  }
}
