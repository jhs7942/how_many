'use client';

import { useState, useEffect } from 'react';
import { session } from '@/lib/session';

const COLOR_ITEMS = [
  { label: '주조색', variable: '--color-primary', defaultValue: '#FF7A3D' },
  { label: '주조색(밝게)', variable: '--color-primary-light', defaultValue: '#FF9A6C' },
  { label: '주조색(어둡게)', variable: '--color-primary-dark', defaultValue: '#E55A1A' },
  { label: '배경', variable: '--color-bg', defaultValue: '#FFF7F2' },
  { label: '강조 배경', variable: '--color-accent', defaultValue: '#FFD6C2' },
  { label: '테두리', variable: '--color-border', defaultValue: '#F0E0D6' },
];

type ColorMap = Record<string, string>;

const getDefaults = (): ColorMap =>
  Object.fromEntries(COLOR_ITEMS.map(({ variable, defaultValue }) => [variable, defaultValue]));

function applyColors(colors: ColorMap) {
  Object.entries(colors).forEach(([variable, value]) => {
    document.documentElement.style.setProperty(variable, value);
  });
}

function resetColors() {
  COLOR_ITEMS.forEach(({ variable }) => {
    document.documentElement.style.removeProperty(variable);
  });
}

export default function PaletteDevTool() {
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState<ColorMap>(getDefaults());

  useEffect(() => {
    const saved = session.get<ColorMap>('devColors');
    if (saved) {
      setColors(saved);
      applyColors(saved);
    }
  }, []);

  const handleChange = (variable: string, value: string) => {
    const next = { ...colors, [variable]: value };
    setColors(next);
    document.documentElement.style.setProperty(variable, value);
    session.set('devColors', next);
  };

  const handleReset = () => {
    resetColors();
    const defaults = getDefaults();
    setColors(defaults);
    session.remove('devColors');
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, fontFamily: 'monospace' }}>
      {open && (
        <div
          style={{
            marginBottom: 8,
            background: '#1a1a1a',
            color: '#f0f0f0',
            borderRadius: 12,
            padding: '12px 14px',
            width: 260,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {/* 뱃지 */}
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                background: '#ff4444',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 4,
                padding: '2px 6px',
                letterSpacing: '0.05em',
              }}
            >
              🧪 테스트 기능
            </span>
            <span style={{ fontSize: 11, color: '#888' }}>색상 팔레트</span>
          </div>

          {/* 색상 항목 */}
          {COLOR_ITEMS.map(({ label, variable }) => (
            <div
              key={variable}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#ccc', flex: 1 }}>{label}</span>
              <input
                type="color"
                value={colors[variable]}
                onChange={(e) => handleChange(variable, e.target.value)}
                style={{
                  width: 28,
                  height: 28,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  padding: 0,
                  background: 'none',
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: '#888',
                  marginLeft: 6,
                  width: 60,
                  textAlign: 'right',
                }}
              >
                {colors[variable]}
              </span>
            </div>
          ))}

          {/* 초기화 버튼 */}
          <button
            onClick={handleReset}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '6px 0',
              background: '#333',
              color: '#ccc',
              border: '1px solid #444',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            초기화 (기본값 복원)
          </button>
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="색상 팔레트 테스트"
        style={{
          display: 'block',
          marginLeft: 'auto',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#1a1a1a',
          color: '#fff',
          border: 'none',
          fontSize: 20,
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
        }}
      >
        🎨
      </button>
    </div>
  );
}
