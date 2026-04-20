'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import MapButton from '@/components/MapButton';
import PageLayout from '@/components/PageLayout';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';
import { copyToClipboard, getAppBaseUrl } from '@/lib/utils';
import { sendKakaoMessage } from '@/lib/kakao';

interface FlowResultSessionKeys {
  activity: string;   // 1차 결과 키
  location: string;   // 위치 키
  resultId: string;   // DB 결과 ID 키
}

interface FlowResultPageProps {
  backHref: string;
  sessionKeys: FlowResultSessionKeys;
  resultTitle?: string;          // 예: '오늘의 활동' | '오늘의 맛집'
  retryHref: string;
  detailHref?: string;           // 세부 뽑기로 이동 (optional)
  detailLabel?: string;          // 버튼 텍스트 (예: '세부 메뉴 뽑기')
  tipData?: Record<string, string>; // 카테고리별 팁
  fallbackHref?: string;         // activity 없을 때 리다이렉트 경로
}

// 결과 표시 + 공유 + 지도 검색 + 세부 뽑기 화면
// solo/result, food/result 양쪽에서 사용
export default function FlowResultPage({
  backHref,
  sessionKeys,
  resultTitle = '오늘의 활동',
  retryHref,
  detailHref,
  detailLabel,
  tipData,
  fallbackHref = '/',
}: FlowResultPageProps) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [activity, setActivity] = useState<{ label: string; emoji: string } | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  useEffect(() => {
    const saved = session.get<{ label: string; emoji: string }>(sessionKeys.activity);
    if (!saved) { router.replace(fallbackHref); return; }
    setActivity(saved);
    setLocation(session.get<string>(sessionKeys.location));
    setResultId(session.get<string>(sessionKeys.resultId));
  }, [router, sessionKeys.activity, sessionKeys.location, sessionKeys.resultId, fallbackHref]);

  const handleShare = async () => {
    if (!activity) return;
    if (!resultId) {
      showToast('공유 링크를 만들 수 없어요');
      return;
    }
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch { /* 웹 환경 무시 */ }
    await copyToClipboard(`${getAppBaseUrl()}/result/${resultId}`);
  };

  const handleKakaoShare = async () => {
    if (!activity || !resultId) return;
    const base = getAppBaseUrl();
    const linkUrl = `${base}/result/${resultId}`;
    const imageUrl = `${base}/result/${resultId}/opengraph-image`;
    await sendKakaoMessage({
      title: `${resultTitle}: ${activity.emoji} ${activity.label}`,
      description: '몇명이니로 결정했어요! 같이 해볼까요?',
      imageUrl,
      linkUrl,
      buttonText: '결과 보기',
    });
  };

  if (!activity) return null;

  const tip = tipData
    ? (tipData[activity.label] ?? tipData['default'])
    : null;

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href={backHref} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 타이틀 */}
        <div style={{ textAlign: 'center', paddingBottom: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>🎉 결정 완료!</div>
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
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 6 }}>{resultTitle}</div>
          <div data-testid="result-activity" style={{ fontSize: 28, fontWeight: 800 }}>{activity.label}</div>
          {location && (
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>📍 {location}</div>
          )}
        </div>

        {/* 팁 카드 */}
        {tip && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 8 }}>💡 추천 팁</div>
            <p style={{ fontSize: 15, color: 'var(--color-text)', lineHeight: 1.6 }}>{tip}</p>
          </div>
        )}

        {/* 지도 버튼 (위치 있을 때) */}
        {location && (
          <div style={{ display: 'flex', gap: 8 }}>
            <MapButton
              service="kakao"
              query={`${location} ${activity.label}`}
              onBlocked={() => showToast('팝업 차단을 해제해주세요')}
            />
            <MapButton
              service="naver"
              query={`${location} ${activity.label}`}
              onBlocked={() => showToast('팝업 차단을 해제해주세요')}
            />
          </div>
        )}

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24, paddingTop: 8 }}>
          {/* 세부 뽑기 버튼 (optional) */}
          {detailHref && (
            <button
              data-testid="btn-detail"
              onClick={() => router.push(detailHref)}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 14,
                background: '#fff',
                color: 'var(--color-primary)',
                fontSize: 15,
                fontWeight: 800,
                border: '2px solid var(--color-primary)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow)',
              }}
            >
              {detailLabel ?? '세부 메뉴 뽑기'} 🎲
            </button>
          )}

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
            onClick={() => router.push(retryHref)}
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
