'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';
import { getClientId } from '@/lib/clientId';
import {
  getRoomCandidates,
  getParticipant,
  updateLastSeen,
} from '@/lib/api/rooms';
import { castVote, getMyVote } from '@/lib/api/votes';
import type { RoomCandidate } from '@/lib/types';

export default function GroupVotePage() {
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<RoomCandidate[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // candidateId
  const [voted, setVoted] = useState(false);
  const [myParticipant, setMyParticipant] = useState<{ id: string; nickname: string; emoji: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const lastSeenTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function init() {
      const id = session.get<string>('roomId');
      if (!id) { router.replace('/'); return; }
      setRoomId(id);

      const clientId = getClientId();
      const [cands, participant] = await Promise.all([
        getRoomCandidates(id),
        getParticipant(id, clientId),
      ]);

      if (!participant) { router.replace('/group/lobby'); return; }
      setCandidates(cands);
      setMyParticipant(participant);

      // 이미 투표했는지 확인
      const existing = await getMyVote(id, participant.id);
      if (existing) {
        setSelected(existing.candidate_id);
        setVoted(true);
        setTimeout(() => router.push('/group/vote-status'), 500);
      }
    }
    init();
  }, [router]);

  // last_seen 업데이트
  useEffect(() => {
    if (!myParticipant) return;
    const update = () => updateLastSeen(myParticipant.id);
    update();
    lastSeenTimerRef.current = setInterval(update, 10000);
    return () => { if (lastSeenTimerRef.current) clearInterval(lastSeenTimerRef.current); };
  }, [myParticipant]);

  async function handleVote() {
    if (!selected || !myParticipant || !roomId) {
      showToast('투표할 항목을 선택해주세요');
      return;
    }
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch { /* 웹 환경 무시 */ }
    setLoading(true);
    try {
      await castVote(roomId, myParticipant.id, selected);
      setVoted(true);
      showToast('투표 완료! 🗳️');
      setTimeout(() => router.push('/group/vote-status'), 1000);
    } catch {
      showToast('투표에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <div style={{ paddingTop: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)' }}>투표하기</h1>
        {myParticipant && (
          <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
            {myParticipant.emoji} {myParticipant.nickname}님, 하나를 선택해주세요 (비공개)
          </p>
        )}
      </div>

      <div
        onScroll={(e) => { if (e.currentTarget.scrollLeft !== 0) e.currentTarget.scrollLeft = 0; }}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20, overflowY: 'auto', overflowX: 'hidden', maxWidth: 'calc(100vw - 40px)' }}
      >
        {candidates.map((c) => (
          <button
            key={c.id}
            data-testid={`candidate-button-${c.id}`}
            onClick={() => !voted && setSelected(c.id)}
            disabled={voted}
            style={{
              background: selected === c.id ? 'var(--color-accent)' : '#fff',
              border: `2px solid ${selected === c.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: voted ? 'default' : 'pointer',
              boxShadow: 'var(--shadow)',
              opacity: voted && selected !== c.id ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: 28 }}>{c.emoji}</span>
            <span style={{ fontSize: 17, fontWeight: 700, flex: 1, textAlign: 'left', color: 'var(--color-text)' }}>
              {c.label}
            </span>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: `2px solid ${selected === c.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: selected === c.id ? 'var(--color-primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {selected === c.id && (
                <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                  <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {!voted && (
        <button
          data-testid="btn-vote-submit"
          onClick={handleVote}
          disabled={!selected || loading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            border: 'none',
            background: selected && !loading ? 'var(--color-primary)' : '#ddd',
            color: selected && !loading ? '#fff' : '#aaa',
            fontWeight: 800,
            fontSize: 17,
            cursor: selected && !loading ? 'pointer' : 'not-allowed',
            marginTop: 16,
            boxShadow: selected ? 'var(--shadow-lg)' : 'none',
          }}
        >
          {loading ? '처리 중...' : '투표 완료 🗳️'}
        </button>
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </PageLayout>
  );
}
