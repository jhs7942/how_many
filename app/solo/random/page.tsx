'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import BackButton from '@/components/BackButton';
import SpinWheel, { type SpinWheelHandle } from '@/components/SpinWheel';
import ContentShuffle from '@/components/ContentShuffle';
import SlotMachine from '@/components/SlotMachine';
import RopePull from '@/components/RopePull';
import { session } from '@/lib/session';
import { saveResult } from '@/lib/api/results';
import { pickGameType } from '@/lib/utils';
import type { Candidate } from '@/components/CandidateEditor';

export default function SoloRandomPage() {
  const router = useRouter();
  const spinRef = useRef<SpinWheelHandle>(null);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [gameType, setGameType] = useState<'spin' | 'shuffle' | 'slot' | 'rope' | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    const c = session.get<Candidate[]>('soloCandidates') ?? [];
    const loc = session.get<string>('soloLocation');
    setCandidates(c);
    setLocation(loc);

    const isTest = sessionStorage.getItem('devTestMode') === 'true';
    setTestMode(isTest);
    // 테스트 모드가 아닐 때만 자동으로 게임 타입 결정
    if (!isTest) {
      setGameType(pickGameType(c.length));
    }
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
        method: gameType === 'shuffle' ? 'shuffle' : gameType === 'slot' ? 'slot' : gameType === 'rope' ? 'rope' : 'spin',
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

  async function handleSpin() {
    if (isSpinning || done) return;
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch { /* 웹 환경 무시 */ }
    setIsSpinning(true);
    spinRef.current?.spin();
  }

  // 테스트 모드: 게임 타입 선택 화면
  if (testMode && !gameType) {
    const GAME_OPTIONS = [
      { type: 'spin',    emoji: '🎡', label: '돌림판',       desc: '원판을 돌려 결정' },
      { type: 'shuffle', emoji: '🔀', label: '컨텐츠 셔플',  desc: '컵 속에 숨은 정답 찾기' },
      { type: 'slot',    emoji: '🎰', label: '슬롯머신',     desc: '레버를 당겨 잭팟' },
      { type: 'rope',    emoji: '🪢', label: '줄 뽑기',      desc: '줄을 당겨 당첨 확인' },
    ] as const;

    return (
      <PageLayout>
        <div style={{ paddingTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BackButton href="/solo/setting" />
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)' }}>
              🧪 게임 타입 선택
            </h1>
          </div>
          <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 6, paddingLeft: 4, fontWeight: 600 }}>
            테스트 모드 — F10으로 끄면 랜덤 자동 선택
          </p>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, padding: '0 8px' }}>
          {GAME_OPTIONS.map(({ type, emoji, label, desc }) => (
            <button
              key={type}
              onClick={() => setGameType(type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 20px',
                borderRadius: 16,
                border: '2px solid var(--color-border)',
                background: 'var(--color-bg-card)',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: 'var(--shadow)',
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}
              onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span style={{ fontSize: 36 }}>{emoji}</span>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0' }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </PageLayout>
    );
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

  const gameTitles = {
    spin: '🎡 돌림판',
    shuffle: '🔀 컨텐츠 셔플',
    slot: '🎰 슬롯머신',
    rope: '🪢 줄 뽑기',
  };

  return (
    <PageLayout>
      <div style={{ paddingTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton href="/solo/setting" />
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)' }}>
            {gameTitles[gameType]}
          </h1>
        </div>
        {location && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 4 }}>
            📍 {location}
          </p>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        {gameType === 'spin' && (
          <>
            <SpinWheel
              ref={spinRef}
              segments={candidates}
              onResult={(result) => handleResult(result)}
              enableRespin={true}
            />
            <button
              data-testid="btn-spin"
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
        )}

        {gameType === 'shuffle' && (
          <ContentShuffle
            segments={candidates}
            onResult={(index) => handleResult(candidates[index])}
          />
        )}

        {gameType === 'slot' && (
          <SlotMachine
            segments={candidates}
            onResult={(index) => handleResult(candidates[index])}
          />
        )}

        {gameType === 'rope' && (
          <RopePull
            segments={candidates}
            onResult={(index) => handleResult(candidates[index])}
          />
        )}
      </div>
    </PageLayout>
  );
}
