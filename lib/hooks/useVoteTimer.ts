'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import { setVoteStartedAt } from '../api/rooms';

// 투표 타이머 훅 — Supabase Realtime으로 vote_started_at 구독
// 모든 참여자가 동일한 시작 시각 기준으로 카운트다운
export function useVoteTimer(roomId: string | null, isHost: boolean, timeLimit: number) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  // Supabase Realtime: rooms.vote_started_at 변경 구독
  useEffect(() => {
    if (!roomId) return;
    const sb = getSupabase();
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
  useEffect(() => {
    if (!startedAt) return;
    const tick = setInterval(() => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      setTimeLeft(Math.max(0, timeLimit - elapsed));
    }, 500);
    return () => clearInterval(tick);
  }, [startedAt, timeLimit]);

  // 방장: 투표 화면 진입 시 vote_started_at 업데이트
  async function startTimer() {
    if (!isHost || !roomId || startedAt) return;
    await setVoteStartedAt(roomId);
  }

  return { timeLeft: Math.floor(timeLeft), startTimer };
}
