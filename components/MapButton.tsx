'use client';

import { openMap, type MapService } from '@/lib/utils';

interface MapButtonProps {
  service: MapService;
  query: string;
  testId?: string;
  onBlocked?: () => void;
}

const SERVICE_STYLE: Record<MapService, { background: string; color: string; label: string }> = {
  kakao: { background: '#FAE100', color: '#3C1E1E', label: '🗺️ 카카오지도' },
  naver: { background: '#03C75A', color: '#fff', label: '🗺️ 네이버지도' },
};

export default function MapButton({ service, query, testId, onBlocked }: MapButtonProps) {
  const style = SERVICE_STYLE[service];
  const handleClick = () => {
    const ok = openMap(service, query);
    if (!ok) onBlocked?.();
  };
  return (
    <button
      data-testid={testId ?? `btn-map-${service}`}
      onClick={handleClick}
      style={{
        flex: 1,
        padding: '14px 16px',
        borderRadius: 16,
        background: style.background,
        color: style.color,
        fontSize: 14,
        fontWeight: 700,
        border: 'none',
        cursor: 'pointer',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {style.label}
    </button>
  );
}
