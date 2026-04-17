'use client';

import { useState, useEffect, useRef } from 'react';
import { mulberry32 } from '@/lib/utils';

interface SlotMachineProps {
  segments: { label: string; emoji: string }[];
  seed?: number;
  resultIndex?: number;  // 그룹 동기화용 (외부 지정)
  onResult: (index: number) => void;
}

type GameState = 'idle' | 'pulling' | 'spinning' | 'nearMiss' | 'result';

const REEL_H = 216;        // 가시 영역 높이 (ITEM_H × 3)
const ITEM_H = 72;         // 릴 아이템 1개 높이
const REPEAT = 14;         // 릴 아이템 반복 횟수 (충분한 스크롤 확보)
const CENTER_OFFSET = REEL_H / 2 - ITEM_H / 2;  // 아이템 센터 정렬 오프셋 (72px)
const MAX_PULL = 80;       // 레버 최대 드래그 거리
const TRIGGER_THRESHOLD = 48;  // 스핀 트리거 임계값 (MAX_PULL × 0.6)
const REEL_DURATION = 2600;    // 릴 0 애니메이션 시간 (ms)
const REEL_STAGGER = 700;      // 릴 간 정지 딜레이 (ms)

export default function SlotMachine({
  segments,
  seed,
  resultIndex: externalResultIndex,
  onResult,
}: SlotMachineProps) {
  const n = segments.length;
  const [gameState, setGameState] = useState<GameState>('idle');
  const [leverDelta, setLeverDelta] = useState(0);
  const [reelOffsets, setReelOffsets] = useState<number[]>([CENTER_OFFSET, CENTER_OFFSET, CENTER_OFFSET]);
  const [stoppedReels, setStoppedReels] = useState<boolean[]>([false, false, false]);
  const [resultIdx, setResultIdx] = useState<number | null>(null);

  const pointerStartY = useRef(0);
  const isDragging = useRef(false);
  const rafIds = useRef<number[]>([]);
  const cancelledRef = useRef(false);
  const gameStateRef = useRef<GameState>('idle');
  gameStateRef.current = gameState;
  const reelOffsetsRef = useRef(reelOffsets);
  useEffect(() => { reelOffsetsRef.current = reelOffsets; }, [reelOffsets]);
  const nearMissTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      rafIds.current.forEach(cancelAnimationFrame);
      clearTimeout(nearMissTimerRef.current);
    };
  }, []);

  // 참여자 모드 자동 스핀 (externalResultIndex 제공 시)
  useEffect(() => {
    if (externalResultIndex !== undefined && gameStateRef.current === 'idle') {
      const t = setTimeout(() => {
        if (!cancelledRef.current) startSpin(externalResultIndex);
      }, 600);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startSpin(forceIdx?: number) {
    const currentState = gameStateRef.current;
    if (currentState !== 'idle' && currentState !== 'pulling') return;
    cancelledRef.current = false;

    const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);
    const rng = mulberry32(actualSeed);
    const resolvedIdx = forceIdx ?? externalResultIndex ?? Math.floor(rng() * n);
    const doNearMiss = n > 2 && rng() < 0.4;

    let reelTargets: number[];
    if (doNearMiss) {
      let wrongIdx = Math.floor(rng() * (n - 1));
      if (wrongIdx >= resolvedIdx) wrongIdx++;
      reelTargets = [resolvedIdx, resolvedIdx, wrongIdx];
    } else {
      reelTargets = [resolvedIdx, resolvedIdx, resolvedIdx];
    }

    setResultIdx(resolvedIdx);
    setGameState('spinning');
    setLeverDelta(0);
    setStoppedReels([false, false, false]);

    let stoppedCount = 0;

    [0, 1, 2].forEach((reelIdx) => {
      const duration = REEL_DURATION + reelIdx * REEL_STAGGER;
      const laps = 5 + reelIdx;
      const endDisplayIdx = n * laps + reelTargets[reelIdx];
      const startY = CENTER_OFFSET;
      const endY = -endDisplayIdx * ITEM_H + CENTER_OFFSET;

      let startTime: number | null = null;

      function frame(now: number) {
        if (cancelledRef.current) return;
        if (startTime === null) startTime = now;

        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);

        let eased: number;
        if (t < 0.7) {
          eased = (t / 0.7) * 0.75;
        } else {
          const t2 = (t - 0.7) / 0.3;
          eased = 0.75 + (1 - Math.pow(1 - t2, 3)) * 0.25;
        }

        const currentY = startY + (endY - startY) * eased;
        setReelOffsets(prev => {
          const next = [...prev];
          next[reelIdx] = currentY;
          return next;
        });

        if (t < 1) {
          rafIds.current.push(requestAnimationFrame(frame));
        } else {
          setReelOffsets(prev => {
            const next = [...prev];
            next[reelIdx] = endY;
            return next;
          });
          setStoppedReels(prev => {
            const next = [...prev];
            next[reelIdx] = true;
            return next;
          });
          stoppedCount++;
          if (stoppedCount === 3) {
            if (doNearMiss) {
              setGameState('nearMiss');
              nearMissTimerRef.current = setTimeout(() => {
                if (cancelledRef.current) return;
                retryLastReel(resolvedIdx);
              }, 1200);
            } else {
              setGameState('result');
              onResult(resolvedIdx);
            }
          }
        }
      }

      rafIds.current.push(requestAnimationFrame(frame));
    });
  }

  function retryLastReel(targetIdx: number) {
    setStoppedReels([true, true, false]);
    setGameState('spinning');

    const duration = 1800;
    const laps = 3;
    const endDisplayIdx = n * laps + targetIdx;
    const startY = reelOffsetsRef.current[2];
    const endY = -endDisplayIdx * ITEM_H + CENTER_OFFSET;

    let startTime: number | null = null;

    function frame(now: number) {
      if (cancelledRef.current) return;
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      setReelOffsets(prev => {
        const next = [...prev];
        next[2] = startY + (endY - startY) * eased;
        return next;
      });

      if (t < 1) {
        rafIds.current.push(requestAnimationFrame(frame));
      } else {
        setReelOffsets(prev => { const next = [...prev]; next[2] = endY; return next; });
        setStoppedReels([true, true, true]);
        setGameState('result');
        onResult(targetIdx);
      }
    }

    rafIds.current.push(requestAnimationFrame(frame));
  }

  function onLeverDown(e: React.PointerEvent) {
    if (gameState !== 'idle') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerStartY.current = e.clientY;
    isDragging.current = true;
    setGameState('pulling');
  }

  function onLeverMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    const delta = Math.max(0, Math.min(e.clientY - pointerStartY.current, MAX_PULL));
    setLeverDelta(delta);
  }

  function onLeverUp(e: React.PointerEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = Math.max(0, Math.min(e.clientY - pointerStartY.current, MAX_PULL));

    if (delta >= TRIGGER_THRESHOLD) {
      startSpin();
    } else {
      setLeverDelta(0);
      setGameState('idle');
    }
  }

  const reelItems = Array.from({ length: REPEAT }, () => segments).flat();
  const leverActive = gameState === 'idle' || gameState === 'pulling';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, userSelect: 'none' }}>
      <p style={{ fontSize: 15, color: 'var(--color-text)', fontWeight: 600, minHeight: 22, textAlign: 'center' }}>
        {gameState === 'idle' && '🎰 레버를 당겨보세요!'}
        {gameState === 'pulling' && '⬇️ 더 당겨요...'}
        {gameState === 'spinning' && '🎲 두구두구...'}
        {gameState === 'nearMiss' && '😮 아깝다! 한 번 더...'}
        {gameState === 'result' && '🎉 잭팟!'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* 슬롯머신 본체 */}
        <div
          style={{
            background: 'linear-gradient(145deg, #2d1b69, #1a1a2e)',
            borderRadius: 20,
            padding: '16px 12px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            position: 'relative',
          }}
        >
          {/* 릴 래퍼 */}
          <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
            {/* 중앙 하이라이트 (당첨 라인) */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: REEL_H / 2 - ITEM_H / 2,
                height: ITEM_H,
                border: `3px solid var(--color-primary)`,
                borderRadius: 10,
                pointerEvents: 'none',
                zIndex: 10,
                background: 'rgba(255,122,61,0.1)',
              }}
            />

            {/* 3개 릴 */}
            {[0, 1, 2].map((reelIdx) => (
              <div
                key={reelIdx}
                style={{
                  width: 76,
                  height: REEL_H,
                  overflow: 'hidden',
                  borderRadius: 10,
                  background: '#fff',
                  position: 'relative',
                  boxShadow: stoppedReels[reelIdx] && resultIdx !== null
                    ? 'inset 0 0 0 2px var(--color-primary)'
                    : undefined,
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* 상단 페이드 */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 48,
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), transparent)',
                  zIndex: 2, pointerEvents: 'none',
                }} />
                {/* 하단 페이드 */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
                  background: 'linear-gradient(to top, rgba(255,255,255,0.95), transparent)',
                  zIndex: 2, pointerEvents: 'none',
                }} />

                {/* 릴 스트립 */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    transform: `translateY(${reelOffsets[reelIdx]}px)`,
                    willChange: 'transform',
                  }}
                >
                  {reelItems.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        height: ITEM_H,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        padding: '0 4px',
                      }}
                    >
                      <span style={{ fontSize: 26, lineHeight: 1 }}>{item.emoji}</span>
                      <span style={{
                        fontSize: 10,
                        color: '#444',
                        fontWeight: 700,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        padding: '0 2px',
                      }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 레버 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginLeft: 10,
            height: REEL_H + 32,
          }}
        >
          {/* 손잡이 */}
          <div
            onPointerDown={onLeverDown}
            onPointerMove={onLeverMove}
            onPointerUp={onLeverUp}
            onPointerCancel={onLeverUp}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: leverActive
                ? 'radial-gradient(circle at 35% 35%, var(--color-primary-light), var(--color-primary-dark))'
                : '#bbb',
              cursor: gameState === 'idle' ? 'grab' : gameState === 'pulling' ? 'grabbing' : 'default',
              boxShadow: leverActive ? 'var(--shadow-lg)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              transform: `translateY(${leverDelta}px)`,
              transition: isDragging.current ? 'none' : 'transform 0.35s cubic-bezier(.4,2,.6,1)',
              position: 'relative',
              zIndex: 2,
              touchAction: 'none',
            }}
          >
            🕹️
          </div>

          {/* 기둥 */}
          <div
            style={{
              width: 10,
              flex: 1,
              background: 'linear-gradient(to right, #999, #ccc, #999)',
              borderRadius: 5,
              marginTop: -4,
            }}
          />

          {/* 받침대 */}
          <div
            style={{
              width: 28,
              height: 14,
              background: '#888',
              borderRadius: '50%',
              marginTop: 2,
            }}
          />
        </div>
      </div>

      {gameState === 'idle' && (
        <p style={{ fontSize: 12, color: '#999' }}>손잡이를 잡고 아래로 당기세요</p>
      )}
    </div>
  );
}
