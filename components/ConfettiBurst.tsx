'use client';

import { useEffect } from 'react';

// 결과 페이지 마운트 시 1회 발사되는 컨페티 축하 연출
// - prefers-reduced-motion: reduce 시 자동 비활성화 (접근성)
// - canvas-confetti 동적 import로 초기 번들 증가 최소화
export default function ConfettiBurst() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let cancelled = false;
    (async () => {
      const { default: confetti } = await import('canvas-confetti');
      if (cancelled) return;

      const primary = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim() || '#FF7A3D';

      // 양쪽 끝에서 대각선으로 쏘아 중앙 상단에 꽃잎처럼 퍼지게
      const baseOpts = {
        particleCount: 60,
        spread: 70,
        startVelocity: 45,
        ticks: 200,
        scalar: 0.9,
        colors: [primary, '#FFC48A', '#FFE0C2', '#FFFFFF'],
      };

      confetti({ ...baseOpts, origin: { x: 0.1, y: 0.8 }, angle: 60 });
      confetti({ ...baseOpts, origin: { x: 0.9, y: 0.8 }, angle: 120 });
    })();

    return () => { cancelled = true; };
  }, []);

  return null;
}
