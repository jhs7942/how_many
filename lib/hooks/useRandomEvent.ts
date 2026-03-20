import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import { getLatestRandomEvent } from '../api/random';
import type { RandomEvent } from '../types';

export function useRandomEvent(roomId: string | null) {
  const [event, setEvent] = useState<RandomEvent | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const sb = getSupabase();

    // 구독 전 이미 존재하는 이벤트를 초기 fetch (타이밍 경쟁 방지)
    getLatestRandomEvent(roomId).then((existing) => {
      if (existing) setEvent(existing);
    });

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
