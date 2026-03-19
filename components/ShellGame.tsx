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

export default function ShellGame({
  segments,
  seed,
  resultIndex,
  onResult,
  viewOnly = false,
  hostChoice,
}: ShellGameProps) {
  const n = segments.length;
  // positions[cupIdx] = 해당 컵의 현재 화면상 위치 인덱스
  const [positions, setPositions] = useState<number[]>(Array.from({ length: n }, (_, i) => i));
  const [gameState, setGameState] = useState<GameState>('idle');
  const [chosenScreenPos, setChosenScreenPos] = useState<number | null>(null); // 선택한 화면 위치
  const [revealed, setRevealed] = useState(false);
  const [shakingCups, setShakingCups] = useState<Set<number>>(new Set());
  const posRef = useRef(positions);

  useEffect(() => { posRef.current = positions; }, [positions]);

  // 게임 자동 시작
  useEffect(() => {
    if (gameState !== 'idle') return;
    startGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function startGame() {
    const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);

    // 1. showing: 공 위치 보여주기
    setGameState('showing');
    await delay(2000);

    // 2. covering: 컵 덮기
    setGameState('covering');
    await delay(600);

    // 3. shuffling: 셔플 + 흔들기 애니메이션
    setGameState('shuffling');
    const rng = mulberry32(actualSeed);
    const shuffleCount = 6 + Math.floor(rng() * 4); // 6~9번 스왑

    for (let i = 0; i < shuffleCount; i++) {
      const curr = [...posRef.current];
      const a = Math.floor(rng() * n);
      let b = Math.floor(rng() * (n - 1));
      if (b >= a) b++;

      // 대상 컵 흔들기 → 위치 교환 → 안정
      setShakingCups(new Set([a, b]));
      await delay(80);
      [curr[a], curr[b]] = [curr[b], curr[a]];
      setPositions([...curr]);
      setShakingCups(new Set());
      await delay(260);
    }

    // 4. choosing
    setGameState('choosing');
    if (viewOnly && hostChoice !== undefined) {
      await delay(500);
      handleChoose(hostChoice);
    }
  }

  function handleChoose(screenPos: number) {
    if (gameState !== 'choosing') return;
    const cupIdx = positions.indexOf(screenPos);
    setChosenScreenPos(screenPos);
    setGameState('revealing');

    // 600ms: 컵이 완전히 열린 후 결과 레이블 표시
    setTimeout(() => {
      setRevealed(true);
    }, 600);
    // 1800ms: 사용자가 결과를 확인한 뒤 콜백 호출
    setTimeout(() => {
      onResult(cupIdx);
    }, 1800);
  }

  const gap = 12;
  const CUP_W = Math.min(72, Math.floor(360 / n) - 8);
  const CUP_H = CUP_W * 1.2;
  const containerWidth = n * CUP_W + (n - 1) * gap;

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

      {/* 컵 영역: 절대 위치 기반으로 부드러운 슬라이드 */}
      <div
        style={{
          position: 'relative',
          height: CUP_H + 50,
          width: containerWidth,
        }}
      >
        {Array.from({ length: n }, (_, cupIdx) => {
          const screenPos = positions[cupIdx]; // 이 컵의 현재 화면 위치
          const isChosen = chosenScreenPos === screenPos;
          const isLifted =
            (gameState === 'showing') ||
            (gameState === 'revealing' && isChosen);
          const isShaking = shakingCups.has(cupIdx);

          return (
            <div
              key={cupIdx}
              onClick={() => !viewOnly && handleChoose(screenPos)}
              style={{
                position: 'absolute',
                left: screenPos * (CUP_W + gap),
                top: 0,
                width: CUP_W,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: gameState === 'choosing' && !viewOnly ? 'pointer' : 'default',
                transition: 'left 0.25s ease-in-out',
              }}
            >
              {/* 컵 */}
              <div
                style={{
                  width: CUP_W,
                  height: CUP_H,
                  background: 'var(--color-primary)',
                  borderRadius: '8px 8px 14px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: CUP_W * 0.45,
                  boxShadow: gameState === 'choosing' && !viewOnly
                    ? 'var(--shadow-lg)'
                    : 'var(--shadow)',
                  // 셔플 중: 흔들기 애니메이션, 이외: 위/아래 lift 트랜지션
                  transform: !isShaking ? (isLifted ? `translateY(-${CUP_H * 0.6}px)` : 'translateY(0)') : undefined,
                  transition: isShaking ? 'background 0.3s' : 'transform 0.4s cubic-bezier(.4,2,.6,1), background 0.3s',
                  animation: isShaking ? 'cupShake 0.25s ease-in-out' : 'none',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                🥤
              </div>

              {/* 후보 아이콘 (컵 아래) */}
              <div
                style={{
                  width: CUP_W * 0.6,
                  height: CUP_W * 0.6,
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: CUP_W * 0.3,
                  marginTop: -CUP_W * 0.1,
                  transition: 'opacity 0.3s',
                  opacity: isLifted ? 1 : 0,
                }}
              >
                <span style={{ fontSize: CUP_W * 0.4 }}>
                  {segments[cupIdx].emoji}
                </span>
              </div>

              {/* 선택 후 결과 레이블 */}
              {revealed && isChosen && (
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  marginTop: 4,
                }}>
                  {segments[cupIdx].label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택지 레이블 — choosing/revealing 단계에서만 표시 */}
      {(gameState === 'choosing' || gameState === 'revealing') && (
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
      )}
    </div>
  );
}
