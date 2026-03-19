import { getSupabase } from '../supabase';
import type { RandomEvent } from '../types';

export async function createRandomEvent(
  roomId: string,
  eventType: RandomEvent['event_type'],
  resultIndex: number,
  options?: {
    isRespin?: boolean;
    respinDirection?: 'left' | 'right';
    cupOrder?: number[];
  }
): Promise<RandomEvent> {
  const seed = Math.floor(Math.random() * 2147483647);
  const { data, error } = await getSupabase()
    .from('random_events')
    .insert({
      room_id: roomId,
      event_type: eventType,
      seed,
      result_index: resultIndex,
      is_respin: options?.isRespin ?? false,
      respin_direction: options?.respinDirection ?? null,
      cup_order: options?.cupOrder ?? null,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('랜덤 이벤트 생성 실패');
  return data;
}

export async function getLatestRandomEvent(roomId: string): Promise<RandomEvent | null> {
  const { data } = await getSupabase()
    .from('random_events')
    .select()
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}
