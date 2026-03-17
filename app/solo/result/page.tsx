'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';
import { copyToClipboard } from '@/lib/utils';

const ACTIVITY_TIPS: Record<string, string> = {
  '카페': '☕ 조용한 분위기에서 대화를 나눠보세요',
  '산책': '🌿 가까운 공원이나 강변을 걸어보세요',
  '전시': '🎨 현재 특별 전시회를 먼저 확인해보세요',
  '영화': '🎬 미리 좌석 예약을 추천해요',
  '노래방': '🎤 코인노래방도 좋은 선택이에요',
  '술집': '🍺 좋은 분위기의 이자카야 어때요?',
  '보드게임': '🎲 보드게임 카페에서 다양한 게임을 즐기세요',
  '방탈출': '🔐 예약 필수! 미리 체크해보세요',
  '볼링': '🎳 볼링장 신발 사이즈도 미리 확인해두세요',
  '고깃집': '🥩 예약이 필요한 곳은 미리 알아보세요',
};

export default function SoloResultPage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [activity, setActivity] = useState<{ label: string; emoji: string } | null>(null);

  useEffect(() => {
    const saved = session.get<{ label: string; emoji: string }>('activity');
    if (!saved) {
      router.replace('/solo/people');
      return;
    }
    setActivity(saved);
  }, [router]);

  const handleShare = async () => {
    if (!activity) return;
    await copyToClipboard(`오늘의 활동은 "${activity.label}" ${activity.emoji}로 결정됐어요! - 몇명이니`);
    showToast('클립보드에 복사되었어요! 📋');
  };

  if (!activity) return null;

  const tip = ACTIVITY_TIPS[activity.label] ?? '즐거운 시간 보내세요!';

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href="/solo/spin" />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>활동 결정 완료!</span>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 결과 카드 */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #FF9A6C 100%)',
            borderRadius: 16,
            padding: '32px 24px',
            textAlign: 'center',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(255,122,61,0.35)',
            animation: 'scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          <span style={{ fontSize: 56, marginBottom: 12, display: 'block' }}>{activity.emoji}</span>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 6 }}>오늘의 활동</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{activity.label}</div>
        </div>

        {/* 팁 카드 */}
        <div
          style={{
            background: 'var(--color-bg-card)',
            borderRadius: 16,
            padding: 20,
            boxShadow: 'var(--shadow-DEFAULT)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            💡 추천 팁
          </div>
          <p style={{ fontSize: 15, color: 'var(--color-text)', lineHeight: 1.6 }}>{tip}</p>
        </div>

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto', paddingTop: 24 }}>
          <button
            onClick={() => router.push('/solo/place/spin')}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 9999,
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(255,122,61,0.35)',
              transition: 'transform 0.25s',
            }}
          >
            장소도 정해볼까요? 📍
          </button>
          <button
            onClick={handleShare}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 9999,
              background: 'var(--color-bg-card)',
              color: 'var(--color-primary)',
              fontSize: 16,
              fontWeight: 700,
              border: '2px solid var(--color-primary)',
              transition: 'transform 0.25s',
            }}
          >
            결과 공유하기 📤
          </button>
          <button
            onClick={() => router.push('/solo/spin')}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 9999,
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 15,
              fontWeight: 600,
              transition: 'transform 0.25s',
            }}
          >
            다시 돌리기 🔄
          </button>
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </PageLayout>
  );
}
