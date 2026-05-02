import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import type { Participant } from '../types';

// 한 방의 참여자 목록을 실시간 동기화하는 훅.
// 새로운 사람이 들어오거나(INSERT), 닉네임을 바꾸거나(UPDATE), 나가면(DELETE) 자동 반영된다.
//
// [학습] useRoomSubscription과의 차이 — event: '*'
// 방(rooms) 훅은 UPDATE 한 종류만 구독한다. 행 자체가 살아있는 채로 status만 바뀌니까.
// 반면 참여자는 INSERT / UPDATE / DELETE 가 모두 의미 있다 → '*' 와일드카드로 셋 다 받는다.
// 다만 어떤 이벤트가 와도 "전체를 다시 fetch" 하는 단순 전략을 쓴다 — 참여자 수가 많지 않아 비용보다 단순함이 이득.
export function useParticipants(roomId: string | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  // [학습] 별도의 isLoading 상태를 두는 이유
  // "빈 배열"과 "아직 로딩 중인 빈 배열"을 구분해야 UI에서 "참여자 없음" 안내를 잘못 띄우지 않는다.
  // 처음에는 roomId가 있으면 로딩 중으로 시작 → 첫 fetch 끝나면 false.
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
      // [학습] `?? []` — 데이터가 null로 와도 항상 배열로 정규화.
      // 호출부가 `.map()`을 안전하게 쓸 수 있도록 "타입은 항상 배열" 이라는 계약을 지킨다.
      setParticipants((data as Participant[] | null) ?? []);
      setIsLoading(false);
    };

    load();

    const channel = sb
      .channel(`participants:${roomId}`)
      .on(
        'postgres_changes',
        // [학습] event: '*' — INSERT/UPDATE/DELETE 모두 받기.
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
