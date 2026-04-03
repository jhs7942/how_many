'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import SpinWheel, { SpinWheelHandle } from '@/components/SpinWheel';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';
import { ACTIVITY_DATA, type ActivityItem } from '@/lib/data';

export default function SoloSpinPage() {
  const router = useRouter();
  const wheelRef = useRef<SpinWheelHandle>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const { toast, showToast } = useToast();
  const [segments, setSegments] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const people = session.get<number>('people') ?? 4;
    setSegments(ACTIVITY_DATA[people] ?? ACTIVITY_DATA[4]);
  }, []);

  const handleSpin = () => {
    if (isSpinning || hasResult) return;
    setIsSpinning(true);
    wheelRef.current?.spin();
  };

  const handleResult = (result: { label: string; emoji: string }) => {
    setIsSpinning(false);
    setHasResult(true);
    session.set('activity', result);
    setTimeout(() => {
      router.push('/solo/result');
    }, 800);
  };

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href="/solo/people" />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>활동 결정</span>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '16px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>
            오늘의 활동은?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            버튼을 눌러 돌림판을 돌려보세요!
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
            letterSpacing: '0.5px',
            boxShadow: '0 6px 24px rgba(255,122,61,0.45)',
            transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
            cursor: isSpinning || hasResult ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: !isSpinning && !hasResult ? 'bounce 1.5s ease-in-out infinite' : 'none',
          }}
        >
          {isSpinning ? '돌리는 중' : hasResult ? '완료!' : 'SPIN!'}
        </button>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </PageLayout>
  );
}
