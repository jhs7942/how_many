import { supabase } from './supabase';
import type { RandomEvent, RandomEventType } from './types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// 시드 기반 난수 생성 (0~1 사이)
export function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 시드로 결과 인덱스 계산
export function getResultIndex(seed: number, count: number): number {
  const rand = seededRandom(seed);
  return Math.floor(rand() * count);
}

// 랜덤의 랜덤 여부 결정 (50% 확률)
export function shouldRespin(seed: number): boolean {
  const rand = seededRandom(seed + 1);
  return rand() < 0.5;
}

// 재회전 방향 결정
export function getRespinDirection(seed: number): 'left' | 'right' {
  const rand = seededRandom(seed + 2);
  return rand() < 0.5 ? 'left' : 'right';
}

// 랜덤 이벤트 저장 (그룹용)
export async function saveRandomEvent(params: {
  roomId: string;
  eventType: RandomEventType;
  seed: number;
  resultIndex?: number;
  isRespin?: boolean;
  respinDirection?: 'left' | 'right';
}): Promise<RandomEvent | null> {
  const { data, error } = await supabase
    .from('random_events')
    .insert({
      room_id: params.roomId,
      event_type: params.eventType,
      seed: params.seed,
      result_index: params.resultIndex ?? null,
      is_respin: params.isRespin ?? false,
      respin_direction: params.respinDirection ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('랜덤 이벤트 저장 오류:', error);
    return null;
  }
  return data as RandomEvent;
}

// 방의 랜덤 이벤트 구독
export function subscribeRandomEvents(
  roomId: string,
  onEvent: (event: RandomEvent) => void
): RealtimeChannel {
  return supabase
    .channel(`random_events:${roomId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'random_events', filter: `room_id=eq.${roomId}` },
      payload => onEvent(payload.new as RandomEvent)
    )
    .subscribe();
}

// 랜덤 시드 생성
export function generateSeed(): number {
  return Math.floor(Math.random() * 1000000);
}
