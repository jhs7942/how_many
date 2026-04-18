// 시드 기반 PRNG (mulberry32)
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 방 코드 생성 (6자리 영숫자)
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// 게임 타입 선택 (후보 수에 따라 확률 분기)
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

// 파일명 안전 문자만 허용 (한글, 영문, 숫자, 하이픈)
// 사용자 입력이 파일명에 포함될 때 경로 탐색·특수문자 문제 방지
export function sanitizeFilename(raw: string): string {
  return raw.replace(/[^가-힣a-zA-Z0-9-]/g, '_');
}

// 클립보드 복사 (Capacitor 네이티브 우선, 웹 폴백)
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
