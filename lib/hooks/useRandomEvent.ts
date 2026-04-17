import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import { getLatestRandomEvent } from '../api/random';
import type { RandomEvent } from '../types';

export function useRandomEvent(roomId: string | null) {
  const [event, setEvent] = useState<RandomEvent | null>(null);

  useEffect(() => {
    if (!roomId) {
      setEvent(null);
      return;
    }

    setEvent(null);

    const sb = getSupabase();
    let cancelled = false;

    const load = async () => {
      const existing = await getLatestRandomEvent(roomId);
      if (cancelled) return;
      if (existing) setEvent(existing);
    };

    // 구독 전 이미 존재하는 이벤트를 초기 fetch (타이밍 경쟁 방지)
    load();

    const channel = sb
      .channel(`random_events:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'random_events', filter: `room_id=eq.${roomId}` },
        (payload: { new: RandomEvent }) => {
          if (cancelled) return;
          setEvent(payload.new);
        }
      )
      .subscribe((status: string) => {
        // 구독 완료 시점에 catch-up fetch — subscribe 이전 INSERT 누락 방지
        if (status === 'SUBSCRIBED') load();
      });

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [roomId]);

  return event;
}
