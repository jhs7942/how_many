'use client';

import { useState, useEffect, useRef } from 'react';

interface ShellGameProps {
  segments: { label: string; emoji: string }[];
  seed?: number;
  resultIndex?: number;
  onResult: (index: number) => void;
  viewOnly?: boolean;
  hostChoice?: number;
}

type GameState = 'idle' | 'showing' | 'covering' | 'shuffling' | 'choosing' | 'revealing';

// mulberry32 PRNG
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// seed 기반 Fisher-Yates 셔플
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function ShellGame({
  segments,
  seed,
  resultIndex,
  onResult,
  viewOnly = false,
  hostChoice,
}: ShellGameProps) {
  const n = segments.length;
  // positions[i] = 화면상 위치 인덱스 (어떤 컵이 어느 자리에 있는지)
  const [positions, setPositions] = useState<number[]>(Array.from({ length: n }, (_, i) => i));
  const [gameState, setGameState] = useState<GameState>('idle');
  const [ballIndex, setBallIndex] = useState(0); // 공이 들어있는 컵의 원래 인덱스
  const [chosenCup, setChosenCup] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const posRef = useRef(positions);

  useEffect(() => { posRef.current = positions; }, [positions]);

  // 애니메이션 시작
  useEffect(() => {
    if (gameState !== 'idle') return;
    startGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function startGame() {
    const actualResult = resultIndex ?? Math.floor(Math.random() * n);
    const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);
    setBallIndex(actualResult);

    // 1. showing: 공 위치 보여주기
    setGameState('showing');
    await delay(2000);

    // 2. covering: 컵 덮기
    setGameState('covering');
    await delay(600);

    // 3. shuffling: 셔플 애니메이션
    setGameState('shuffling');
    const rng = mulberry32(actualSeed);
    const shuffleCount = 6 + Math.floor(rng() * 4); // 6~9번 스왑

    for (let i = 0; i < shuffleCount; i++) {
      const curr = [...posRef.current];
      const a = Math.floor(rng() * n);
      let b = Math.floor(rng() * (n - 1));
      if (b >= a) b++;
      [curr[a], curr[b]] = [curr[b], curr[a]];
      setPositions([...curr]);
      await delay(350);
    }

    // 4. choosing
    setGameState('choosing');
    if (viewOnly && hostChoice !== undefined) {
      await delay(500);
      handleChoose(hostChoice, actualResult);
    }
  }

  function handleChoose(cupIndex: number, winnerIndex?: number) {
    if (gameState !== 'choosing') return;
    setChosenCup(cupIndex);
    setGameState('revealing');
    const winner = winnerIndex ?? ballIndex;
    setTimeout(() => {
      setRevealed(true);
      onResult(winner);
    }, 600);
  }

  const CUP_W = Math.min(72, Math.floor(360 / n) - 8);
  const CUP_H = CUP_W * 1.2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {/* 게임 상태 메시지 */}
      <p style={{ fontSize: 15, color: 'var(--color-text)', fontWeight: 600, minHeight: 22 }}>
        {gameState === 'showing' && '👀 위치를 잘 기억하세요!'}
        {gameState === 'covering' && '컵을 덮습니다...'}
        {gameState === 'shuffling' && '🔀 섞는 중...'}
        {gameState === 'choosing' && !viewOnly && '🫵 어느 컵일까요?'}
        {gameState === 'choosing' && viewOnly && '방장이 선택 중...'}
        {gameState === 'revealing' && '두구두구...'}
      </p>

      {/* 컵 영역 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          position: 'relative',
          height: CUP_H + 40,
          width: '100%',
        }}
      >
        {Array.from({ length: n }, (_, i) => {
          // 이 위치(i)에 있는 컵의 원래 인덱스
          const cupOriginalIndex = positions.indexOf(i);
          const isBall = cupOriginalIndex === ballIndex;
          const isChosen = chosenCup === i;
          const isLifted =
            (gameState === 'showing') ||
            (gameState === 'revealing' && isChosen);

          return (
            <div
              key={i}
              onClick={() => !viewOnly && handleChoose(i)}
              style={{
                width: CUP_W,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: gameState === 'choosing' && !viewOnly ? 'pointer' : 'default',
                transition: 'transform 0.3s',
                transform: gameState === 'shuffling' ? 'scale(0.95)' : 'scale(1)',
              }}
            >
              {/* 컵 */}
              <div
                style={{
                  width: CUP_W,
                  height: CUP_H,
                  background: isChosen && revealed
                    ? (isBall ? 'var(--color-primary)' : '#ccc')
                    : 'var(--color-primary)',
                  borderRadius: '8px 8px 14px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: CUP_W * 0.45,
                  boxShadow: gameState === 'choosing' && !viewOnly
                    ? 'var(--shadow-lg)'
                    : 'var(--shadow)',
                  transition: 'transform 0.4s cubic-bezier(.4,2,.6,1), background 0.3s',
                  transform: isLifted ? `translateY(-${CUP_H * 0.6}px)` : 'translateY(0)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                🥤
              </div>

              {/* 공 (컵 아래) */}
              <div
                style={{
                  width: CUP_W * 0.6,
                  height: CUP_W * 0.6,
                  borderRadius: '50%',
                  background: isBall ? 'var(--color-primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: CUP_W * 0.3,
                  marginTop: -CUP_W * 0.1,
                  transition: 'opacity 0.3s',
                  opacity: isLifted ? 1 : 0,
                }}
              >
                {isBall && (
                  <span style={{ fontSize: CUP_W * 0.4 }}>
                    {segments[cupOriginalIndex].emoji}
                  </span>
                )}
              </div>

              {/* 선택 후 결과 레이블 */}
              {revealed && isChosen && (
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isBall ? 'var(--color-primary)' : '#888',
                  marginTop: 4,
                }}>
                  {isBall ? segments[cupOriginalIndex].label : '꽝'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택지 레이블 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {segments.map((s, i) => (
          <span
            key={i}
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              background: 'var(--color-accent)',
              fontSize: 13,
              color: 'var(--color-text)',
            }}
          >
            {s.emoji} {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
