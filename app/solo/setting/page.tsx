'use client';

import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';

export default function SoloSettingPage() {
  const router = useRouter();

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href="/" />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>혼자 결정</span>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, padding: '24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎲</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.4 }}>
            어떻게 결정할까요?
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
            인원 수에 맞는 추천 목록을 사용하거나<br />직접 항목을 입력할 수 있어요
          </p>
        </div>

        {/* 기본값 카드 */}
        <button
          onClick={() => router.push('/solo/people')}
          style={{
            background: 'var(--color-bg-card)',
            borderRadius: 20,
            padding: '24px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            boxShadow: 'var(--shadow-DEFAULT)',
            border: '2px solid transparent',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            width: '100%',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.background = 'var(--color-accent)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.background = 'var(--color-bg-card)';
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            🎯
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
              기본값으로 결정
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              인원 수를 선택하면 딱 맞는<br />활동 목록을 추천해드려요
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4l6 6-6 6" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* 직접 설정 카드 */}
        <button
          onClick={() => router.push('/solo/custom')}
          style={{
            background: 'var(--color-bg-card)',
            borderRadius: 20,
            padding: '24px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            boxShadow: 'var(--shadow-DEFAULT)',
            border: '2px solid transparent',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            width: '100%',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.background = 'var(--color-accent)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.background = 'var(--color-bg-card)';
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            ✏️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
              직접 설정
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              내가 원하는 항목을 직접<br />입력해서 랜덤으로 결정해요
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4l6 6-6 6" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </PageLayout>
  );
}
