import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import type { Participant } from '../types';

export function useParticipants(roomId: string | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!roomId) return;
    const sb = getSupabase();

    const load = () =>
      sb.from('participants').select().eq('room_id', roomId).then(({ data }: { data: Participant[] | null }) => {
        if (data) setParticipants(data);
      });

    load();

    const channel = sb
      .channel(`participants:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
        load
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [roomId]);

  return participants;
}
