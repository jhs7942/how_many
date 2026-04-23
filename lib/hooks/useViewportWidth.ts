'use client';

import { useEffect, useState } from 'react';

// 현재 뷰포트 너비 반환 — resize·orientation 변경에 반응
// SSR 초기값은 앱 최대 폭(430)으로 fallback, hydration 후 실제 값으로 갱신
export function useViewportWidth(): number {
  const [width, setWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 430
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return width;
}
