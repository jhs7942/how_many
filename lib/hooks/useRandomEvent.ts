import { useEffect, useState } from 'react';
import { getSupabase } from '../supabase';
import { getLatestRandomEvent } from '../api/random';
import type { RandomEvent } from '../types';

// 그룹 플로우의 랜덤 게임 이벤트 구독 훅.
//
// [학습] 왜 별도의 random_events 테이블이 필요한가?
// 그룹 플로우에서 방장이 "돌림판을 돌렸다" 라는 사실 자체와 결과(시드/인덱스)를 모든 참여자에게 동기화해야 한다.
// rooms.status 만으로는 결과 인덱스를 담기 어렵고, 한 방에서 여러 번 다시 뽑을 수도 있어
// 별도의 INSERT-only 테이블에 이벤트를 누적한다 (PostgreSQL 권장 패턴인 event sourcing 미니 버전).
//
// 이 훅이 동작하는 흐름:
// 1) mount 시 가장 최신 이벤트 1건을 fetch — "내가 늦게 들어왔어도 진행 중인 게임이 있으면 합류".
// 2) INSERT 이벤트 구독 — "방장이 새로 돌리면 즉시 받음".
// 3) cleanup에서 채널 정리.
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
        // [학습] INSERT 만 구독하는 이유
        // random_events 테이블은 "한 번 쓰여진 이벤트는 절대 수정/삭제하지 않는다"는 정책을 따른다.
        // 따라서 UPDATE/DELETE 를 구독할 필요가 없고, 이벤트 발생 = 새 행 INSERT 한 가지로 단순화된다.
        { event: 'INSERT', schema: 'public', table: 'random_events', filter: `room_id=eq.${roomId}` },
        (payload: { new: RandomEvent }) => {
          if (cancelled) return;
          // [학습] payload.new — INSERT 이벤트의 새로 추가된 행 전체.
          // UPDATE 이벤트라면 payload.old (이전 값) 도 함께 받을 수 있다.
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
