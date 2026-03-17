'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';
import { generateRoomCode } from '@/lib/utils';

const PEOPLE_OPTIONS = [
  { count: 2, emoji: '👫' },
  { count: 3, emoji: '👥' },
  { count: 4, emoji: '👨‍👩‍👧‍👦' },
  { count: 5, emoji: '🫂' },
  { count: 6, emoji: '🎉' },
];

const DEFAULT_CANDIDATES = [
  { label: '보드게임', emoji: '🎲' },
  { label: '노래방', emoji: '🎤' },
  { label: '방탈출', emoji: '🔐' },
  { label: '볼링', emoji: '🎳' },
];

export default function GroupCreatePage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [selectedPeople, setSelectedPeople] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<{ label: string; emoji: string }[]>(DEFAULT_CANDIDATES);
  const [inputValue, setInputValue] = useState('');

  const handleAddCandidate = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (candidates.length >= 5) {
      showToast('후보는 최대 5개까지 추가할 수 있어요');
      return;
    }
    if (candidates.some(c => c.label === trimmed)) {
      showToast('이미 추가된 후보예요');
      return;
    }
    setCandidates(prev => [...prev, { label: trimmed, emoji: '📌' }]);
    setInputValue('');
  };

  const handleRemoveCandidate = (index: number) => {
    setCandidates(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (!selectedPeople) {
      showToast('인원을 선택해주세요');
      return;
    }
    if (candidates.length < 2) {
      showToast('후보를 최소 2개 이상 추가해주세요');
      return;
    }
    const roomCode = generateRoomCode();
    session.set('roomCode', roomCode);
    session.set('roomPeople', selectedPeople);
    session.set('candidates', candidates);
    router.push('/group/invite');
  };

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href="/" />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>투표 방 만들기</span>
      </div>

      {/* 스텝 표시 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(step => (
          <div
            key={step}
            style={{
              width: step === 1 ? 20 : 8,
              height: 8,
              borderRadius: step === 1 ? 4 : '50%',
              background: step === 1 ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          />
        ))}
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 인원 선택 */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            👥 참여 인원
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {PEOPLE_OPTIONS.map(({ count, emoji }) => (
              <button
                key={count}
                onClick={() => setSelectedPeople(count)}
                style={{
                  padding: '10px 6px',
                  borderRadius: 10,
                  background: selectedPeople === count ? 'var(--color-accent)' : 'var(--color-bg-card)',
                  border: `2px solid ${selectedPeople === count ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-DEFAULT)',
                  transition: 'all 0.25s',
                }}
              >
                <span style={{ fontSize: 18 }}>{emoji}</span>
                <span>{count}명</span>
              </button>
            ))}
          </div>
        </div>

        {/* 후보 관리 */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            🗳️ 투표 후보 ({candidates.length}/5)
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 40, padding: '4px 0', marginBottom: 12 }}>
            {candidates.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 9999,
                  fontSize: 14,
                  fontWeight: 600,
                  background: 'var(--color-accent)',
                  color: 'var(--color-primary-dark)',
                  border: '1.5px solid var(--color-primary)',
                }}
              >
                <span>{c.emoji} {c.label}</span>
                <span
                  onClick={() => handleRemoveCandidate(i)}
                  style={{ fontSize: 16, lineHeight: 1, cursor: 'pointer', opacity: 0.7 }}
                >
                  ×
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCandidate()}
              placeholder="후보 직접 추가..."
              maxLength={10}
              style={{
                flex: 1,
                padding: '14px 18px',
                border: '2px solid var(--color-border)',
                borderRadius: 16,
                fontSize: 16,
                color: 'var(--color-text)',
                background: 'var(--color-bg-card)',
                transition: 'border-color 0.25s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            />
            <button
              onClick={handleAddCandidate}
              style={{
                padding: '14px 18px',
                borderRadius: 16,
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              추가
            </button>
          </div>
        </div>
      </div>

      {/* 생성 버튼 */}
      <div style={{ paddingTop: 24 }}>
        <button
          onClick={handleCreate}
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
          투표 방 만들기 🎉
        </button>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </PageLayout>
  );
}
