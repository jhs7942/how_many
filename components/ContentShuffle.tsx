'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { mulberry32 } from '@/lib/utils';

interface ContentShuffleProps {
  segments: { label: string; emoji: string }[];
  seed?: number;
  resultIndex?: number;  // 외부에서 결과 지정 (그룹 동기화)
  onResult: (index: number) => void;
}

type GameState = 'idle' | 'showing' | 'covering' | 'shuffling' | 'choosing' | 'revealing';


export default function ContentShuffle({
  segments,
  seed,
  resultIndex,
  onResult,
}: ContentShuffleProps) {
  const n = segments.length;
  // positions[cupIdx] = 해당 컵의 현재 화면상 위치 인덱스
  const [positions, setPositions] = useState<number[]>(Array.from({ length: n }, (_, i) => i));
  const [gameState, setGameState] = useState<GameState>('idle');
  const [winnerScreenPos, setWinnerScreenPos] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [shakingCups, setShakingCups] = useState<Set<number>>(new Set());
  const posRef = useRef(positions);
  const cancelledRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { posRef.current = positions; }, [positions]);

  const delay = useCallback((ms: number) => {
    return new Promise<void>((r) => {
      const t = setTimeout(r, ms);
      timersRef.current.push(t);
    });
  }, []);

  const startGame = useCallback(async () => {
    if (cancelledRef.current) return;
    const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);
    const rng = mulberry32(actualSeed);

    // 1. showing: 컨텐츠 위치 보여주기
    setGameState('showing');
    await delay(2000);
    if (cancelledRef.current) return;

    // 2. covering: 컵 덮기
    setGameState('covering');
    await delay(600);
    if (cancelledRef.current) return;

    // 3. shuffling: 셔플 + 흔들기 애니메이션
    setGameState('shuffling');
    const shuffleCount = 6 + Math.floor(rng() * 4); // 6~9번 스왑

    for (let i = 0; i < shuffleCount; i++) {
      if (cancelledRef.current) return;
      const curr = [...posRef.current];
      const a = Math.floor(rng() * n);
      let b = Math.floor(rng() * (n - 1));
      if (b >= a) b++;

      setShakingCups(new Set([a, b]));
      await delay(80);
      if (cancelledRef.current) return;
      [curr[a], curr[b]] = [curr[b], curr[a]];
      setPositions([...curr]);
      setShakingCups(new Set());
      await delay(260);
    }

    if (cancelledRef.current) return;

    // 4. choosing 또는 자동 공개
    if (resultIndex !== undefined) {
      // 참여자 관람 모드: resultIndex로 자동 공개
      const screenPos = posRef.current[resultIndex];
      setWinnerScreenPos(screenPos);
      setGameState('revealing');
      const t1 = setTimeout(() => { if (!cancelledRef.current) setRevealed(true); }, 600);
      const t2 = setTimeout(() => { if (!cancelledRef.current) onResult(resultIndex); }, 1800);
      timersRef.current.push(t1, t2);
    } else {
      // 사용자가 직접 선택
      setGameState('choosing');
    }
  }, [seed, resultIndex, onResult, delay, n]);

  // 게임 자동 시작
  useEffect(() => {
    cancelledRef.current = false;
    timersRef.current = [];
    if (gameState !== 'idle') return;
    startGame();
    return () => {
      cancelledRef.current = true;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChoose(screenPos: number) {
    if (gameState !== 'choosing') return;
    const cupIdx = posRef.current.indexOf(screenPos);
    setWinnerScreenPos(screenPos);
    setGameState('revealing');
    const t1 = setTimeout(() => { if (!cancelledRef.current) setRevealed(true); }, 600);
    const t2 = setTimeout(() => { if (!cancelledRef.current) onResult(cupIdx); }, 1800);
    timersRef.current.push(t1, t2);
  }

  const gap = 12;
  const CUP_W = Math.min(72, Math.floor(360 / n) - 8);
  const CUP_H = CUP_W * 1.2;
  const containerWidth = n * CUP_W + (n - 1) * gap;
  const LIFT_H = Math.ceil(CUP_H * 0.65); // 컵 들어올림 여백 (텍스트 겹침 방지)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
      {/* 게임 상태 메시지 */}
      <p style={{ fontSize: 15, color: 'var(--color-text)', fontWeight: 600, minHeight: 22 }}>
        {gameState === 'showing' && '👀 위치를 잘 기억하세요!'}
        {gameState === 'covering' && '컵을 덮습니다...'}
        {gameState === 'shuffling' && '🔀 섞는 중...'}
        {gameState === 'choosing' && '🫵 어느 컵일까요?'}
        {gameState === 'revealing' && '두구두구...'}
      </p>

      {/* 컵 영역: 절대 위치 기반으로 부드러운 슬라이드 */}
      <div
        style={{
          position: 'relative',
          height: CUP_H + 50 + LIFT_H,
          width: containerWidth,
        }}
      >
        {Array.from({ length: n }, (_, cupIdx) => {
          const screenPos = positions[cupIdx];
          const isWinner = winnerScreenPos === screenPos;
          const isLifted =
            (gameState === 'showing') ||
            (gameState === 'revealing' && isWinner);
          const isShaking = shakingCups.has(cupIdx);

          return (
            <div
              key={cupIdx}
              onClick={() => handleChoose(screenPos)}
              style={{
                position: 'absolute',
                left: screenPos * (CUP_W + gap),
                top: LIFT_H,
                width: CUP_W,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: gameState === 'choosing' ? 'pointer' : 'default',
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
                  boxShadow: gameState === 'choosing' ? 'var(--shadow-lg)' : 'var(--shadow)',
                  transform: !isShaking ? (isLifted ? `translateY(-${CUP_H * 0.6}px)` : 'translateY(0)') : undefined,
                  transition: isShaking ? 'background 0.3s' : 'transform 0.4s cubic-bezier(.4,2,.6,1), background 0.3s',
                  animation: isShaking ? 'cupShake 0.25s ease-in-out' : 'none',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                🥤
              </div>

              {/* 결과 레이블 — 이모지 위, 컵 아래 */}
              {revealed && isWinner && (
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  marginTop: 4,
                  marginBottom: 2,
                }}>
                  {segments[cupIdx].label}
                </span>
              )}

              {/* 컨텐츠 아이콘 (컵 아래) */}
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
                  marginTop: revealed && isWinner ? 0 : -CUP_W * 0.1,
                  transition: 'opacity 0.3s',
                  opacity: isLifted ? 1 : 0,
                }}
              >
                <span style={{ fontSize: CUP_W * 0.4 }}>
                  {segments[cupIdx].emoji}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 컨텐츠 목록 */}
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
