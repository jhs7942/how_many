'use client';

import { useState } from 'react';

interface NicknameInputProps {
  onConfirm: (nickname: string, emoji: string) => void;
  loading?: boolean;
}

const EMOJIS = ['😊', '🐱', '🐶', '🦊', '🐸', '🐷', '🦁', '🐯', '🐻', '🐨'];

export default function NicknameInput({ onConfirm, loading = false }: NicknameInputProps) {
  const [nickname, setNickname] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '0 20px',
      }}
    >
      <div
        style={{
          background: 'var(--color-bg)',
          borderRadius: 20,
          padding: 28,
          width: '100%',
          maxWidth: 380,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 20 }}>
          닉네임 설정
        </h2>

        {/* 이모지 선택 */}
        <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>이모지 선택</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: emoji === e ? '2.5px solid var(--color-primary)' : '2px solid transparent',
                background: emoji === e ? 'var(--color-accent)' : '#f0f0f0',
                fontSize: 22,
                cursor: 'pointer',
              }}
            >
              {e}
            </button>
          ))}
        </div>

        {/* 닉네임 입력 */}
        <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>닉네임</p>
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 8))}
            onKeyDown={(e) => e.key === 'Enter' && nickname.trim() && onConfirm(nickname.trim(), emoji)}
            placeholder="닉네임을 입력하세요"
            style={{
              width: '100%',
              padding: '12px 44px 12px 14px',
              borderRadius: 12,
              border: '1.5px solid var(--color-border)',
              fontSize: 15,
              background: '#fff',
              color: 'var(--color-text)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 12,
              color: '#aaa',
            }}
          >
            {nickname.length}/8
          </span>
        </div>

        <button
          onClick={() => nickname.trim() && onConfirm(nickname.trim(), emoji)}
          disabled={!nickname.trim() || loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            border: 'none',
            background: nickname.trim() && !loading ? 'var(--color-primary)' : '#ddd',
            color: nickname.trim() && !loading ? '#fff' : '#aaa',
            fontWeight: 800,
            fontSize: 16,
            cursor: nickname.trim() && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? '입장 중...' : '입장하기'}
        </button>
      </div>
    </div>
  );
}
