'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';
import { copyToClipboard, getAppBaseUrl } from '@/lib/utils';

export default function SoloPlaceResultPage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [activity, setActivity] = useState<{ label: string; emoji: string } | null>(null);
  const [place, setPlace] = useState<{ label: string; emoji: string } | null>(null);
  const [placeResultId, setPlaceResultId] = useState<string | null>(null);

  useEffect(() => {
    const savedActivity = session.get<{ label: string; emoji: string }>('activity');
    const savedPlace = session.get<{ label: string; emoji: string }>('place');
    if (!savedActivity || !savedPlace) {
      router.replace('/solo/people');
      return;
    }
    setActivity(savedActivity);
    setPlace(savedPlace);
    setPlaceResultId(session.get<string>('placeResultId'));
  }, [router]);

  const handleShare = async () => {
    if (!activity || !place) return;
    if (!placeResultId) {
      showToast('공유 링크를 만들 수 없어요 😢');
      return;
    }
    await copyToClipboard(`${getAppBaseUrl()}/result/${placeResultId}`);
    showToast('공유 링크가 복사됐어요! 📋');
  };

  const handleMapSearch = (mapType: 'kakao' | 'naver') => {
    if (!place) return;
    const query = encodeURIComponent(place.label);
    const url =
      mapType === 'kakao'
        ? `https://map.kakao.com/?q=${query}`
        : `https://map.naver.com/v5/search/${query}`;
    window.open(url, '_blank');
  };

  if (!activity || !place) return null;

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href="/solo/place/spin" />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>장소 결정 완료!</span>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 여정 표시 */}
        <div
          style={{
            background: 'var(--color-bg-card)',
            borderRadius: 16,
            padding: '16px 20px',
            boxShadow: 'var(--shadow-DEFAULT)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24 }}>{activity.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {activity.label}
            </div>
          </div>
          <div style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: 20 }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24 }}>{place.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {place.label}
            </div>
          </div>
        </div>

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
          <span style={{ fontSize: 56, marginBottom: 12, display: 'block' }}>{place.emoji}</span>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 6 }}>오늘의 장소</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{place.label}</div>
        </div>

        {/* 지도 검색 버튼 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={() => handleMapSearch('kakao')}
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: '#FAE100',
              color: '#3C1E1E',
              fontSize: 14,
              fontWeight: 700,
              boxShadow: 'var(--shadow-DEFAULT)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            🗺️ 카카오지도
          </button>
          <button
            onClick={() => handleMapSearch('naver')}
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: '#03C75A',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              boxShadow: 'var(--shadow-DEFAULT)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            🗺️ 네이버지도
          </button>
        </div>

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto', paddingTop: 24 }}>
          <button
            onClick={handleShare}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 9999,
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(255,122,61,0.35)',
            }}
          >
            결과 공유하기 📤
          </button>
          <button
            onClick={() => router.push('/solo/place/spin')}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 9999,
              background: 'var(--color-bg-card)',
              color: 'var(--color-primary)',
              fontSize: 15,
              fontWeight: 600,
              border: '2px solid var(--color-primary)',
            }}
          >
            장소 다시 선택 🔄
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 9999,
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            처음으로 돌아가기 🏠
          </button>
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </PageLayout>
  );
}
