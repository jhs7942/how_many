'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import SpinWheel, { SpinWheelHandle } from '@/components/SpinWheel';
import { session } from '@/lib/session';
import { saveResult } from '@/lib/api/results';
import { PLACE_DATA } from '@/lib/data';

export default function SoloPlaceSpinPage() {
  const router = useRouter();
  const wheelRef = useRef<SpinWheelHandle>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [activity, setActivity] = useState<{ label: string; emoji: string } | null>(null);

  useEffect(() => {
    const saved = session.get<{ label: string; emoji: string }>('activity');
    if (!saved) {
      router.replace('/solo/people');
      return;
    }
    setActivity(saved);
  }, [router]);

  if (!activity) return null;

  const segments = PLACE_DATA[activity.label] ?? [
    { label: '근처 맛집', emoji: '🍽️' },
    { label: '핫플레이스', emoji: '🔥' },
    { label: '조용한 곳', emoji: '🌿' },
    { label: '새로운 곳', emoji: '✨' },
  ];

  const handleSpin = () => {
    if (isSpinning || hasResult) return;
    setIsSpinning(true);
    wheelRef.current?.spin();
  };

  const handleResult = async (result: { label: string; emoji: string }) => {
    setIsSpinning(false);
    setHasResult(true);
    session.set('place', result);
    try {
      const saved = await saveResult({
        room_id: null,
        winner_label: result.label,
        winner_emoji: result.emoji,
        method: 'spin',
        is_tie: false,
        vote_summary: null,
        location: null,
      });
      session.set('placeResultId', saved.id);
    } catch {
      // DB 저장 실패해도 결과는 보여줌
    }
    setTimeout(() => {
      router.push('/solo/place/result');
    }, 800);
  };

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href="/solo/result" />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>장소 결정</span>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '16px 0' }}>
        {/* 현재 활동 표시 */}
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
          <span>{activity.emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary-dark)' }}>
            {activity.label} 장소 선택
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>
            어떤 장소로 갈까요?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            버튼을 눌러 장소를 결정해보세요!
          </p>
        </div>

        <SpinWheel ref={wheelRef} segments={segments} onResult={handleResult} />

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
      </div>
    </PageLayout>
  );
}
