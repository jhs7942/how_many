'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import { getRoomById, setVoteStartedAt } from '../api/rooms';

// 투표 타이머 훅 — Supabase Realtime으로 vote_started_at 구독
// 모든 참여자가 동일한 시작 시각 기준으로 카운트다운
//
// [학습] 왜 클라이언트마다 setInterval 로 카운트하면 안 되는가?
// 단순히 mount 시점부터 timeLimit 초를 세면 "방장은 5초 남았는데 늦게 들어온 참여자는 25초 남음" 처럼 어긋난다.
// 해결책: 시작 시각(vote_started_at)을 DB에 한 번만 박아두고, 모든 클라이언트가 그 시각을 기준으로 (지금 - 시작) 을 계산한다.
// 이러면 클라이언트마다 mount 타이밍이 달라도 표시되는 남은 시간은 항상 동기화된다.
export function useVoteTimer(roomId: string | null, isHost: boolean, timeLimit: number) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  // Supabase Realtime: rooms.vote_started_at 변경 구독 + mount 시 초기값 fetch
  // (참가자가 방장의 startTimer 이후에 진입하면 UPDATE 이벤트를 놓치므로 초기값 조회 필수)
  //
  // [학습] "초기 fetch + 구독"의 흔한 패턴
  // 이미 useRoomSubscription, useParticipants 등에서 본 형태와 동일하다 — 이 프로젝트의 Realtime 훅들이 공유하는 토대.
  useEffect(() => {
    if (!roomId) return;
    const sb = getSupabase();

    async function loadInitial() {
      const room = await getRoomById(roomId!);
      if (room?.vote_started_at) setStartedAt(room.vote_started_at);
    }
    loadInitial();

    const sub = sb
      .channel(`vote-timer-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: { new: Record<string, unknown> }) => {
          const at = (payload.new as { vote_started_at?: string | null }).vote_started_at;
          if (at) setStartedAt(at);
        }
      )
      .subscribe();

    return () => { sb.removeChannel(sub); };
  }, [roomId]);

  // startedAt 기준으로 1초 tick
  //
  // [학습] effect를 두 개로 분리한 이유
  // 첫 번째 effect는 "DB에서 시작 시각을 받아오는 일", 두 번째는 "UI에 1초마다 남은 시간을 그리는 일".
  // 두 책임이 다르므로 의존성도 다르다 — 첫 번째는 [roomId], 두 번째는 [startedAt, timeLimit].
  // 의존성 배열을 분리하면 "방이 바뀌었다고 타이머가 리셋되는" 식의 불필요한 재설정을 피할 수 있다.
  useEffect(() => {
    if (!startedAt) return;
    // [학습] 500ms tick으로 1초 단위 표시
    // 정확히 1000ms 간격이면 사용자가 "초가 한 번 점프한 것처럼" 보이는 경우가 있다.
    // 500ms마다 실제 경과를 다시 계산해서 Math.floor 한 값을 보여주면 시각적으로 부드럽다.
    const tick = setInterval(() => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      setTimeLeft(Math.max(0, timeLimit - elapsed));
    }, 500);
    return () => clearInterval(tick);
  }, [startedAt, timeLimit]);

  // 방장: 투표 화면 진입 시 vote_started_at 업데이트
  //
  // [학습] "방장만 쓰기 권한" 패턴
  // RLS(Row Level Security) 또는 클라이언트 가드 둘 다로 막을 수 있다. 여기선 클라이언트에서 isHost 체크 + startedAt 중복 방지.
  // (실제 보안은 Supabase RLS 쪽에서도 함께 막아야 한다 — 클라이언트 코드만으로는 우회 가능)
  async function startTimer() {
    if (!isHost || !roomId || startedAt) return;
    await setVoteStartedAt(roomId);
  }

  return { timeLeft: Math.floor(timeLeft), startTimer };
}
