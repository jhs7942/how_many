'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface SpinWheelHandle {
  spin: () => void;
}

interface SpinWheelProps {
  segments: { label: string; emoji: string }[];
  onResult: (result: { label: string; emoji: string }) => void;
}

const SpinWheel = forwardRef<SpinWheelHandle, SpinWheelProps>(({ segments, onResult }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    currentAngle: 0,
    isSpinning: false,
    resultIndex: -1,
  });

  const SIZE = 280;

  useImperativeHandle(ref, () => ({
    spin() {
      if (stateRef.current.isSpinning) return;
      stateRef.current.isSpinning = true;

      const count = segments.length;
      const arc = (Math.PI * 2) / count;

      // 결과 랜덤 결정
      const resultIndex = Math.floor(Math.random() * count);
      stateRef.current.resultIndex = resultIndex;

      // 포인터(위쪽)가 가리키는 각도 계산
      const targetMid = -arc * resultIndex - arc / 2;
      const extraRotation = (5 + Math.random() * 3) * Math.PI * 2;
      const targetAngle = targetMid - stateRef.current.currentAngle + extraRotation;

      const duration = 3500;
      const startAngle = stateRef.current.currentAngle;
      const startTime = performance.now();

      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3.5);

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOut(progress);

        stateRef.current.currentAngle = startAngle + targetAngle * eased;
        draw(progress === 1 ? resultIndex : -1);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          stateRef.current.isSpinning = false;
          draw(resultIndex);
          onResult(segments[resultIndex]);
        }
      };

      requestAnimationFrame(animate);
    },
  }));

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

    // 배경 원
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx * dpr, cy * dpr, (r + 4) * dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,122,61,0.2)';
    ctx.shadowBlur = 16 * dpr;
    ctx.fill();
    ctx.restore();

    segments.forEach((seg, i) => {
      const startAngle = stateRef.current.currentAngle + arc * i - Math.PI / 2;
      const endAngle = startAngle + arc;
      const isHighlight = i === highlightIndex;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx * dpr, cy * dpr);
      ctx.arc(cx * dpr, cy * dpr, r * dpr, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = isHighlight
        ? '#FF7A3D'
        : i % 2 === 0 ? '#FFF7F2' : '#FFD6C2';
      ctx.fill();
      ctx.strokeStyle = '#FF7A3D';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
      ctx.restore();

      // 텍스트
      const midAngle = startAngle + arc / 2;
      const textR = r * 0.62;
      const tx = cx + textR * Math.cos(midAngle);
      const ty = cy + textR * Math.sin(midAngle);

      ctx.save();
      ctx.translate(tx * dpr, ty * dpr);
      ctx.rotate(midAngle + Math.PI / 2);

      // 이모지
      ctx.font = `${Math.min(22, SIZE / count * 0.55) * dpr}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(seg.emoji, 0, -12 * dpr);

      // 레이블
      ctx.font = `bold ${Math.min(12, SIZE / count * 0.28) * dpr}px Pretendard, sans-serif`;
      ctx.fillStyle = isHighlight ? '#fff' : '#2E2E2E';
      ctx.fillText(seg.label, 0, 8 * dpr);
      ctx.restore();
    });

    // 중앙 원
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx * dpr, cy * dpr, 22 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#FF7A3D';
    ctx.shadowColor = 'rgba(255,122,61,0.4)';
    ctx.shadowBlur = 8 * dpr;
    ctx.fill();
    ctx.restore();
  }

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
        style={{
          borderRadius: '50%',
          boxShadow: 'var(--shadow-lg)',
        }}
      />
      {/* 포인터 */}
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
});

SpinWheel.displayName = 'SpinWheel';
export default SpinWheel;
