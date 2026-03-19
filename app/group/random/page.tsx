'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import SpinWheel, { type SpinWheelHandle } from '@/components/SpinWheel';
import ShellGame from '@/components/ShellGame';
import { session } from '@/lib/session';
import { getClientId } from '@/lib/clientId';
import { getRoomById, getRoomCandidates, getParticipant, updateRoomStatus } from '@/lib/api/rooms';
import { createRandomEvent } from '@/lib/api/random';
import { saveResult } from '@/lib/api/results';
import { useRandomEvent } from '@/lib/hooks/useRandomEvent';
import type { RoomCandidate } from '@/lib/types';

export default function GroupRandomPage() {
  const router = useRouter();
  const spinRef = useRef<SpinWheelHandle>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<RoomCandidate[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [gameType, setGameType] = useState<'spin' | 'shell' | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);

  const randomEvent = useRandomEvent(roomId);

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

      const host = room.host_client_id === clientId;
      setIsHost(host);

      // 호스트만 게임 타입 결정
      if (host) {
        const shellProb = cands.length >= 7 ? 0.3 : 0.5;
        setGameType(Math.random() < shellProb ? 'shell' : 'spin');
      }
    }
    init();
  }, [router]);

  // 참여자: 랜덤 이벤트 수신
  useEffect(() => {
    if (!randomEvent || isHost || doneRef.current) return;
    setGameType(randomEvent.event_type);
    // 이미 완료된 이벤트이면 바로 결과 이동
    if (randomEvent.result_index >= 0) {
      doneRef.current = true;
      session.set('groupResultEvent', randomEvent);
      router.push('/group/result');
    }
  }, [randomEvent, isHost, router]);

  async function handleHostResult(winner: RoomCandidate, index: number) {
    if (doneRef.current || !roomId) return;
    doneRef.current = true;
    setDone(true);

    try {
      await createRandomEvent(roomId, gameType!, index);
      await saveResult({
        room_id: roomId,
        winner_label: winner.label,
        winner_emoji: winner.emoji,
        method: gameType!,
        is_tie: false,
        vote_summary: null,
        location: null,
      });
      await updateRoomStatus(roomId, 'finished');
      router.push('/group/result');
    } catch {
      router.push('/group/result');
    }
  }

  function handleSpin() {
    if (isSpinning || done) return;
    setIsSpinning(true);
    spinRef.current?.spin();
  }

  const segments = candidates.map((c) => ({ label: c.label, emoji: c.emoji }));

  if (!gameType || candidates.length === 0) {
    return (
      <PageLayout>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>⏳</div>
          <p style={{ fontSize: 14, color: '#888' }}>
            {isHost ? '준비 중...' : '방장을 기다리는 중...'}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div style={{ paddingTop: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)', textAlign: 'center' }}>
          {gameType === 'shell' ? '🥤 야바위' : '🎡 돌림판'}
        </h1>
        {!isHost && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 4 }}>
            방장이 진행 중이에요
          </p>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        {gameType === 'spin' ? (
          <>
            <SpinWheel
              ref={spinRef}
              segments={segments}
              onResult={(result, index) => {
                if (isHost) handleHostResult(candidates[index], index);
              }}
            />
            {isHost && (
              <button
                onClick={handleSpin}
                disabled={isSpinning || done}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  border: 'none',
                  background: isSpinning || done ? '#ddd' : 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: 15,
                  cursor: isSpinning || done ? 'not-allowed' : 'pointer',
                  boxShadow: isSpinning || done ? 'none' : 'var(--shadow-lg)',
                }}
              >
                {isSpinning ? '...' : 'SPIN!'}
              </button>
            )}
          </>
        ) : (
          isHost ? (
            <ShellGame
              segments={segments}
              onResult={(index) => handleHostResult(candidates[index], index)}
            />
          ) : (
            <div style={{ textAlign: 'center', fontSize: 14, color: '#888' }}>
              🥤 야바위 진행 중...
            </div>
          )
        )}
      </div>
    </PageLayout>
  );
}
