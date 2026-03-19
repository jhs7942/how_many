'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import BackButton from '@/components/BackButton';
import SpinWheel, { type SpinWheelHandle } from '@/components/SpinWheel';
import ContentShuffle from '@/components/ContentShuffle';
import { session } from '@/lib/session';
import { saveResult } from '@/lib/api/results';
import type { Candidate } from '@/components/CandidateEditor';

export default function SoloRandomPage() {
  const router = useRouter();
  const spinRef = useRef<SpinWheelHandle>(null);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [gameType, setGameType] = useState<'spin' | 'shuffle' | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const c = session.get<Candidate[]>('soloCandidates') ?? [];
    const loc = session.get<string>('soloLocation');
    setCandidates(c);
    setLocation(loc);
    // 후보 수에 따라 컨텐츠 셔플 확률 결정
    const shuffleProb = c.length >= 7 ? 0.3 : 0.5;
    setGameType(Math.random() < shuffleProb ? 'shuffle' : 'spin');
  }, []);

  async function handleResult(winner: Candidate) {
    if (done) return;
    setDone(true);
    session.set('activity', winner);
    try {
      const result = await saveResult({
        room_id: null,
        winner_label: winner.label,
        winner_emoji: winner.emoji,
        method: gameType === 'shuffle' ? 'shuffle' : 'spin',
        is_tie: false,
        vote_summary: null,
        location: location,
      });
      session.set('soloResultId', result.id);
    } catch {
      // DB 저장 실패해도 결과는 보여줌
    }
    router.push('/solo/result');
  }

  function handleSpin() {
    if (isSpinning || done) return;
    setIsSpinning(true);
    spinRef.current?.spin();
  }

  if (!candidates.length || !gameType) {
    return (
      <PageLayout>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 32 }}>⏳</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div style={{ paddingTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton href="/solo/setting" />
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)' }}>
            {gameType === 'shuffle' ? '🔀 컨텐츠 셔플' : '🎡 돌림판'}
          </h1>
        </div>
        {location && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 4 }}>
            📍 {location}
          </p>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        {gameType === 'spin' ? (
          <>
            <SpinWheel
              ref={spinRef}
              segments={candidates}
              onResult={(result) => handleResult(result)}
              enableRespin={true}
            />
            <button
              onClick={handleSpin}
              disabled={isSpinning || done}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: 'none',
                background: isSpinning || done ? '#ddd' : 'var(--color-primary)',
                color: '#fff',
                fontWeight: 900,
                fontSize: 15,
                cursor: isSpinning || done ? 'not-allowed' : 'pointer',
                boxShadow: isSpinning || done ? 'none' : 'var(--shadow-lg)',
              }}
            >
              {isSpinning ? '...' : 'SPIN!'}
            </button>
          </>
        ) : (
          <ContentShuffle
            segments={candidates}
            onResult={(index) => handleResult(candidates[index])}
          />
        )}
      </div>
    </PageLayout>
  );
}
