'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Android 하드웨어 뒤로가기 버튼 처리
// canGoBack === true 이면 router.back(), false 이면 기본 동작(앱 종료) 허용
export default function AndroidBackHandler() {
  const router = useRouter();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    import('@capacitor/app').then(({ App }) => {
      const handlePromise = App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) router.back();
      });
      handlePromise.then((h) => {
        cleanup = () => h.remove();
      });
    }).catch(() => {}); // 웹 환경 무시

    return () => { cleanup?.(); };
  }, [router]);

  return null;
}
