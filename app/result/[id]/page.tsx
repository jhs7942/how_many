import ResultClient from './ResultClient';

// 정적 빌드(Capacitor) 대응: 플레이스홀더 1개로 빌드 통과
// 실제 결과 링크(/result/[id])는 외부 브라우저에서 열림 → Vercel SSR이 처리
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResultClient id={id} />;
}
