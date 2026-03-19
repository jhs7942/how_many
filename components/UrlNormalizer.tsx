'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// 페이지가 바뀌어도 URL을 항상 /로 고정
export default function UrlNormalizer() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
    }
  }, [pathname]);
  return null;
}
