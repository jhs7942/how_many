'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { mulberry32 } from '@/lib/utils';

// SpinWheel — Canvas 2D로 그린 돌림판.
//
// [학습] 왜 div + CSS 회전이 아니라 Canvas 인가?
// 1) 세그먼트 수가 가변(2~10개)이라 매번 SVG 마크업을 만들어 서식하는 것보다 Canvas로 직접 그리는 게 단순하다.
// 2) 결과가 정해진 인덱스로 부드럽게 멈추도록 매 프레임 각도를 미세 조정해야 한다 — DOM 애니메이션으론 어렵다.
// 3) devicePixelRatio 처리로 레티나 디스플레이에서도 또렷하게 그릴 수 있다.

// [학습] forwardRef + useImperativeHandle — "함수형 컴포넌트에서 자식 메서드를 부모에 노출하는 패턴".
// SpinWheel 자체는 상태를 관리하지만, 부모(예: FlowRandomPage)는 "지금 돌려라"라는 명령형 액션이 필요하다.
// 이 두 훅 조합으로 부모는 ref.current.spin() 처럼 호출할 수 있고, 내부 구현은 캡슐화된 채 유지된다.

export interface SpinWheelHandle {
  spin: () => void;
  spinWithSeed: (seed: number, resultIndex: number) => void;
}

interface SpinWheelProps {
  segments: { label: string; emoji: string }[];
  onResult: (result: { label: string; emoji: string }, index: number) => void;
  seed?: number;
  enableRespin?: boolean;
  onRespin?: () => void;
}


