'use client';

import { useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// --- 타입 ---
export interface ShareCardData {
  emoji: string;
  label: string;
  tip?: string;
}

export type ShareError =
  | { kind: 'render_failed'; cause: unknown }
  | { kind: 'permission_denied' }
  | { kind: 'save_failed'; cause: unknown }
  | { kind: 'share_unsupported' };

export interface UseShareImageReturn {
  generate: (node: HTMLElement) => Promise<Blob>;
  share: (blob: Blob, filename?: string) => Promise<void>;
  isGenerating: boolean;
  isSharing: boolean;
  error: ShareError | null;
}

// Blob -> base64 변환 (Capacitor Filesystem용)
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // data:image/png;base64, 접두사 제거
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 공유 카드 이미지 생성 + 공유 공용 훅
 * Solo/Food/Group 어디서든 사용 가능한 공용 설계
 *
 * generate: ShareCard ref의 DOM 노드를 받아 PNG Blob 생성
 * share: Blob을 네이티브 Share Sheet 또는 웹 다운로드로 전달
 */
export function useShareImage(): UseShareImageReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<ShareError | null>(null);

  // --- 이미지 생성 ---
  const generate = useCallback(async (node: HTMLElement): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);
    try {
      // 동적 import로 초기 번들에서 제외
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(node, {
        width: 1080,
        height: 1080,
        pixelRatio: 1,
        // CORS 이슈 방지 — 외부 이미지 미사용
        skipAutoScale: true,
        cacheBust: false,
      });
      if (!blob) {
        throw new Error('toBlob returned null');
      }
      return blob;
    } catch (cause) {
      const err: ShareError = { kind: 'render_failed', cause };
      setError(err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // --- 공유 ---
  const share = useCallback(async (blob: Blob, filename = 'howmany-share.png') => {
    setIsSharing(true);
    setError(null);
    try {
      const isNative = Capacitor.getPlatform() !== 'web';

      if (isNative) {
        // Capacitor 환경: Cache에 임시 저장 -> Share Sheet -> 삭제
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');
        const base64 = await blobToBase64(blob);

        let uri: string;
        try {
          const result = await Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: Directory.Cache,
          });
          uri = result.uri;
        } catch (cause) {
          const err: ShareError = { kind: 'save_failed', cause };
          setError(err);
          throw err;
        }

        try {
          await Share.share({
            files: [uri],
            dialogTitle: '결과 공유',
          });
        } catch {
          // 사용자가 Share Sheet를 닫은 경우 (취소)
          setError({ kind: 'permission_denied' });
        }

        // 임시 파일 정리 (실패해도 무시)
        try {
          await Filesystem.deleteFile({ path: filename, directory: Directory.Cache });
        } catch { /* 정리 실패 무시 */ }
      } else {
        // 웹 환경: navigator.share 또는 <a download> fallback
        const file = new File([blob], filename, { type: 'image/png' });

        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file] });
          } catch {
            // 사용자가 Share Sheet를 닫은 경우
            setError({ kind: 'permission_denied' });
          }
        } else {
          // <a download> fallback
          try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch {
            const err: ShareError = { kind: 'share_unsupported' };
            setError(err);
            throw err;
          }
        }
      }
    } finally {
      setIsSharing(false);
    }
  }, []);

  return { generate, share, isGenerating, isSharing, error };
}
