'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import BackButton from '@/components/BackButton';
import CandidateEditor, { type Candidate } from '@/components/CandidateEditor';
import { session } from '@/lib/session';

const DEFAULT_CANDIDATES: Candidate[] = [
  { label: '카페', emoji: '☕' },
  { label: '영화', emoji: '🎬' },
];

export default function SoloCustomPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>(DEFAULT_CANDIDATES);

  function proceed() {
    if (candidates.length < 2) return;
    session.set('soloCandidates', candidates);
    router.push('/solo/location');
  }

  return (
    <PageLayout>
      <div style={{ paddingTop: 20 }}>
        <BackButton href="/solo/setting" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-text)', marginBottom: 8 }}>
            후보를 입력하세요
          </h1>
          <p style={{ fontSize: 15, color: '#888' }}>2개 이상 입력해야 돌릴 수 있어요</p>
        </div>

        <CandidateEditor candidates={candidates} onChange={setCandidates} maxCount={8} />
      </div>

      <button
        onClick={proceed}
        disabled={candidates.length < 2}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 16,
          border: 'none',
          background: candidates.length >= 2 ? 'var(--color-primary)' : '#ddd',
          color: candidates.length >= 2 ? '#fff' : '#aaa',
          fontWeight: 800,
          fontSize: 17,
          cursor: candidates.length >= 2 ? 'pointer' : 'not-allowed',
          marginTop: 8,
        }}
      >
        다음
      </button>
    </PageLayout>
  );
}
