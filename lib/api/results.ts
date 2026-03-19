import { getSupabase } from '../supabase';
import type { Result } from '../types';

export async function saveResult(
  params: Omit<Result, 'id' | 'created_at'>
): Promise<Result> {
  const { data, error } = await getSupabase()
    .from('results')
    .insert(params)
    .select()
    .single();
  if (error || !data) throw error ?? new Error('결과 저장 실패');
  return data;
}

export async function getResult(id: string): Promise<Result | null> {
  const { data } = await getSupabase()
    .from('results')
    .select()
    .eq('id', id)
    .single();
  return data ?? null;
}

export async function getResultByRoomId(roomId: string): Promise<Result | null> {
  const { data } = await getSupabase()
    .from('results')
    .select()
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}
