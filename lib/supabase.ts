'use client';

import { createBrowserClient } from '@supabase/ssr';

// [학습] 모듈 레벨 변수로 클라이언트를 캐싱한다 — 흔한 "싱글톤 패턴".
// 매 import 마다 createBrowserClient()를 새로 호출하면 페이지 전환마다 새 WebSocket 연결이 만들어져
// Realtime 구독이 중복되거나, 인증 세션이 어긋나는 문제가 생긴다.
// 모듈은 ESM 표준상 한 번만 평가되므로, 이 `client` 변수는 앱 라이프사이클 동안 단 하나만 존재한다.
let client: ReturnType<typeof createBrowserClient> | null = null;

// [학습] @supabase/ssr 의 createBrowserClient
// 일반 @supabase/supabase-js 의 createClient 와 달리 Next.js의 SSR 환경(쿠키 기반 인증 등)을 자동 처리한다.
// 본 프로젝트는 익명 사용자 위주지만, 추후 로그인 기능을 붙일 때를 대비해 ssr 패키지 쪽을 쓰는 게 호환성에 안전하다.
export function getSupabase() {
  if (!client) {
    // [학습] 환경변수 끝의 `!` (non-null assertion)
    // TypeScript에게 "이 값은 절대 undefined가 아니다" 라고 단언한다.
    // 실제로 vercel 빌드 시 NEXT_PUBLIC_* 가 없으면 빌드 단계가 아닌 런타임에서야 깨지므로,
    // 빌드 후 즉시 동작 확인이 필요한 환경변수는 별도 체크 로직을 두는 것도 좋다.
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
