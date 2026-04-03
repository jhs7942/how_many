'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import SpinWheel, { type SpinWheelHandle } from '@/components/SpinWheel';
import ContentShuffle from '@/components/ContentShuffle';
import SlotMachine from '@/components/SlotMachine';
import RopePull from '@/components/RopePull';
import { session } from '@/lib/session';
import { saveResult } from '@/lib/api/results';
import { pickGameType } from '@/lib/utils';
import type { ActivityItem } from '@/lib/data';

interface FlowDetailSessionKeys {
  parentActivity: string; // 1차 결과 키 (예: 'activity', 'foodActivity')
  activity: string;       // 2차 결과 저장 키 (예: 'place', 'foodDetailActivity')
  resultId: string;       // 예: 'placeResultId', 'foodDetailResultId'
}

interface FlowDetailRandomPageProps {
  backHref: string;
  dataMap: Record<string, ActivityItem[]>; // PLACE_DATA 또는 MENU_DATA
  sessionKeys: FlowDetailSessionKeys;
  resultHref: string;
  fallbackSegments?: ActivityItem[]; // dataMap에 키가 없을 때 사용할 기본값
  headerTitle?: string; // 헤더 타이틀 (예: '장소 결정', '세부 메뉴 결정')
  subTitle?: string;    // 서브 타이틀 (예: '어떤 장소로 갈까요?', '어떤 메뉴로 정할까요?')
  subDesc?: string;     // 서브 설명
  fallbackHref?: string; // parentActivity 없을 때 리다이렉트
}

// 2차 랜덤 (세부 데이터 뽑기) 화면
// solo/place/spin, food/detail/random 양쪽에서 사용
export default function FlowDetailRandomPage({
  backHref,
  dataMap,
  sessionKeys,
  resultHref,
  fallbackSegments,
  headerTitle = '세부 결정',
  subTitle = '어떤 것으로 정할까요?',
  subDesc = '버튼을 눌러 결정해보세요!',
  fallbackHref = '/',
}: FlowDetailRandomPageProps) {
  const router = useRouter();
  const spinRef = useRef<SpinWheelHandle>(null);

  const [parentActivity, setParentActivity] = useState<{ label: string; emoji: string } | null>(null);
  const [segments, setSegments] = useState<ActivityItem[]>([]);
  const [gameType, setGameType] = useState<'spin' | 'shuffle' | 'slot' | 'rope' | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  useEffect(() => {
    const saved = session.get<{ label: string; emoji: string }>(sessionKeys.parentActivity);
    if (!saved) {
      router.replace(fallbackHref);
      return;
    }
    setParentActivity(saved);

    const items = dataMap[saved.label] ?? fallbackSegments ?? [
      { label: '근처 맛집', emoji: '🍽️' },
      { label: '핫플레이스', emoji: '🔥' },
      { label: '조용한 곳', emoji: '🌿' },
      { label: '새로운 곳', emoji: '✨' },
    ];
    setSegments(items);
    setGameType(pickGameType(items.length));
  }, [dataMap, sessionKeys.parentActivity, fallbackSegments, fallbackHref, router]);

  const handleResult = async (result: { label: string; emoji: string }) => {
    if (hasResult) return;
    setIsSpinning(false);
    setHasResult(true);
    session.set(sessionKeys.activity, result);
    try {
      const saved = await saveResult({
        room_id: null,
        winner_label: result.label,
        winner_emoji: result.emoji,
        method: gameType === 'shuffle' ? 'shuffle' : gameType === 'slot' ? 'slot' : gameType === 'rope' ? 'rope' : 'spin',
        is_tie: false,
        vote_summary: null,
        location: null,
      });
      session.set(sessionKeys.resultId, saved.id);
    } catch {
      // DB 저장 실패해도 결과는 보여줌
    }
    setTimeout(() => {
      router.push(resultHref);
    }, 800);
  };

  const handleSpin = async () => {
    if (isSpinning || hasResult) return;
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch { /* 웹 환경 무시 */ }
    setIsSpinning(true);
    spinRef.current?.spin();
  };

  if (!parentActivity || !segments.length || !gameType) {
    return (
      <PageLayout>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 32 }}>⏳</div>
        </div>
      </PageLayout>
    );
  }

  const gameTitles = {
    spin: '🎡 돌림판',
    shuffle: '🔀 컨텐츠 셔플',
    slot: '🎰 슬롯머신',
    rope: '🪢 줄 뽑기',
  };

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href={backHref} />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>{headerTitle}</span>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '16px 0' }}>
        {/* 현재 카테고리 표시 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'var(--color-accent)',
            borderRadius: 9999,
            border: '1.5px solid var(--color-primary)',
          }}
        >
          <span>{parentActivity.emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary-dark)' }}>
            {parentActivity.label}
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>
            {subTitle}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            {subDesc}
          </p>
        </div>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#999', marginBottom: -8 }}>
          {gameTitles[gameType]}
        </div>

        {/* 게임 렌더링 */}
        {gameType === 'spin' && (
          <>
            <SpinWheel ref={spinRef} segments={segments} onResult={handleResult} />
            <button
              onClick={handleSpin}
              disabled={isSpinning || hasResult}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: isSpinning || hasResult ? 'rgba(255,122,61,0.6)' : 'var(--color-primary)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 800,
                boxShadow: '0 6px 24px rgba(255,122,61,0.45)',
                cursor: isSpinning || hasResult ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSpinning ? '돌리는 중' : hasResult ? '완료!' : 'SPIN!'}
            </button>
          </>
        )}

        {gameType === 'shuffle' && (
          <ContentShuffle
            segments={segments}
            onResult={(index) => handleResult(segments[index])}
          />
        )}

        {gameType === 'slot' && (
          <SlotMachine
            segments={segments}
            onResult={(index) => handleResult(segments[index])}
          />
        )}

        {gameType === 'rope' && (
          <RopePull
            segments={segments}
            onResult={(index) => handleResult(segments[index])}
          />
        )}
      </div>
    </PageLayout>
  );
}
