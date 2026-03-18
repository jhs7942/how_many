import { supabase } from './supabase';
import type { Result, VoteResult } from './types';

// 결과 저장
export async function saveResult(params: {
  roomId?: string;
  winnerLabel: string;
  winnerEmoji: string;
  method: 'vote' | 'random';
  isTie?: boolean;
  voteSummary?: VoteResult[];
}): Promise<Result | null> {
  const { data, error } = await supabase
    .from('results')
    .insert({
      room_id: params.roomId ?? null,
      winner_label: params.winnerLabel,
      winner_emoji: params.winnerEmoji,
      method: params.method,
      is_tie: params.isTie ?? false,
      vote_summary: params.voteSummary ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('결과 저장 오류:', error);
    return null;
  }
  return data as Result;
}

// 결과 조회
export async function getResult(id: string): Promise<Result | null> {
  const { data, error } = await supabase.from('results').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as Result;
}

// 방의 최신 결과 조회
export async function getRoomResult(roomId: string): Promise<Result | null> {
  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Result;
}
