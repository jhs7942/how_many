'use client';

import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import BackButton from '@/components/BackButton';
import { session } from '@/lib/session';

export default function GroupSettingPage() {
  const router = useRouter();

  function choose(mode: 'vote' | 'random') {
    session.set('roomMode', mode);
    router.push('/group/create');
  }

  return (
    <PageLayout>
      <div style={{ paddingTop: 20 }}>
        <BackButton href="/" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>👥</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-text)', marginBottom: 8 }}>
            어떻게 정할까요?
          </h1>
          <p style={{ fontSize: 15, color: '#888', lineHeight: 1.6 }}>
            모두가 투표하거나,<br />운에 맡겨볼 수 있어요.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button
            onClick={() => choose('vote')}
            style={{
              background: '#fff',
              border: '2px solid var(--color-border)',
              borderRadius: 18,
              padding: '22px 20px',
              textAlign: 'left',
              cursor: 'pointer',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🗳️</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
              투표로 결정
            </div>
            <div style={{ fontSize: 13, color: '#888' }}>
              모두가 투표해서 가장 많은 표를 받은 것으로!
            </div>
          </button>

          <button
            onClick={() => choose('random')}
            style={{
              background: '#fff',
              border: '2px solid var(--color-border)',
              borderRadius: 18,
              padding: '22px 20px',
              textAlign: 'left',
              cursor: 'pointer',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎲</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
              랜덤으로 결정
            </div>
            <div style={{ fontSize: 13, color: '#888' }}>
              돌림판이나 야바위로 운명에 맡겨요!
            </div>
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
