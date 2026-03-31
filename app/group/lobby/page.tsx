'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import NicknameInput from '@/components/NicknameInput';
import HostDisconnectedModal from '@/components/HostDisconnectedModal';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';
import { getClientId } from '@/lib/clientId';
import {
  getRoomById,
  getRoomCandidates,
  getParticipant,
  joinRoom,
  updateLastSeen,
  updateRoomStatus,
  setVoteStartedAt,
} from '@/lib/api/rooms';
import { useRoomSubscription } from '@/lib/hooks/useRoomSubscription';
import { useParticipants } from '@/lib/hooks/useParticipants';
import { useHostPresence } from '@/lib/hooks/useHostPresence';
import { copyToClipboard } from '@/lib/utils';
import type { Participant } from '@/lib/types';

export default function GroupLobbyPage() {
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [myParticipant, setMyParticipant] = useState<Participant | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [joiningLoading, setJoiningLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [candidateCount, setCandidateCount] = useState(0);
  const lastSeenTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const room = useRoomSubscription(roomId);
  const participants = useParticipants(roomId);
  const isHostConnected = useHostPresence(roomId, isHost);

  useEffect(() => {
    async function init() {
      const id = session.get<string>('roomId');
      const code = session.get<string>('roomCode') ?? '';
      if (!id) { router.replace('/'); return; }

      setRoomId(id);
      setRoomCode(code);

      const clientId = getClientId();
      const roomData = await getRoomById(id);
      if (!roomData) { router.replace('/'); return; }

      const host = roomData.host_client_id === clientId;
      setIsHost(host);

      const existing = await getParticipant(id, clientId);
      if (existing) {
        setMyParticipant(existing);
      } else {
        setShowNickname(true);
      }

      const cands = await getRoomCandidates(id);
      setCandidateCount(cands.length);
    }
    init();
  }, [router]);

  // last_seen 주기적 업데이트
  useEffect(() => {
    if (!myParticipant) return;
    const update = () => updateLastSeen(myParticipant.id);
    update();
    lastSeenTimerRef.current = setInterval(update, 10000);
    return () => { if (lastSeenTimerRef.current) clearInterval(lastSeenTimerRef.current); };
  }, [myParticipant]);

  // 방 상태 변화 시 이동
  useEffect(() => {
    if (!room) return;
    if (room.status === 'voting') router.push('/group/vote');
    if (room.status === 'random_playing') router.push('/group/random');
    if (room.status === 'finished') router.push('/group/result');
  }, [room, router]);

  async function handleNicknameConfirm(nickname: string, emoji: string) {
    if (!roomId) return;
    setJoiningLoading(true);
    try {
      const p = await joinRoom(roomId, nickname, emoji);
      setMyParticipant(p);
      setShowNickname(false);
    } catch {
      showToast('입장에 실패했습니다');
    } finally {
      setJoiningLoading(false);
    }
  }

  async function handleStart() {
    if (!roomId || !room) return;
    setStartLoading(true);
    try {
      const nextStatus = room.mode === 'vote' ? 'voting' : 'random_playing';
      if (room.mode === 'vote') {
        await setVoteStartedAt(roomId);
      }
      await updateRoomStatus(roomId, nextStatus);
    } catch {
      showToast('시작에 실패했습니다');
    } finally {
      setStartLoading(false);
    }
  }

  async function handleCopyCode() {
    await copyToClipboard(roomCode);
    showToast(`코드 ${roomCode} 복사됨! 📋`);
  }

  return (
    <PageLayout>
      {showNickname && (
        <NicknameInput onConfirm={handleNicknameConfirm} loading={joiningLoading} />
      )}
      {!isHost && !isHostConnected && myParticipant && (
        <HostDisconnectedModal />
      )}

      <div style={{ paddingTop: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)' }}>대기실</h1>
      </div>

      {/* 방 코드 */}
      <div
        onClick={handleCopyCode}
        style={{
          background: 'var(--color-accent)',
          borderRadius: 14,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          marginTop: 16,
        }}
      >
        <div>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>방 코드</p>
          <p style={{ fontSize: 24, fontWeight: 900, letterSpacing: 4, color: 'var(--color-primary)' }}>
            {roomCode}
          </p>
        </div>
        <span style={{ fontSize: 22 }}>📋</span>
      </div>

      {/* 후보 정보 */}
      <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
        후보 {candidateCount}개 · {room?.mode === 'vote' ? '투표 방식' : '랜덤 방식'}
      </p>

      {/* 참여자 목록 */}
      <div
        onScroll={(e) => { if (e.currentTarget.scrollLeft !== 0) e.currentTarget.scrollLeft = 0; }}
        style={{ flex: 1, minHeight: 0, marginTop: 20, overflowY: 'auto', overflowX: 'hidden', maxWidth: 'calc(100vw - 40px)' }}
      >
        <p style={{ fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 10 }}>
          참여자 {participants.length}명
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {participants.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#fff',
                borderRadius: 12,
                padding: '12px 14px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <span style={{ fontSize: 24 }}>{p.emoji}</span>
              <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 15 }}>
                {p.nickname}
              </span>
              {p.is_host && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  background: 'var(--color-accent)',
                  padding: '2px 8px',
                  borderRadius: 20,
                }}>
                  방장
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 방장: 시작 버튼 / 참여자: 대기 메시지 */}
      <div style={{ paddingTop: 16 }}>
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={startLoading || participants.length < 1}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              border: 'none',
              background: participants.length >= 1 && !startLoading ? 'var(--color-primary)' : '#ddd',
              color: participants.length >= 1 && !startLoading ? '#fff' : '#aaa',
              fontWeight: 800,
              fontSize: 17,
              cursor: participants.length >= 1 && !startLoading ? 'pointer' : 'not-allowed',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {startLoading ? '시작 중...' : '🚀 시작하기'}
          </button>
        ) : (
          <div style={{ textAlign: 'center', padding: '14px', fontSize: 14, color: '#888' }}>
            방장이 시작하길 기다리는 중...
          </div>
        )}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </PageLayout>
  );
}
