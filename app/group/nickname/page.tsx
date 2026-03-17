'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';

const EMOJI_OPTIONS = ['🐯', '🦊', '🐧', '🐰', '🦁', '🐸', '🦋', '🐬', '🦄', '🐼'];

export default function GroupNicknamePage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [nickname, setNickname] = useState('');

  const handleJoin = () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      showToast('닉네임을 입력해주세요');
      return;
    }
    session.set('myNickname', trimmed);
    session.set('myEmoji', selectedEmoji);
    router.push('/group/vote');
  };

  const roomCode = session.get<string>('roomCode') ?? '------';

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href="/group/invite" />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>닉네임 설정</span>
      </div>

      {/* 스텝 표시 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(step => (
          <div
            key={step}
            style={{
              width: step === 3 ? 20 : 8,
              height: 8,
              borderRadius: step === 3 ? 4 : '50%',
              background: step <= 3 ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          />
        ))}
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>
            나를 소개해요!
          </h2>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'var(--color-accent)',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-primary-dark)',
              marginTop: 4,
            }}
          >
            방 코드: {roomCode}
          </div>
        </div>

        {/* 이모지 선택 */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            나의 이모지
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(emoji)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 16,
                  background: selectedEmoji === emoji ? 'var(--color-accent)' : 'var(--color-bg-card)',
                  border: `2px solid ${selectedEmoji === emoji ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  fontSize: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  boxShadow: 'var(--shadow-DEFAULT)',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* 닉네임 입력 */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            닉네임 (최대 8자)
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              border: '2px solid var(--color-border)',
              borderRadius: 16,
              background: 'var(--color-bg-card)',
              transition: 'border-color 0.25s',
            }}
          >
            <span style={{ fontSize: 24 }}>{selectedEmoji}</span>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value.slice(0, 8))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="닉네임 입력..."
              style={{
                flex: 1,
                fontSize: 16,
                color: 'var(--color-text)',
                background: 'transparent',
                border: 'none',
              }}
              onFocus={e => (e.currentTarget.parentElement!.style.borderColor = 'var(--color-primary)')}
              onBlur={e => (e.currentTarget.parentElement!.style.borderColor = 'var(--color-border)')}
            />
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {nickname.length}/8
            </span>
          </div>
        </div>
      </div>

      {/* 입장 버튼 */}
      <div style={{ paddingTop: 24 }}>
        <button
          onClick={handleJoin}
          style={{
            width: '100%',
            padding: '18px 28px',
            borderRadius: 9999,
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(255,122,61,0.35)',
          }}
        >
          투표하러 가기 →
        </button>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </PageLayout>
  );
}
