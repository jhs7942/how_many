'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useVoteTimer } from '@/lib/hooks/useVoteTimer';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { session } from '@/lib/session';
import { getClientId } from '@/lib/clientId';
import {
  getRoomById,
  getRoomCandidates,
  getParticipant,
  updateLastSeen,
  updateRoomStatus,
} from '@/lib/api/rooms';
import { useVoteStatus } from '@/lib/hooks/useVoteStatus';
import { useRoomSubscription } from '@/lib/hooks/useRoomSubscription';
import { saveResult } from '@/lib/api/results';
import type { RoomCandidate } from '@/lib/types';

export default function GroupVoteStatusPage() {
  const router = useRouter();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<RoomCandidate[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState(300);
  const [closing, setClosing] = useState(false);
  const lastSeenTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closedRef = useRef(false);

  const { timeLeft, startTimer } = useVoteTimer(roomId, isHost, timeLimit);

  const voteStatus = useVoteStatus(roomId);
  const roomSub = useRoomSubscription(roomId);

  // 방장·참가자 공통: rooms.status가 'finished'가 되면 결과 화면으로 이동 (Realtime)
  useEffect(() => {
    if (roomSub?.status === 'finished') router.push('/group/result');
  }, [roomSub, router]);

  // 참가자 폴백: Realtime을 놓쳤을 경우 3초 간격으로 rooms 상태 확인
  useEffect(() => {
    if (isHost || !roomId) return;
    const poll = setInterval(async () => {
      const r = await getRoomById(roomId);
      if (r?.status === 'finished') {
        clearInterval(poll);
        router.push('/group/result');
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [isHost, roomId, router]);

  useEffect(() => {
    async function init() {
      const id = session.get<string>('roomId');
      if (!id) { router.replace('/'); return; }
      setRoomId(id);

      const clientId = getClientId();
      const [room, cands, participant] = await Promise.all([
        getRoomById(id),
        getRoomCandidates(id),
        getParticipant(id, clientId),
      ]);

      if (!room || !participant) { router.replace('/'); return; }
      setCandidates(cands);
      setIsHost(room.host_client_id === clientId);
      setMyParticipantId(participant.id);
      setTimeLimit(room.time_limit);
    }
    init();
  }, [router]);

  // last_seen 업데이트
  useEffect(() => {
    if (!myParticipantId) return;
    const update = () => updateLastSeen(myParticipantId);
    update();
    lastSeenTimerRef.current = setInterval(update, 10000);
    return () => { if (lastSeenTimerRef.current) clearInterval(lastSeenTimerRef.current); };
  }, [myParticipantId]);

  // 방장: 투표 화면 진입 시 타이머 시작
  useEffect(() => {
    if (!roomId || !isHost) return;
    startTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isHost]);

  const closeVoting = useCallback(async () => {
    if (closedRef.current || !roomId || !candidates.length) return;
    closedRef.current = true;
    setClosing(true);

    try {
      // 결과 계산
      const counts = voteStatus.counts;
      let tiedIds: string[] = [];
      let maxCount = 0;

      Object.entries(counts).forEach(([cid, cnt]) => {
        if (cnt > maxCount) { maxCount = cnt; tiedIds = [cid]; }
        else if (cnt === maxCount) { tiedIds.push(cid); }
      });

      const isTie = tiedIds.length > 1;
      const pool = tiedIds.length > 0
        ? candidates.filter((c) => tiedIds.includes(c.id))
        : candidates;
      const winner = pool[Math.floor(Math.random() * pool.length)] ?? candidates[0];

      await saveResult({
        room_id: roomId,
        winner_label: winner.label,
        winner_emoji: winner.emoji,
        method: 'vote',
        is_tie: isTie,
        vote_summary: counts,
        location: null,
      });

      await updateRoomStatus(roomId, 'finished');
      router.push('/group/result'); // 호스트 직접 이동 (Realtime 타이밍 경쟁 방지)
    } catch {
      setClosing(false);
      closedRef.current = false;
    }
  }, [roomId, candidates, voteStatus.counts, router]);

  // 자동 마감 (모두 투표 완료 or 시간 종료)
  useEffect(() => {
    if (!isHost || closedRef.current || !roomId) return;
    const allVoted = voteStatus.totalCount > 0 && voteStatus.completedCount >= voteStatus.totalCount;
    if (allVoted || timeLeft <= 0) {
      closeVoting();
    }
  }, [voteStatus, timeLeft, isHost, roomId, closeVoting]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <PageLayout>
      <div style={{ paddingTop: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)' }}>투표 현황</h1>
      </div>

      {/* 타이머 */}
      <div
        style={{
          background: timeLeft <= 30 ? '#ffe0e0' : 'var(--color-accent)',
          borderRadius: 14,
          padding: '16px',
          textAlign: 'center',
          marginTop: 16,
        }}
      >
        <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>남은 시간</p>
        <p
          data-testid="timer"
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: timeLeft <= 30 ? '#ff4444' : 'var(--color-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>
      </div>

      {/* 진행률 */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888', marginBottom: 8 }}>
          <span>투표 완료</span>
          <span data-testid="progress-text">{voteStatus.completedCount} / {voteStatus.totalCount}명</span>
        </div>
        <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: 'var(--color-primary)',
              borderRadius: 4,
              width: `${voteStatus.totalCount > 0 ? (voteStatus.completedCount / voteStatus.totalCount) * 100 : 0}%`,
              transition: 'width 0.4s',
            }}
          />
        </div>
      </div>

      {/* 방장: 강제 마감 버튼 */}
      {isHost && (
        <button
          data-testid="btn-force-close"
          onClick={closeVoting}
          disabled={closing}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            border: '2px solid var(--color-primary)',
            background: '#fff',
            color: 'var(--color-primary)',
            fontWeight: 700,
            fontSize: 15,
            cursor: closing ? 'not-allowed' : 'pointer',
            marginTop: 20,
          }}
        >
          {closing ? '집계 중...' : '지금 결과 보기 (강제 마감)'}
        </button>
      )}

      {!isHost && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 1.8 }}>
            🗳️ 투표가 완료됐어요!<br />
            다른 친구들의 투표를 기다리는 중...
          </p>
        </div>
      )}
    </PageLayout>
  );
}
