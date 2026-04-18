import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import tipsJson from '@/assets/data/tips.json';
import foodTipsJson from '@/assets/data/food-tips.json';
import { SHARE_CARD } from '@/lib/constants/shareCard';
import { loadPretendard } from '@/lib/og/loadFont';

export const runtime = 'edge';
export const alt = '몇명이니 결과 카드';
export const size = { width: SHARE_CARD.width, height: SHARE_CARD.height };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const tips = tipsJson as Record<string, string>;
const foodTips = foodTipsJson as Record<string, string>;

function resolveTip(label: string): string {
  return tips[label] ?? foodTips[label] ?? tips['default'] ?? SHARE_CARD.fallback.tip;
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let label = SHARE_CARD.fallback.label;
  let emoji = SHARE_CARD.fallback.emoji;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data } = await supabase
      .from('results')
      .select('winner_label, winner_emoji')
      .eq('id', id)
      .maybeSingle();
    if (data) {
      label = data.winner_label ?? label;
      emoji = data.winner_emoji ?? emoji;
    }
  } catch {
    // Edge fetch 실패 시 fallback 값으로 렌더 — 빈 카드보다 낫다
  }

  const tip = resolveTip(label);
  const [regular, bold] = await loadPretendard();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          background: SHARE_CARD.bg,
          padding: SHARE_CARD.padding,
          fontFamily: 'Pretendard',
        }}
      >
        <div
          style={{
            width: SHARE_CARD.leftColumnWidth,
            fontSize: SHARE_CARD.emoji.size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {emoji}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            color: '#FFFFFF',
          }}
        >
          <div
            style={{
              fontSize: SHARE_CARD.label.size,
              fontWeight: SHARE_CARD.label.weight,
              lineHeight: 1.2,
              color: SHARE_CARD.label.color,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: SHARE_CARD.tip.size,
              color: SHARE_CARD.tip.color,
              lineHeight: 1.4,
              marginTop: 24,
              display: '-webkit-box',
              WebkitLineClamp: SHARE_CARD.tip.maxLines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {tip}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      emoji: 'twemoji',
      fonts: [
        { name: 'Pretendard', data: regular, weight: 400, style: 'normal' },
        { name: 'Pretendard', data: bold, weight: 700, style: 'normal' },
      ],
      headers: {
        'Cache-Control': 'public, s-maxage=31536000, immutable',
      },
    },
  );
}
