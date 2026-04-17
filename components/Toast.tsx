'use client';

import { useRef, useState, useCallback } from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      data-testid="toast-message"
      style={{
        position: 'fixed',
        bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '80px'})`,
        background: 'rgba(46, 46, 46, 0.92)',
        color: '#fff',
        padding: '12px 22px',
        borderRadius: 9999,
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 999,
        pointerEvents: 'none',
        maxWidth: 'calc(100% - 40px)',
      }}
    >
      {message}
    </div>
  );
}

// 전역 토스트 훅
export function useToast() {
  const [toast, setToast] = useState({ message: '', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, duration = 2000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = setTimeout(
      () => setToast(prev => ({ ...prev, visible: false })),
      duration
    );
  }, []);

  return { toast, showToast };
}
