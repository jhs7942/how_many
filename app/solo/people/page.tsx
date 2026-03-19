'use client';

import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import { session } from '@/lib/session';
import { ACTIVITY_DATA } from '@/lib/data';

const PEOPLE_OPTIONS = [
  { count: 2, emoji: '👫', label: '2명' },
  { count: 3, emoji: '👨‍👩‍👦', label: '3명' },
  { count: 4, emoji: '👨‍👩‍👧‍👦', label: '4명' },
  { count: 5, emoji: '🫂', label: '5명' },
  { count: 6, emoji: '🎉', label: '6명+' },
];

export default function SoloPeoplePage() {
  const router = useRouter();

  const handleSelect = (count: number) => {
    session.set('people', count);
    const activities = ACTIVITY_DATA[count] ?? [];
    session.set('soloCandidates', activities);
    router.push('/solo/location');
  };

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href="/solo/setting" />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>인원 선택</span>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
            오늘 몇 명이 모이나요?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            인원수에 맞는 활동을 추천해 드려요
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
          {PEOPLE_OPTIONS.map(({ count, emoji, label }) => (
            <button
              key={count}
              onClick={() => handleSelect(count)}
              style={{
                aspectRatio: '1',
                borderRadius: 16,
                background: 'var(--color-bg-card)',
                border: '2px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: 'var(--shadow-DEFAULT)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--color-primary)';
                el.style.background = 'var(--color-accent)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--color-border)';
                el.style.background = 'var(--color-bg-card)';
              }}
            >
              <span style={{ fontSize: 28 }}>{emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{label}</span>
            </button>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            background: 'var(--color-bg-card)',
            borderRadius: 16,
            padding: 16,
            boxShadow: 'var(--shadow-DEFAULT)',
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, textAlign: 'center' }}>
            💡 인원수에 따라 최적의 활동 목록을 추천해요
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
