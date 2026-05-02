import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import type { Room } from '../types';

// 그룹 플로우의 방(rooms) 한 행을 실시간 구독하는 훅.
// 방장이 status를 'voting' → 'random_playing' 등으로 바꾸면 모든 참여자 화면에 자동 반영된다.
//
// [학습] Supabase Realtime의 핵심 흐름
// 1) `sb.channel(이름)` 으로 채널을 만든다. 이름은 단순 식별자 — 같은 이름이면 같은 구독을 공유.
// 2) `.on('postgres_changes', { event, schema, table, filter }, callback)` 로 Postgres 행 변경을 구독한다.
//    내부적으로는 PG의 logical replication → Supabase Realtime 서버 → WebSocket 으로 흘러온다.
// 3) `.subscribe()` 로 실제 연결을 시작.
// 4) cleanup에서 반드시 `removeChannel(channel)` — 안 하면 페이지 이동 후에도 구독이 살아남아 메모리 누수.
export function useRoomSubscription(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }

    // [학습] roomId가 바뀌었을 때 직전 방 데이터가 잠깐 보이는 깜빡임 방지.
    // 새 effect가 시작되자마자 일단 null로 비우고, load() 결과로 덮어쓴다.
    setRoom(null);

    const sb = getSupabase();
    // [학습] cancelled 플래그 — "비동기가 끝났을 때 컴포넌트가 이미 사라졌으면 setState 하지 마라"
    // 의존성이 빠르게 바뀌면 이전 effect의 fetch가 뒤늦게 도착해 잘못된 방 데이터를 그릴 수 있다.
    // cleanup에서 cancelled = true 로 표시하면, 그 이후 도착한 결과는 모두 무시된다.
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
        // [학습] filter 문법: `컬럼=eq.값` (PostgREST 스타일). UPDATE 이벤트 중 이 방의 것만 받도록 좁힌다.
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: { new: Room }) => {
          if (cancelled) return;
          setRoom(payload.new);
        }
      )
      .subscribe((status: string) => {
        // 구독 완료 시점에 catch-up fetch — subscribe 이전 UPDATE 누락 방지
        //
        // [학습] "초기 로드 + 구독 시작" 사이의 race condition
        // load()가 완료된 직후, subscribe()가 활성화되기 전 짧은 순간에 UPDATE가 발생하면 둘 다 그 변경을 놓친다.
        // 그래서 구독이 'SUBSCRIBED' 상태로 들어온 직후 한 번 더 fetch 한다 — 그 사이 변경된 값을 따라잡기 위함.
        if (status === 'SUBSCRIBED') load();
      });

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [roomId]);

  return room;
}
