import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import type { Participant } from '../types';

export function useParticipants(roomId: string | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(roomId));

  useEffect(() => {
    if (!roomId) {
      setParticipants([]);
      setIsLoading(false);
      return;
    }

    setParticipants([]);
    setIsLoading(true);

    const sb = getSupabase();
    let cancelled = false;

    const load = async () => {
      const { data } = await sb.from('participants').select().eq('room_id', roomId);
      if (cancelled) return;
      setParticipants((data as Participant[] | null) ?? []);
      setIsLoading(false);
    };

    load();

    const channel = sb
      .channel(`participants:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        () => { load(); }
      )
      .subscribe((status: string) => {
        // 구독 완료 시점에 한 번 더 fetch — subscribe 이전 발생한 변경 누락 방지
        if (status === 'SUBSCRIBED') load();
      });

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [roomId]);

  return { participants, isLoading };
}
