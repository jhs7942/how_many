import { getSupabase } from '../supabase';
import type { Vote } from '../types';

export async function castVote(
  roomId: string,
  participantId: string,
  candidateId: string
): Promise<Vote> {
  const { data, error } = await getSupabase()
    .from('votes')
    .upsert({ room_id: roomId, participant_id: participantId, candidate_id: candidateId })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('투표 실패');
  return data;
}

export async function getVotes(roomId: string): Promise<Vote[]> {
  const { data } = await getSupabase()
    .from('votes')
    .select()
    .eq('room_id', roomId);
  return data ?? [];
}

export async function getMyVote(
  roomId: string,
  participantId: string
): Promise<Vote | null> {
  const { data } = await getSupabase()
    .from('votes')
    .select()
    .eq('room_id', roomId)
    .eq('participant_id', participantId)
    .maybeSingle();
  return data ?? null;
}
