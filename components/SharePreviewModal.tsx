'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface SharePreviewModalProps {
  blob: Blob | null;    // null이면 생성 중
  onConfirm: () => void; // Share Sheet 트리거
  onClose: () => void;
  isSharing: boolean;    // 공유 중 버튼 disabled
}

// 공유 전 미리보기 모달
// NF3 접근성: 포커스 트랩 + ESC 닫기 + 외곽 클릭 닫기
export default function SharePreviewModal({
  blob,
  onConfirm,
  onClose,
  isSharing,
}: SharePreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // blob을 ObjectURL로 변환 — 생성과 정리를 하나의 useEffect에서 처리
  // useMemo+useEffect 조합은 Strict Mode에서 revoke 타이밍 갭 발생 가능
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  // 포커스 트랩: 모달 열릴 때 확인 버튼에 포커스
  useEffect(() => {
    if (blob && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [blob]);

  // ESC 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // 포커스 트랩: Tab 키가 모달 밖으로 나가지 않도록
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 외곽 클릭 닫기
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="공유 미리보기"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        padding: 20,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: 20,
          maxWidth: 360,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        {/* 미리보기 이미지 */}
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #FF7A3D 0%, #FF9A6C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="공유 카드 미리보기"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            // 생성 중 스피너
            <div
              role="status"
              aria-label="이미지 생성 중"
              style={{
                width: 40,
                height: 40,
                border: '4px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          )}
        </div>

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              background: '#F0F0F0',
              color: '#666',
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={!blob || isSharing}
            aria-label="공유하기"
            style={{
              flex: 2,
              padding: '14px',
              borderRadius: 12,
              background: (!blob || isSharing)
                ? '#ccc'
                : 'var(--color-primary)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 800,
              border: 'none',
              cursor: (!blob || isSharing) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isSharing ? (
              <>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                공유 중...
              </>
            ) : (
              '공유하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
