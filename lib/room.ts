import { supabase } from './supabase';
import { generateRoomCode } from './utils';
import type { Room, RoomMode, RoomPreset, Candidate, Participant, RoomWithCandidates } from './types';

// 방 생성
export async function createRoom(params: {
  mode: RoomMode;
  preset: RoomPreset;
  peopleCount: number | null;
  locationText: string | null;
  timeLimit?: number;
  candidates: Candidate[];
}): Promise<{ room: Room; hostId: string } | null> {
  const code = generateRoomCode();
  const hostId = crypto.randomUUID();

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      code,
      host_id: hostId,
      mode: params.mode,
      preset: params.preset,
      people_count: params.peopleCount,
      location_text: params.locationText,
      time_limit: params.timeLimit ?? 300,
      status: 'waiting',
    })
    .select()
    .single();

  if (roomError || !room) {
    console.error('방 생성 오류:', roomError);
    return null;
  }

  // 후보 삽입
  const candidatesData = params.candidates.map((c, i) => ({
    room_id: room.id,
    label: c.label,
    emoji: c.emoji,
    sort_order: i,
  }));

  const { error: candError } = await supabase.from('room_candidates').insert(candidatesData);
  if (candError) {
    console.error('후보 저장 오류:', candError);
    return null;
  }

  return { room, hostId };
}

// 방 코드로 방 조회
export async function getRoomByCode(code: string): Promise<RoomWithCandidates | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, room_candidates(*)')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) return null;
  return data as RoomWithCandidates;
}

// 방 ID로 방 조회
export async function getRoomById(id: string): Promise<RoomWithCandidates | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, room_candidates(*)')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as RoomWithCandidates;
}

// 방 상태 업데이트
export async function updateRoomStatus(roomId: string, status: Room['status']): Promise<boolean> {
  const { error } = await supabase.from('rooms').update({ status }).eq('id', roomId);
  if (error) {
    console.error('방 상태 업데이트 오류:', error);
    return false;
  }
  return true;
}

// 참여자 등록
export async function joinRoom(params: {
  roomId: string;
  nickname: string;
  emoji: string;
  isHost?: boolean;
}): Promise<Participant | null> {
  const { data, error } = await supabase
    .from('participants')
    .insert({
      room_id: params.roomId,
      nickname: params.nickname,
      emoji: params.emoji,
      is_host: params.isHost ?? false,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('참여자 등록 오류:', error);
    return null;
  }
  return data as Participant;
}

// 방 참여자 목록 조회
export async function getParticipants(roomId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as Participant[];
}
