'use client';

import { forwardRef } from 'react';
import { SHARE_CARD } from '@/lib/constants/shareCard';

interface ShareCardProps {
  emoji: string;
  label: string;
  tip?: string; // undefined -> 팁 영역 숨김 + 수직 중앙 재배치
}

// 오프스크린 공유 카드 DOM (1080x1080)
// html-to-image의 렌더 타겟으로만 사용. 화면에 보이지 않음.
const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ emoji, label, tip }, ref) {
    const hasTip = !!tip;

    return (
      <div
        ref={ref}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: -99999,
          top: 0,
          pointerEvents: 'none',
          width: SHARE_CARD.width,
          height: SHARE_CARD.height,
          background: SHARE_CARD.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // 팁 없으면 전체 수직 중앙 정렬
          justifyContent: hasTip ? 'flex-start' : 'center',
          padding: SHARE_CARD.padding,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* 이모지 */}
        <div
          style={{
            fontSize: SHARE_CARD.emoji.size,
            lineHeight: 1,
            // 팁 있을 때: 상단에서 약간 아래로 배치
            marginTop: hasTip ? 80 : 0,
            marginBottom: hasTip ? 40 : 24,
            textAlign: 'center',
          }}
        >
          {emoji}
        </div>

        {/* 컨텐츠명 */}
        <div
          style={{
            fontSize: SHARE_CARD.label.size,
            fontWeight: SHARE_CARD.label.weight,
            color: SHARE_CARD.label.color,
            textAlign: 'center',
            lineHeight: 1.2,
            wordBreak: 'keep-all',
          }}
        >
          {label}
        </div>

        {/* 팁 영역 (있을 때만 렌더) */}
        {hasTip && (
          <div
            style={{
              marginTop: 40,
              fontSize: SHARE_CARD.tip.size,
              color: SHARE_CARD.tip.color,
              textAlign: 'center',
              lineHeight: 1.4,
              maxWidth: SHARE_CARD.width - SHARE_CARD.padding * 2,
              // 2줄 말줄임 처리
              display: '-webkit-box',
              WebkitLineClamp: SHARE_CARD.tip.maxLines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'keep-all',
            }}
          >
            {tip}
          </div>
        )}
      </div>
    );
  }
);

export default ShareCard;
