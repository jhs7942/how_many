import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import type { Vote } from '../types';

interface VoteStatus {
  counts: Record<string, number>;
  completedCount: number;
  totalCount: number;
}

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

    const channel = sb
      .channel(`votes:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` }, load)
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [roomId]);

  return status;
}
