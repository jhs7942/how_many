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
