import { useEffect, useState, useRef } from 'react';
import { getSupabase } from '../supabase';
import { getClientId } from '../clientId';

export function useHostPresence(roomId: string | null, isHost: boolean) {
  const [isHostConnected, setIsHostConnected] = useState(true);
  const lastSeenRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const sb = getSupabase();
    const clientId = getClientId();

    const channel = sb.channel(`presence:${roomId}`, {
      config: { presence: { key: clientId } },
    });

    if (isHost) {
      channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ type: 'host', timestamp: Date.now() });
          intervalRef.current = setInterval(() => {
            channel.track({ type: 'host', timestamp: Date.now() });
          }, 5000);
        }
      });
    } else {
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const hostPresent = Object.values(state).some((presences) =>
            (presences as { type: string }[]).some((p) => p.type === 'host')
          );
          if (hostPresent) {
            lastSeenRef.current = Date.now();
            setIsHostConnected(true);
          }
        })
        .subscribe();

      intervalRef.current = setInterval(() => {
        if (Date.now() - lastSeenRef.current > 30000) {
          setIsHostConnected(false);
        }
      }, 5000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sb.removeChannel(channel);
    };
  }, [roomId, isHost]);

  return isHostConnected;
}
