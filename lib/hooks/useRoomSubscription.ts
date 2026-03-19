import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import type { Room } from '../types';

export function useRoomSubscription(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const sb = getSupabase();

    sb.from('rooms').select().eq('id', roomId).single().then(({ data }: { data: Room | null }) => {
      if (data) setRoom(data);
    });

    const channel = sb
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: { new: Room }) => { setRoom(payload.new); }
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [roomId]);

  return room;
}
