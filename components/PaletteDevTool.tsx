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
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    const saved = session.get<ColorMap>('devColors');
    if (saved) {
      setColors(saved);
      applyColors(saved);
    }
    setTestMode(sessionStorage.getItem('devTestMode') === 'true');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function toggleTestMode() {
    const next = !testMode;
    setTestMode(next);
    if (next) {
      sessionStorage.setItem('devTestMode', 'true');
    } else {
      sessionStorage.removeItem('devTestMode');
    }
  }

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

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, fontFamily: 'monospace' }}>
      <div
        style={{
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
          <span style={{ fontSize: 11, color: '#888' }}>색상 팔레트 (F10)</span>
        </div>

        {/* 테스트 모드 토글 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: testMode ? '#1a3a1a' : '#2a2a2a',
            border: `1px solid ${testMode ? '#4caf50' : '#444'}`,
            borderRadius: 8,
            padding: '8px 10px',
            marginBottom: 12,
          }}
        >
          <div>
            <span style={{ fontSize: 12, color: testMode ? '#4caf50' : '#888', fontWeight: 700 }}>
              🎮 게임 타입 선택 모드
            </span>
            <p style={{ fontSize: 10, color: '#666', margin: '2px 0 0' }}>
              {testMode ? '/solo/random 진입 시 게임 선택 화면 표시' : '꺼짐 — 랜덤 자동 선택'}
            </p>
          </div>
          <button
            onClick={toggleTestMode}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              background: testMode ? '#4caf50' : '#444',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            {testMode ? 'ON' : 'OFF'}
          </button>
        </div>

        <div style={{ height: 1, background: '#333', marginBottom: 10 }} />

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
    </div>
  );
}