const SpinWheel = forwardRef<SpinWheelHandle, SpinWheelProps>(
  ({ segments, onResult, enableRespin, onRespin }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const respinTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    // [학습] 애니메이션 상태를 useRef 에 두는 이유
    // requestAnimationFrame 안에서 매 프레임 currentAngle을 갱신한다. 이를 useState로 두면 매 프레임 재렌더가 일어나
    // Canvas 그리기와 React 렌더가 따로 동작해 끊김이 생긴다. ref 슬롯에 두고 직접 .current를 만지면
    // React는 모르는 채로 Canvas만 새로 그려져서 부드럽다.
    const stateRef = useRef({
      currentAngle: 0,
      isSpinning: false,
      resultIndex: -1,
    });

    // [학습] 컴포넌트 unmount 시 setTimeout 정리 — 메모리 누수와 "이미 떠난 컴포넌트의 콜백 발화" 방지.
    // 빈 의존성 배열 [] 은 "mount/unmount 단 한 번씩만 실행".
    useEffect(() => () => clearTimeout(respinTimerRef.current), []);

    const SIZE = 280;

    // 지정된 인덱스로 부드럽게 회전 → 끝나면 onComplete 호출
    function spinToIndex(resultIndex: number, onComplete: (index: number) => void) {
      if (stateRef.current.isSpinning) return;
      stateRef.current.isSpinning = true;
      stateRef.current.resultIndex = resultIndex;

      // [학습] 목표 각도 계산
      // - arc: 한 세그먼트가 차지하는 각도 (라디안). 360° / count.
      // - targetMid: 결과 인덱스의 "정중앙"이 화살표(위쪽)에 오도록 하는 각도.
      // - extraRotation: 시각적 효과를 위해 5~9바퀴 더 돌게 만든다.
      // - targetAngle: 현재 각도에서 목표 각도까지의 차이 (애니메이션이 보간할 양).
      const count = segments.length;
      const arc = (Math.PI * 2) / count;
      const targetMid = -arc * resultIndex - arc / 2;
      const extraRotation = Math.floor(5 + Math.random() * 4) * Math.PI * 2;
      const targetAngle = targetMid - stateRef.current.currentAngle + extraRotation;

      const duration = 3500;
      const startAngle = stateRef.current.currentAngle;
      const startTime = performance.now();
      // [학습] easeOut — "처음엔 빠르게, 끝으로 갈수록 느리게" 라는 자연스러운 감속 곡선.
      // 1 - (1-t)^k 패턴은 k 값이 클수록 더 늦게까지 빠른 속도를 유지하다 갑자기 멈추는 느낌이 된다.
      // 3.5는 시각적으로 "끼익" 멈추는 듯한 인상을 주기 위해 튜닝된 값.
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3.5);

      // [학습] requestAnimationFrame 루프
      // setInterval 보다 부드럽고 효율적이다 — 브라우저의 화면 갱신 주기(60Hz면 ~16.67ms)에 맞춰 호출.
      // 탭이 백그라운드로 들어가면 자동으로 멈추므로 배터리도 절약된다.
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        stateRef.current.currentAngle = startAngle + targetAngle * easeOut(progress);
        draw(progress === 1 ? resultIndex : -1);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          stateRef.current.isSpinning = false;
          onComplete(resultIndex);
        }
      };

      requestAnimationFrame(animate);
    }

    // [학습] useImperativeHandle — 부모 ref에 노출할 메서드를 정의.
    // 부모가 ref.current.spin() 으로 호출 가능. 내부 helper인 spinToIndex는 노출되지 않아 캡슐화 유지.
    useImperativeHandle(ref, () => ({
      spin() {
        const resultIndex = Math.floor(Math.random() * segments.length);
        spinToIndex(resultIndex, (idx) => {
          // [학습] respin 효과 — 50% 확률로 "어 잠깐, 다시 뽑자!" 연출.
          // 게임성을 높이기 위한 의도적 인터랙션. 사용자에게 "운명이 바뀌는 듯한" 긴장감을 준다.
          if (enableRespin && Math.random() < 0.5) {
            onRespin?.();
            respinTimerRef.current = setTimeout(() => {
              const newIndex = Math.floor(Math.random() * segments.length);
              spinToIndex(newIndex, (finalIdx) => {
                onResult(segments[finalIdx], finalIdx);
              });
            }, 600);
          } else {
            onResult(segments[idx], idx);
          }
        });
      },
      spinWithSeed(seed: number, resultIndex: number) {
        // seed는 참여자 동기화용 (결과는 resultIndex로 결정)
        //
        // [학습] 그룹 플로우 동기화의 핵심
        // 방장의 디바이스에서 결정된 (seed, resultIndex) 쌍을 random_events 에 INSERT 하면
        // 모든 참여자의 useRandomEvent가 그 값을 받아 이 메서드를 호출 → 동일한 결과로 멈춘다.
        // seed는 mulberry32 첫 호출을 "소비"하는 용도로만 쓰이고, 실제 정지 인덱스는 resultIndex로 강제.
        const rng = mulberry32(seed);
        rng(); // seed 소비
        spinToIndex(resultIndex, (idx) => {
          onResult(segments[idx], idx);
        });
      },
    }));

    // 휠을 한 프레임 그린다. highlightIndex 가 0 이상이면 그 세그먼트를 강조색으로.
    //
    // [학습] devicePixelRatio (dpr) 처리
    // 레티나 디스플레이는 CSS 1px 당 실제 픽셀이 2~3개. canvas.width/height 를 dpr 배로 키우고,
    // 모든 좌표·반경에 dpr 을 곱하면 또렷한 그래픽이 나온다.
    // 이 처리를 빼먹으면 Canvas만 흐릿하게 보이는 흔한 버그가 발생.
    function draw(highlightIndex: number = -1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const r = cx - 4;
      const count = segments.length;
      const arc = (Math.PI * 2) / count;

      ctx.clearRect(0, 0, SIZE * dpr, SIZE * dpr);

      // 외곽 그림자 (휠 떠오른 느낌)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx * dpr, cy * dpr, (r + 4) * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(255,122,61,0.2)';
      ctx.shadowBlur = 16 * dpr;
      ctx.fill();
      ctx.restore();

      // 세그먼트(부채꼴) 그리기
      segments.forEach((seg, i) => {
        // [학습] 각 세그먼트의 시작/끝 각도
        // -Math.PI/2 (12시 방향)을 기준으로, 현재 회전(currentAngle) + 인덱스 * arc 만큼 더한다.
        // canvas 좌표계는 +x가 오른쪽, +y가 아래이므로 라디안 0이 3시 방향 → -π/2 보정으로 12시 정렬.
        const startAngle = stateRef.current.currentAngle + arc * i - Math.PI / 2;
        const endAngle = startAngle + arc;
        const isHighlight = i === highlightIndex;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx * dpr, cy * dpr);
        ctx.arc(cx * dpr, cy * dpr, r * dpr, startAngle, endAngle);
        ctx.closePath();
        // 격자처럼 두 색을 번갈아 칠해 가독성 ↑. 결과 세그먼트는 강조색으로 덮어씀.
        ctx.fillStyle = isHighlight ? '#FF7A3D' : i % 2 === 0 ? '#FFF7F2' : '#FFD6C2';
        ctx.fill();
        ctx.strokeStyle = '#FF7A3D';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
        ctx.restore();

        // 텍스트(이모지 + 라벨)는 부채꼴 중앙에서 살짝 안쪽으로 배치.
        const midAngle = startAngle + arc / 2;
        const textR = r * 0.62;
        const tx = cx + textR * Math.cos(midAngle);
        const ty = cy + textR * Math.sin(midAngle);

        ctx.save();
        ctx.translate(tx * dpr, ty * dpr);
        // [학습] 텍스트를 세그먼트 방향에 맞춰 회전
        // midAngle + π/2 = "방사 방향에 수직" — 글자가 휠 중심에서 바깥을 향해 똑바로 서 있는 모양.
        ctx.rotate(midAngle + Math.PI / 2);

        ctx.font = `${Math.min(22, (SIZE / count) * 0.55) * dpr}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(seg.emoji, 0, -12 * dpr);

        ctx.font = `bold ${Math.min(12, (SIZE / count) * 0.28) * dpr}px Pretendard, sans-serif`;
        ctx.fillStyle = isHighlight ? '#fff' : '#2E2E2E';
        const maxWidth = r * 0.7 * dpr;
        ctx.fillText(seg.label, 0, 8 * dpr, maxWidth);
        ctx.restore();
      });

      // 중앙 원형 캡 (휠 가운데 장식)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx * dpr, cy * dpr, 22 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#FF7A3D';
      ctx.shadowColor = 'rgba(255,122,61,0.4)';
      ctx.shadowBlur = 8 * dpr;
      ctx.fill();
      ctx.restore();
    }

    // segments 가 바뀌면 캔버스 크기를 dpr 기준으로 다시 잡고 한 번 그린다.
    //
    // [학습] eslint-disable-next-line react-hooks/exhaustive-deps
    // ESLint는 effect 안에서 쓰는 모든 변수를 의존성에 넣으라고 잔소리한다.
    // 하지만 draw() 같이 매 렌더 다시 만들어지는 함수까지 다 넣으면 effect가 매 렌더마다 돌아 무한 루프가 된다.
    // 이런 경우 "정말로 segments 변화에만 반응하면 충분" 임을 개발자가 판단했음을 명시적으로 비활성화한다.
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = SIZE * dpr;
      canvas.height = SIZE * dpr;
      canvas.style.width = SIZE + 'px';
      canvas.style.height = SIZE + 'px';
      draw(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segments]);

    return (
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <canvas
          ref={canvasRef}
          style={{ borderRadius: '50%', boxShadow: 'var(--shadow-lg)' }}
        />
        {/* 휠 위쪽의 삼각형 화살표 — CSS border 트릭으로 만들어졌다.
            border-left/right 를 transparent 로, border-top 만 색을 입히면 ▼ 모양이 그려진다. */}
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '24px solid #FF7A3D',
            filter: 'drop-shadow(0 3px 6px rgba(255,122,61,0.5))',
            zIndex: 2,
          }}
        />
      </div>
    );
  }
);

// [학습] forwardRef 컴포넌트의 React DevTools 표시명
// 지정하지 않으면 "Anonymous" 로 보여서 디버깅이 어려워진다.
SpinWheel.displayName = 'SpinWheel';
export default SpinWheel;
