'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import SpinWheel, { type SpinWheelHandle } from '@/components/SpinWheel';
import ContentShuffle from '@/components/ContentShuffle';
import SlotMachine from '@/components/SlotMachine';
import RopePull from '@/components/RopePull';
import { session } from '@/lib/session';
import { getClientId } from '@/lib/clientId';
import { getRoomById, getRoomCandidates, getParticipant, updateRoomStatus } from '@/lib/api/rooms';
import { createRandomEvent } from '@/lib/api/random';
import { saveResult } from '@/lib/api/results';
import { useRandomEvent } from '@/lib/hooks/useRandomEvent';
import { pickGameType } from '@/lib/utils';
import type { RoomCandidate, RandomEvent } from '@/lib/types';

export default function GroupRandomPage() {
  const router = useRouter();
  const spinRef = useRef<SpinWheelHandle>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<RoomCandidate[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [gameType, setGameType] = useState<'spin' | 'shuffle' | 'slot' | 'rope' | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);

  // 참여자용: 수신된 이벤트
  const [participantEvent, setParticipantEvent] = useState<RandomEvent | null>(null);

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

      if (host) {
        setGameType(pickGameType(cands.length));
      }
    }
    init();
  }, [router]);

  // 참여자: 랜덤 이벤트 수신
  useEffect(() => {
    if (!randomEvent || isHost || doneRef.current) return;
    const type = randomEvent.event_type;
    setGameType(type);

    if (type === 'shuffle' || type === 'slot' || type === 'rope') {
      // 애니메이션 관람 → participantEvent 설정
      setParticipantEvent(randomEvent);
    } else {
      // 돌림판: 바로 결과 화면으로
      if (randomEvent.result_index >= 0) {
        doneRef.current = true;
        session.set('groupResultEvent', randomEvent);
        router.push('/group/result');
      }
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

  function handleParticipantResult() {
    if (doneRef.current || !randomEvent) return;
    doneRef.current = true;
    session.set('groupResultEvent', randomEvent);
    router.push('/group/result');
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

  // 참여자: 이벤트 수신 전 대기 (shuffle/slot/rope)
  if (!isHost && (gameType === 'shuffle' || gameType === 'slot' || gameType === 'rope') && !participantEvent) {
    return (
      <PageLayout>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>⏳</div>
          <p style={{ fontSize: 14, color: '#888' }}>방장이 진행 중이에요</p>
        </div>
      </PageLayout>
    );
  }

  const gameTitles = {
    spin: '🎡 돌림판',
    shuffle: '🔀 컨텐츠 셔플',
    slot: '🎰 슬롯머신',
    rope: '🪢 줄 뽑기',
  };

  return (
    <PageLayout>
      <div style={{ paddingTop: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)', textAlign: 'center' }}>
          {gameTitles[gameType]}
        </h1>
        {!isHost && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 4 }}>
            방장이 진행 중이에요
          </p>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        {/* 돌림판 */}
        {gameType === 'spin' && (
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
        )}

        {/* 컨텐츠 셔플 */}
        {gameType === 'shuffle' && (
          isHost ? (
            <ContentShuffle
              segments={segments}
              onResult={(index) => handleHostResult(candidates[index], index)}
            />
          ) : (
            <ContentShuffle
              segments={segments}
              seed={participantEvent!.seed}
              resultIndex={participantEvent!.result_index}
              onResult={handleParticipantResult}
            />
          )
        )}

        {/* 슬롯머신 */}
        {gameType === 'slot' && (
          isHost ? (
            <SlotMachine
              segments={segments}
              onResult={(index) => handleHostResult(candidates[index], index)}
            />
          ) : (
            <SlotMachine
              segments={segments}
              seed={participantEvent!.seed}
              resultIndex={participantEvent!.result_index}
              onResult={handleParticipantResult}
            />
          )
        )}

        {/* 줄 뽑기 */}
        {gameType === 'rope' && (
          isHost ? (
            <RopePull
              segments={segments}
              onResult={(index) => handleHostResult(candidates[index], index)}
            />
          ) : (
            <RopePull
              segments={segments}
              seed={participantEvent!.seed}
              resultIndex={participantEvent!.result_index}
              onResult={handleParticipantResult}
            />
          )
        )}
      </div>
    </PageLayout>
  );
}
