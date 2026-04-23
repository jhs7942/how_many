import { getSupabase } from '../supabase';
import type { Room, RoomCandidate, Participant } from '../types';
import { generateRoomCode } from '../utils';
import { getClientId } from '../clientId';

interface CreateRoomParams {
  mode: Room['mode'];
  preset: Room['preset'];
  peopleCount?: number;
  location?: string;
  candidates: { label: string; emoji: string }[];
  timeLimit?: number; // 투표 제한 시간 (초). 미지정 시 기본 5분(300)
}

export async function createRoom(
  params: CreateRoomParams
): Promise<{ room: Room; candidates: RoomCandidate[] }> {
  const sb = getSupabase();
  const clientId = getClientId();
  const code = generateRoomCode();

  const { data: room, error: roomError } = await sb
    .from('rooms')
    .insert({
      code,
      host_client_id: clientId,
      mode: params.mode,
      preset: params.preset,
      people_count: params.peopleCount ?? null,
      location: params.location ?? null,
      time_limit: params.timeLimit ?? 300,
    })
    .select()
    .single();

  if (roomError || !room) throw roomError ?? new Error('방 생성 실패');

  const candidateRows = params.candidates.map((c, i) => ({
    room_id: room.id,
    label: c.label,
    emoji: c.emoji,
    sort_order: i,
  }));

  const { data: candidates, error: candidatesError } = await sb
    .from('room_candidates')
    .insert(candidateRows)
    .select();

  if (candidatesError || !candidates) throw candidatesError ?? new Error('후보 생성 실패');

  return { room, candidates };
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const { data } = await getSupabase()
    .from('rooms')
    .select()
    .eq('code', code.toUpperCase())
    .single();
  return data ?? null;
}

export async function getRoomById(id: string): Promise<Room | null> {
  const { data } = await getSupabase()
    .from('rooms')
    .select()
    .eq('id', id)
    .single();
  return data ?? null;
}

export async function getRoomCandidates(roomId: string): Promise<RoomCandidate[]> {
  const { data } = await getSupabase()
    .from('room_candidates')
    .select()
    .eq('room_id', roomId)
    .order('sort_order');
  return data ?? [];
}

export async function updateRoomStatus(roomId: string, status: Room['status']): Promise<void> {
  const { error } = await getSupabase().from('rooms').update({ status }).eq('id', roomId);
  if (error) throw error;
}

export async function setVoteStartedAt(roomId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('rooms')
    .update({ vote_started_at: new Date().toISOString() })
    .eq('id', roomId);
  if (error) throw error;
}

export async function joinRoom(
  roomId: string,
  nickname: string,
  emoji: string
): Promise<Participant> {
  const clientId = getClientId();
  const sb = getSupabase();

  // 이미 참여 중인지 확인
  const { data: existing } = await sb
    .from('participants')
    .select()
    .eq('room_id', roomId)
    .eq('client_id', clientId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await sb
      .from('participants')
      .update({ nickname, emoji, last_seen: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error || !data) throw error ?? new Error('참여자 업데이트 실패');
    return data;
  }

  const room = await getRoomById(roomId);
  const isHost = room?.host_client_id === clientId;

  const { data, error } = await sb
    .from('participants')
    .insert({
      room_id: roomId,
      client_id: clientId,
      nickname,
      emoji,
      is_host: isHost,
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error('참여 실패');
  return data;
}

export async function updateLastSeen(participantId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('participants')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', participantId);
  if (error) throw error;
}

export async function getParticipant(
  roomId: string,
  clientId: string
): Promise<Participant | null> {
  const { data } = await getSupabase()
    .from('participants')
    .select()
    .eq('room_id', roomId)
    .eq('client_id', clientId)
    .maybeSingle();
  return data ?? null;
}
