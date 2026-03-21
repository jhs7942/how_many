export type RoomStatus = 'waiting' | 'voting' | 'random_playing' | 'finished';
export type RoomMode = 'vote' | 'random';
export type RandomEventType = 'spin' | 'shuffle' | 'slot' | 'rope';

export interface Room {
  id: string;
  code: string;
  host_client_id: string;
  mode: RoomMode;
  preset: 'default' | 'custom';
  people_count: number | null;
  location: string | null;
  time_limit: number;
  status: RoomStatus;
  created_at: string;
}

export interface RoomCandidate {
  id: string;
  room_id: string;
  label: string;
  emoji: string;
  sort_order: number;
}

export interface Participant {
  id: string;
  room_id: string;
  client_id: string;
  nickname: string;
  emoji: string;
  is_host: boolean;
  last_seen: string | null;
  joined_at: string;
}

export interface Vote {
  id: string;
  room_id: string;
  participant_id: string;
  candidate_id: string;
}

export interface Result {
  id: string;
  room_id: string | null;
  winner_label: string;
  winner_emoji: string;
  method: 'vote' | 'spin' | 'shuffle' | 'slot' | 'rope';
  is_tie: boolean;
  vote_summary: Record<string, number> | null;
  location: string | null;
  created_at: string;
}

export interface RandomEvent {
  id: string;
  room_id: string;
  event_type: RandomEventType;
  seed: number;
  result_index: number;
  is_respin: boolean;
  respin_direction: 'left' | 'right' | null;
  cup_order: number[] | null;
}
