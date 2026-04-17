import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import type { Room } from '../types';

export function useRoomSubscription(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }

    setRoom(null);

    const sb = getSupabase();
    let cancelled = false;

    const load = async () => {
      const { data } = await sb.from('rooms').select().eq('id', roomId).single();
      if (cancelled) return;
      if (data) setRoom(data as Room);
    };

    load();

    const channel = sb
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: { new: Room }) => {
          if (cancelled) return;
          setRoom(payload.new);
        }
      )
      .subscribe((status: string) => {
        // 구독 완료 시점에 catch-up fetch — subscribe 이전 UPDATE 누락 방지
        if (status === 'SUBSCRIBED') load();
      });

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [roomId]);

  return room;
}
