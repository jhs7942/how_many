// OG 결과 카드 디자인 상수 (1200×630 가로형).
// Satori 제약상 flexbox + linear-gradient 만 사용한다.

export const SHARE_CARD = {
  width: 1200,
  height: 630,
  bg: 'linear-gradient(135deg, #FF7A3D 0%, #FF9A6C 100%)',
  padding: 80,
  leftColumnWidth: 420,
  emoji: { size: 360 },
  label: { size: 96, weight: 700, color: '#FFFFFF' },
  tip: { size: 32, color: 'rgba(255, 255, 255, 0.85)', maxLines: 2 },
  fallback: {
    label: '결과',
    emoji: '🎉',
    tip: '몇명이니로 결정했어요!',
  },
} as const;
