'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';

export default function GroupVotePage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [candidates, setCandidates] = useState<{ label: string; emoji: string }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [voted, setVoted] = useState(false);
  const [nickname, setNickname] = useState('');
  const [myEmoji, setMyEmoji] = useState('🐯');

  useEffect(() => {
    const cands = session.get<{ label: string; emoji: string }[]>('candidates');
    const nick = session.get<string>('myNickname');
    const emoji = session.get<string>('myEmoji');
    if (!cands) {
      router.replace('/group/create');
      return;
    }
    setCandidates(cands);
    setNickname(nick ?? '');
    setMyEmoji(emoji ?? '🐯');

    // 이미 투표했는지 확인
    const alreadyVoted = session.get<boolean>('hasVoted');
    if (alreadyVoted) {
      setVoted(true);
    }
  }, [router]);

  const handleVote = () => {
    if (selected === null) {
      showToast('투표할 항목을 선택해주세요');
      return;
    }
    session.set('myVote', candidates[selected]);
    session.set('hasVoted', true);
    setVoted(true);
    showToast('투표가 완료되었어요! 🗳️');
    setTimeout(() => router.push('/group/wait'), 1000);
  };

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href="/group/nickname" />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>투표하기</span>
      </div>

      {/* 스텝 표시 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(step => (
          <div
            key={step}
            style={{
              width: step === 4 ? 20 : 8,
              height: 8,
              borderRadius: step === 4 ? 4 : '50%',
              background: 'var(--color-primary)',
            }}
          />
        ))}
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 내 정보 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{myEmoji}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
              {nickname || '익명'}님의 투표
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              하나를 선택해주세요 (비공개)
            </div>
          </div>
        </div>

        {/* 투표 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {candidates.map((candidate, i) => (
            <button
              key={i}
              onClick={() => !voted && setSelected(i)}
              disabled={voted}
              style={{
                background: selected === i ? 'var(--color-accent)' : 'var(--color-bg-card)',
                border: `2px solid ${selected === i ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 16,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: voted ? 'default' : 'pointer',
                transition: 'all 0.25s',
                boxShadow: 'var(--shadow-DEFAULT)',
                opacity: voted && selected !== i ? 0.6 : 1,
              }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{candidate.emoji}</span>
              <span style={{ fontSize: 17, fontWeight: 700, flex: 1, textAlign: 'left', color: 'var(--color-text)' }}>
                {candidate.label}
              </span>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: `2px solid ${selected === i ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: selected === i ? 'var(--color-primary)' : 'transparent',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected === i && (
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                    <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {voted && (
          <div
            style={{
              background: 'rgba(76,175,80,0.1)',
              borderRadius: 16,
              padding: '14px 20px',
              textAlign: 'center',
              color: 'var(--color-success)',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            ✅ 투표 완료! 다른 친구들을 기다리는 중...
          </div>
        )}
      </div>

      {/* 투표 버튼 */}
      {!voted && (
        <div style={{ paddingTop: 24 }}>
          <button
            onClick={handleVote}
            style={{
              width: '100%',
              padding: '18px 28px',
              borderRadius: 9999,
              background: selected !== null ? 'var(--color-primary)' : 'rgba(255,122,61,0.4)',
              color: '#fff',
              fontSize: 18,
              fontWeight: 700,
              boxShadow: selected !== null ? '0 4px 16px rgba(255,122,61,0.35)' : 'none',
              cursor: selected !== null ? 'pointer' : 'not-allowed',
            }}
          >
            투표 완료 🗳️
          </button>
        </div>
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </PageLayout>
  );
}
