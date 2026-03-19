'use client';

import { useRouter } from 'next/navigation';

export default function HostDisconnectedModal() {
  const router = useRouter();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '0 20px',
      }}
    >
      <div
        style={{
          background: 'var(--color-bg)',
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 360,
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 10 }}>
          방장이 나갔어요
        </h2>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 28, lineHeight: 1.6 }}>
          방장의 연결이 끊겼습니다.<br />
          처음으로 돌아가 새 방을 만들어보세요.
        </p>
        <button
          onClick={() => router.push('/')}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          처음으로
        </button>
      </div>
    </div>
  );
}
