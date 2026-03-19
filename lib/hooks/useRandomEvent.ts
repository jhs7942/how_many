import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import type { RandomEvent } from '../types';

export function useRandomEvent(roomId: string | null) {
  const [event, setEvent] = useState<RandomEvent | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const sb = getSupabase();

    const channel = sb
      .channel(`random_events:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'random_events', filter: `room_id=eq.${roomId}` },
        (payload: { new: RandomEvent }) => { setEvent(payload.new); }
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [roomId]);

  return event;
}
