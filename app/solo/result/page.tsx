'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';
import { copyToClipboard, getAppBaseUrl } from '@/lib/utils';
import { sendKakaoMessage } from '@/lib/kakao';
import tipsJson from '@/assets/data/tips.json';

const ACTIVITY_TIPS: Record<string, string> = tipsJson;

export default function SoloResultPage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [activity, setActivity] = useState<{ label: string; emoji: string } | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  useEffect(() => {
    const saved = session.get<{ label: string; emoji: string }>('activity');
    if (!saved) { router.replace('/solo/setting'); return; }
    setActivity(saved);
    setLocation(session.get<string>('soloLocation'));
    setResultId(session.get<string>('soloResultId'));
  }, [router]);

  const handleShare = async () => {
    if (!activity) return;
    if (!resultId) {
      showToast('공유 링크를 만들 수 없어요 😢');
      return;
    }
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch { /* 웹 환경 무시 */ }
    await copyToClipboard(`${getAppBaseUrl()}/result/${resultId}`);
    showToast('공유 링크가 복사됐어요! 📋');
  };

  const handleKakaoShare = () => {
    if (!activity || !resultId) return;
    const linkUrl = `${getAppBaseUrl()}/result/${resultId}`;
    sendKakaoMessage({
      title: `오늘의 활동: ${activity.emoji} ${activity.label}`,
      description: '몇명이니로 결정했어요! 같이 해볼까요?',
      linkUrl,
      buttonText: '결과 보기',
    });
  };

  const handleMapSearch = (service: 'kakao' | 'naver') => {
    if (!activity || !location) return;
    const query = `${location} ${activity.label}`;
    if (service === 'kakao') {
      window.open(`https://map.kakao.com/?q=${encodeURIComponent(query)}`);
    } else {
      window.open(`https://map.naver.com/v5/search/${encodeURIComponent(query)}`);
    }
  };

  if (!activity) return null;

  const tip = ACTIVITY_TIPS[activity.label] ?? ACTIVITY_TIPS['default'];

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href="/solo/random" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 타이틀 */}
        <div style={{ textAlign: 'center', paddingBottom: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>🎉 활동 결정 완료!</div>
        </div>

        {/* 결과 카드 */}
        <div
          data-testid="result-card"
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
          <div data-testid="result-activity" style={{ fontSize: 28, fontWeight: 800 }}>{activity.label}</div>
          {location && (
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>📍 {location}</div>
          )}
        </div>

        {/* 팁 카드 */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 8 }}>💡 추천 팁</div>
          <p style={{ fontSize: 15, color: 'var(--color-text)', lineHeight: 1.6 }}>{tip}</p>
        </div>

        {/* 지도 버튼 (위치 있을 때) */}
        {location && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              data-testid="btn-map-kakao"
              onClick={() => handleMapSearch('kakao')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 12,
                border: '1.5px solid var(--color-border)',
                background: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                color: 'var(--color-text)',
              }}
            >
              카카오지도 🗺️
            </button>
            <button
              data-testid="btn-map-naver"
              onClick={() => handleMapSearch('naver')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 12,
                border: '1.5px solid var(--color-border)',
                background: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                color: 'var(--color-text)',
              }}
            >
              네이버지도 🗺️
            </button>
          </div>
        )}

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24, paddingTop: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              data-testid="btn-share"
              onClick={handleShare}
              style={{
                flex: 1,
                padding: '15px',
                borderRadius: 14,
                background: 'var(--color-primary)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              링크 복사 📤
            </button>
            <button
              data-testid="btn-kakao-share"
              onClick={handleKakaoShare}
              style={{
                flex: 1,
                padding: '15px',
                borderRadius: 14,
                background: '#FEE500',
                color: '#191919',
                fontSize: 15,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              카카오 공유 💬
            </button>
          </div>
          <button
            data-testid="btn-retry"
            onClick={() => router.push('/solo/random')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              background: 'transparent',
              color: '#888',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            다시 돌리기 🔄
          </button>
          <button
            data-testid="btn-home"
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              background: 'transparent',
              color: '#aaa',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            홈으로 돌아가기 🏠
          </button>
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </PageLayout>
  );
}
