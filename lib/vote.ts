import { supabase } from './supabase';
import type { Vote, VoteResult, Candidate } from './types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// 투표 제출
export async function submitVote(params: {
  roomId: string;
  participantId: string;
  candidateId: string;
}): Promise<boolean> {
  const { error } = await supabase.from('votes').insert({
    room_id: params.roomId,
    participant_id: params.participantId,
    candidate_id: params.candidateId,
  });

  if (error) {
    console.error('투표 오류:', error);
    return false;
  }
  return true;
}

// 투표 결과 집계
export async function getVoteResults(
  roomId: string,
  candidates: Candidate[]
): Promise<VoteResult[]> {
  const { data: votes, error } = await supabase
    .from('votes')
    .select('candidate_id')
    .eq('room_id', roomId);

  if (error || !votes) return [];

  const total = votes.length;
  const countMap: Record<string, number> = {};
  votes.forEach((v: Vote) => {
    countMap[v.candidate_id] = (countMap[v.candidate_id] ?? 0) + 1;
  });

  return candidates.map(c => ({
    candidate: c,
    count: c.id ? (countMap[c.id] ?? 0) : 0,
    percentage: total > 0 ? Math.round(((c.id ? (countMap[c.id] ?? 0) : 0) / total) * 100) : 0,
  }));
}

// 내가 이미 투표했는지 확인
export async function hasVoted(roomId: string, participantId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('room_id', roomId)
    .eq('participant_id', participantId)
    .single();

  if (error) return false;
  return !!data;
}

// 투표 완료 인원 수 조회
export async function getVoteCount(roomId: string): Promise<number> {
  const { count, error } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId);

  if (error) return 0;
  return count ?? 0;
}

// 실시간 투표 구독
export function subscribeVotes(
  roomId: string,
  onUpdate: () => void
): RealtimeChannel {
  return supabase
    .channel(`votes:${roomId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
      () => onUpdate()
    )
    .subscribe();
}

// 실시간 참여자 구독
export function subscribeParticipants(
  roomId: string,
  onUpdate: () => void
): RealtimeChannel {
  return supabase
    .channel(`participants:${roomId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
      () => onUpdate()
    )
    .subscribe();
}
