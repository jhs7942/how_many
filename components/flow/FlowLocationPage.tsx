'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import BackButton from '@/components/BackButton';
import { session } from '@/lib/session';

interface FlowLocationPageProps {
  backHref: string;
  nextHref: string;
  sessionKey: string; // 예: 'soloLocation' | 'foodLocation'
}

// 위치 입력 화면 (선택, 건너뛰기 가능)
// solo/location, food/location 양쪽에서 사용
export default function FlowLocationPage({
  backHref,
  nextHref,
  sessionKey,
}: FlowLocationPageProps) {
  const router = useRouter();
  const [location, setLocation] = useState('');

  function proceed(loc: string | null) {
    session.set(sessionKey, loc);
    router.push(nextHref);
  }

  return (
    <PageLayout>
      <div style={{ paddingTop: 20 }}>
        <BackButton href={backHref} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📍</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-text)', marginBottom: 8 }}>
            어디서 하실 건가요?
          </h1>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
            위치를 입력하면 결과에서<br />지도 검색 링크를 제공해요
          </p>
        </div>

        <div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && proceed(location.trim() || null)}
            placeholder="예: 강남역, 홍대, 서울 마포구..."
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 14,
              border: '1.5px solid var(--color-border)',
              fontSize: 15,
              background: '#fff',
              color: 'var(--color-text)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => proceed(location.trim() || null)}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 14,
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            {location.trim() ? '다음' : '건너뛰기'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
