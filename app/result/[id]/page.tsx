'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { getResult } from '@/lib/api/results';
import type { Result } from '@/lib/types';

export default function SharedResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getResult(id).then((res) => {
      setResult(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <PageLayout>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 32 }}>⏳</div>
        </div>
      </PageLayout>
    );
  }

  if (!result) {
    return (
      <PageLayout>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <p style={{ fontSize: 16, color: '#888', textAlign: 'center' }}>결과를 찾을 수 없어요</p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            홈으로
          </button>
        </div>
      </PageLayout>
    );
  }

  const methodLabel = result.method === 'vote' ? '투표' : result.method === 'spin' ? '돌림판' : '야바위';
  const createdAt = new Date(result.created_at);
  const dateStr = `${createdAt.getFullYear()}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${String(createdAt.getDate()).padStart(2, '0')}`;

  return (
    <PageLayout>
      <div style={{ paddingTop: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text)', textAlign: 'center' }}>
          🎉 결과 공유
        </h1>
        <p style={{ fontSize: 13, color: '#888', textAlign: 'center', marginTop: 4 }}>{dateStr}</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20, paddingTop: 24 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #FF9A6C 100%)',
            borderRadius: 20,
            padding: '36px 24px',
            textAlign: 'center',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(255,122,61,0.35)',
          }}
        >
          <span style={{ fontSize: 64, display: 'block', marginBottom: 14 }}>{result.winner_emoji}</span>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>{methodLabel}로 결정됐어요</div>
          <div style={{ fontSize: 30, fontWeight: 900 }}>{result.winner_label}</div>
          {result.location && (
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 10 }}>📍 {result.location}</div>
          )}
          {result.is_tie && (
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8 }}>🎲 동점 추첨 결과</div>
          )}
        </div>

        <button
          onClick={() => router.push('/')}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: 14,
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          나도 써볼래요 🎲
        </button>
      </div>
    </PageLayout>
  );
}
