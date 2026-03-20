import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import type { Result } from '../types';

export function useRoomResult(roomId: string | null) {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const sb = getSupabase();

    // 초기 fetch: 이미 저장된 결과가 있으면 즉시 반환 (타이밍 경쟁 방지)
    sb.from('results').select().eq('room_id', roomId).maybeSingle()
      .then(({ data }: { data: Result | null }) => { if (data) setResult(data); });

    // 신규 INSERT 구독
    const channel = sb
      .channel(`results:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'results', filter: `room_id=eq.${roomId}` },
        (payload: { new: Result }) => { setResult(payload.new); }
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [roomId]);

  return result;
}
