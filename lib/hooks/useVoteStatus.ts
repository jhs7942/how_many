import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import type { Vote } from '../types';

interface VoteStatus {
  counts: Record<string, number>;
  completedCount: number;
  totalCount: number;
}

// 투표 현황 집계 훅 — "후보별 득표 수, 완료 인원, 전체 인원"을 실시간으로 돌려준다.
//
// [학습] 두 테이블을 한 훅에서 동시에 관리
// "투표한 사람 수 / 전체 인원" 진행률을 표시하려면 votes(투표 행)와 participants(전체 인원) 둘 다 필요하다.
// 한 훅에 모아두면 두 테이블의 변화 어느 쪽에든 반응해서 진행률이 즉시 갱신된다.
//
// [학습] Promise.all 패턴
// 두 개의 독립적인 fetch 를 순차로 await 하면 합산 시간이 (1 + 2) 가 되지만,
// Promise.all 로 묶으면 max(1, 2) — 더 느린 쪽 시간만 걸린다. 합리적인 첫 번째 최적화.
export function useVoteStatus(roomId: string | null): VoteStatus {
  const [status, setStatus] = useState<VoteStatus>({ counts: {}, completedCount: 0, totalCount: 0 });

  useEffect(() => {
    if (!roomId) return;
    const sb = getSupabase();

    async function load() {
      const [{ data: participants }, { data: votes }] = await Promise.all([
        sb.from('participants').select().eq('room_id', roomId),
        sb.from('votes').select().eq('room_id', roomId),
      ]);

      // [학습] 후보별 득표 수 집계 — reduce 대신 forEach + 누적 객체로 단순화.
      // counts[id]가 없을 때는 (undefined ?? 0) + 1 = 1 로 시작.
      const counts: Record<string, number> = {};
      (votes ?? []).forEach((v: Vote) => {
        counts[v.candidate_id] = (counts[v.candidate_id] ?? 0) + 1;
      });

      setStatus({
        counts,
        completedCount: votes?.length ?? 0,
        totalCount: participants?.length ?? 0,
      });
    }

    load();

    // [학습] 한 채널에 두 개의 .on() 체이닝
    // 별도 채널을 두 개 열어도 되지만, 같은 방의 변화는 한 채널에 묶는 게 WebSocket 연결을 아끼는 길.
    // 어떤 변경이 와도 동일한 load() 를 다시 호출 → 단순한 "전체 다시 계산" 전략.
    const channel = sb
      .channel(`votes:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` }, load)
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [roomId]);

  return status;
}
