import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SHARE_CARD } from '@/lib/constants/shareCard';
import ResultClient from './ResultClient';

// 정적 빌드(Capacitor) 대응: 플레이스홀더 1개로 빌드 통과
// 실제 결과 링크(/result/[id])는 외부 브라우저에서 열림 → Vercel SSR이 처리
export function generateStaticParams() {
  return [{ id: '_' }];
}

function resolveBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return 'https://how-many-mauve.vercel.app';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const base = resolveBaseUrl();

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
    // 네트워크/빌드 중 fetch 실패 시 fallback 사용
  }

  const ogUrl = `${base}/result/${id}/opengraph-image`;
  const pageUrl = `${base}/result/${id}`;
  const title = `${emoji} ${label} — 몇명이니`;
  const description = '몇명이니로 결정했어요! 같이 해볼까요?';

  return {
    metadataBase: new URL(base),
    title,
    description,
    openGraph: {
      title: `${emoji} ${label}`,
      description,
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: ogUrl,
          width: SHARE_CARD.width,
          height: SHARE_CARD.height,
          alt: `${label} 결과 카드`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${emoji} ${label}`,
      description,
      images: [ogUrl],
    },
  };
}

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResultClient id={id} />;
}
