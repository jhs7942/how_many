'use client';

import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import BackButton from '@/components/BackButton';
import { session } from '@/lib/session';

export default function SoloSettingPage() {
  const router = useRouter();

  function choose(mode: 'default' | 'custom') {
    session.set('soloMode', mode);
    router.push(mode === 'default' ? '/solo/people' : '/solo/custom');
  }

  return (
    <PageLayout>
      <div style={{ paddingTop: 20 }}>
        <BackButton href="/" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎲</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-text)', marginBottom: 8 }}>
            어떻게 정할까요?
          </h1>
          <p style={{ fontSize: 15, color: '#888', lineHeight: 1.6 }}>
            인원 수에 맞는 활동을 추천받거나<br />직접 후보를 입력할 수 있어요.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button
            data-testid="btn-mode-default"
            onClick={() => choose('default')}
            style={{
              background: '#fff',
              border: '2px solid var(--color-border)',
              borderRadius: 18,
              padding: '22px 20px',
              textAlign: 'left',
              cursor: 'pointer',
              boxShadow: 'var(--shadow)',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
              인원 수로 추천받기
            </div>
            <div style={{ fontSize: 13, color: '#888' }}>
              인원 수를 선택하면 맞춤 활동을 추천해드려요
            </div>
          </button>

          <button
            data-testid="btn-mode-custom"
            onClick={() => choose('custom')}
            style={{
              background: '#fff',
              border: '2px solid var(--color-border)',
              borderRadius: 18,
              padding: '22px 20px',
              textAlign: 'left',
              cursor: 'pointer',
              boxShadow: 'var(--shadow)',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>✏️</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
              직접 입력하기
            </div>
            <div style={{ fontSize: 13, color: '#888' }}>
              원하는 후보를 직접 입력해서 돌려요
            </div>
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
