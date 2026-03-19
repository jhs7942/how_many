import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import type { Vote, Participant } from '../types';

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
      const threshold = new Date(Date.now() - 30000).toISOString();
      const [{ data: participants }, { data: votes }] = await Promise.all([
        sb.from('participants').select().eq('room_id', roomId),
        sb.from('votes').select().eq('room_id', roomId),
      ]);

      const active = (participants ?? []).filter(
        (p: Participant) => !p.last_seen || new Date(p.last_seen) > new Date(threshold)
      );

      const counts: Record<string, number> = {};
      (votes ?? []).forEach((v: Vote) => {
        counts[v.candidate_id] = (counts[v.candidate_id] ?? 0) + 1;
      });

      setStatus({
        counts,
        completedCount: votes?.length ?? 0,
        totalCount: active.length,
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
