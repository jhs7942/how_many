'use client';

import { useState, useEffect, useRef } from 'react';
import { mulberry32 } from '@/lib/utils';
import { useViewportWidth } from '@/lib/hooks/useViewportWidth';

interface RopePullProps {
  segments: { label: string; emoji: string }[];
  seed?: number;
  resultIndex?: number;  // 그룹 동기화용 (외부 지정)
  onResult: (index: number) => void;
}

type GameState = 'idle' | 'grabbed' | 'revealing' | 'result';

const ROPE_HEIGHT = 130;       // 줄 기본 높이
const HANDLE_SIZE = 44;        // 손잡이 지름
const DRAG_THRESHOLD = 60;     // 뽑기 확정 임계값 (px)
const MAX_DRAG = DRAG_THRESHOLD * 1.5;  // 최대 드래그 거리

export default function RopePull({
  segments,
  seed,
  resultIndex: externalResultIndex,
  onResult,
}: RopePullProps) {
  const n = segments.length;
  const [gameState, setGameState] = useState<GameState>('idle');
  const [grabbedIndex, setGrabbedIndex] = useState<number | null>(null);
  const [dragOffsets, setDragOffsets] = useState<number[]>(Array(n).fill(0));
  const [confirmedIndex, setConfirmedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [resultIdx, setResultIdx] = useState<number | null>(null);

  const pointerStartY = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      timers.current.forEach(clearTimeout);
    };
  }, []);

  // 참여자 모드 자동 공개 (externalResultIndex 제공 시)
  useEffect(() => {
    if (externalResultIndex !== undefined) {
      setResultIdx(externalResultIndex);
      setConfirmedIndex(0);  // 첫 번째 줄 시각적으로 선택
      const t = setTimeout(() => {
        if (!cancelledRef.current) revealResult(externalResultIndex);
      }, 800);
      timers.current.push(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function revealResult(idx: number) {
    setGameState('revealing');

    const t1 = setTimeout(() => {
      if (cancelledRef.current) return;
      setRevealed(true);
    }, 400);

    const t2 = setTimeout(() => {
      if (cancelledRef.current) return;
      setGameState('result');
      onResult(idx);
    }, 1800);

    timers.current.push(t1, t2);
  }

  function onHandleDown(handleIdx: number, e: React.PointerEvent) {
    if (gameState !== 'idle') return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 합성 이벤트 등에서 실패 가능 */ }
    pointerStartY.current = e.clientY;
    setGrabbedIndex(handleIdx);
    setGameState('grabbed');
  }

  function onHandleMove(handleIdx: number, e: React.PointerEvent) {
    if (gameState !== 'grabbed' || grabbedIndex !== handleIdx) return;
    const delta = Math.max(0, Math.min(e.clientY - pointerStartY.current, MAX_DRAG));
    setDragOffsets(prev => {
      const next = [...prev];
      next[handleIdx] = delta;
      return next;
    });
  }

  function onHandleUp(handleIdx: number, e: React.PointerEvent) {
    if (gameState !== 'grabbed' || grabbedIndex !== handleIdx) return;
    const delta = Math.max(0, e.clientY - pointerStartY.current);

    if (delta >= DRAG_THRESHOLD) {
      const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);
      const rng = mulberry32(actualSeed);
      const idx = externalResultIndex ?? Math.floor(rng() * n);

      setResultIdx(idx);
      setConfirmedIndex(handleIdx);
      setDragOffsets(Array(n).fill(0));
      revealResult(idx);
    } else {
      // 임계값 미달 → 원위치 복귀
      setDragOffsets(Array(n).fill(0));
      setGrabbedIndex(null);
      setGameState('idle');
    }
  }

  // 컬럼 너비 계산 (실제 viewport 기반, foldable·소형 기기 대응)
  const viewportW = useViewportWidth();
  // PageLayout 좌우 padding 20px씩 + 안전 마진 8px → 실제 가용 폭
  const gap = 10;
  const maxWidth = Math.min(viewportW, 430) - 48;
  const colW = Math.max(36, Math.floor((maxWidth - (n - 1) * gap) / n));
  const containerWidth = n * colW + (n - 1) * gap;

  // 컨테이너 높이: 라벨박스 + 줄 + 손잡이 + 드래그 여유
  const containerHeight = 64 + ROPE_HEIGHT + HANDLE_SIZE + MAX_DRAG + 8;

  const isConfirming = gameState === 'revealing' || gameState === 'result';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <p style={{ fontSize: 15, color: 'var(--color-text)', fontWeight: 600, minHeight: 22, textAlign: 'center' }}>
        {gameState === 'idle' && '🪢 줄을 잡아당겨보세요!'}
        {gameState === 'grabbed' && '💪 더 세게 당겨요!'}
        {gameState === 'revealing' && '두구두구...'}
        {gameState === 'result' && '🎉 당첨!'}
      </p>

      <div
        style={{
          position: 'relative',
          width: containerWidth,
          height: containerHeight,
          userSelect: 'none',
        }}
      >
        {segments.map((_, i) => {
          const x = i * (colW + gap);
          const isDragged = grabbedIndex === i && gameState === 'grabbed';
          const isWinner = confirmedIndex === i && isConfirming;
          const isLoser = isConfirming && confirmedIndex !== i;
          const dragOffset = dragOffsets[i];
          const ropeStretch = isDragged ? dragOffset : 0;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                width: colW,
                opacity: isLoser ? 0 : 1,
                transition: isLoser ? 'opacity 0.35s ease' : 'none',
              }}
            >
              {/* 결과 라벨 박스 */}
              <div
                style={{
                  width: colW,
                  height: 64,
                  borderRadius: 12,
                  background: isWinner && revealed
                    ? 'var(--color-primary)'
                    : 'var(--color-accent)',
                  border: `2px solid ${isWinner && revealed ? 'var(--color-primary-dark)' : 'var(--color-border)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  transition: 'background 0.3s, border-color 0.3s',
                  animation: isWinner && revealed ? 'scaleIn 0.4s ease' : 'none',
                  overflow: 'hidden',
                }}
              >
                {isWinner && revealed && resultIdx !== null ? (
                  <>
                    <span style={{ fontSize: 22 }}>{segments[resultIdx].emoji}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      textAlign: 'center',
                      maxWidth: colW - 10,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {segments[resultIdx].label}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 22, color: '#bbb' }}>?</span>
                )}
              </div>

              {/* 줄 */}
              <div
                style={{
                  width: 4,
                  height: ROPE_HEIGHT + ropeStretch,
                  background: isDragged
                    ? 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))'
                    : isWinner
                    ? 'var(--color-primary)'
                    : '#bbb',
                  borderRadius: 2,
                  margin: '0 auto',
                  transition: isDragged ? 'none' : 'height 0.35s cubic-bezier(.4,2,.6,1), background 0.3s',
                }}
              />

              {/* 손잡이 — marginTop -6으로 줄과 자연 연결 (4px 폭 → 44px round 폭 차이로 인한 시각 갭 제거) */}
              <div
                onPointerDown={(e) => onHandleDown(i, e)}
                onPointerMove={(e) => onHandleMove(i, e)}
                onPointerUp={(e) => onHandleUp(i, e)}
                onPointerCancel={(e) => onHandleUp(i, e)}
                style={{
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: '50%',
                  background: isDragged
                    ? 'var(--color-primary)'
                    : gameState === 'idle'
                    ? 'var(--color-primary-light)'
                    : '#ddd',
                  cursor: gameState === 'idle' ? 'grab' : isDragged ? 'grabbing' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  boxShadow: isDragged ? 'var(--shadow-lg)' : 'var(--shadow)',
                  transform: `translateY(${dragOffset}px)`,
                  transition: dragOffset === 0 && !isDragged
                    ? 'transform 0.35s cubic-bezier(.4,2,.6,1), background 0.2s'
                    : 'background 0.2s',
                  touchAction: 'none',
                  margin: '-6px auto 0',
                }}
              >
                🪢
              </div>
            </div>
          );
        })}
      </div>

      {gameState === 'idle' && (
        <p style={{ fontSize: 12, color: '#999' }}>줄을 잡고 아래로 당기세요</p>
      )}
    </div>
  );
}
