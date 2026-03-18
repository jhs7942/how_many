// ===== 공통 타입 =====
export interface Candidate {
  id?: string;
  label: string;
  emoji: string;
  sort_order?: number;
}

export interface Participant {
  id: string;
  room_id: string;
  nickname: string;
  emoji: string;
  is_host: boolean;
  created_at?: string;
}

// ===== 방 관련 타입 =====
export type RoomMode = 'vote' | 'random';
export type RoomPreset = 'default' | 'custom';
export type RoomStatus = 'waiting' | 'voting' | 'spinning' | 'closed';

export interface Room {
  id: string;
  code: string;
  host_id: string;
  mode: RoomMode;
  preset: RoomPreset;
  people_count: number | null;
  location_text: string | null;
  location_lat: number | null;
  location_lng: number | null;
  time_limit: number;
  status: RoomStatus;
  created_at?: string;
}

export interface RoomWithCandidates extends Room {
  room_candidates: Candidate[];
}

// ===== 투표 타입 =====
export interface Vote {
  id: string;
  room_id: string;
  participant_id: string;
  candidate_id: string;
  created_at?: string;
}

export interface VoteResult {
  candidate: Candidate;
  count: number;
  percentage: number;
}

// ===== 결과 타입 =====
export interface Result {
  id: string;
  room_id: string | null;
  winner_label: string;
  winner_emoji: string;
  method: 'vote' | 'random';
  is_tie: boolean;
  vote_summary: VoteResult[] | null;
  created_at?: string;
}

// ===== 랜덤 이벤트 타입 =====
export type RandomEventType = 'spin' | 'shell';

export interface RandomEvent {
  id: string;
  room_id: string;
  event_type: RandomEventType;
  seed: number;
  result_index: number | null;
  is_respin: boolean;
  respin_direction: 'left' | 'right' | null;
  created_at?: string;
}

// ===== 세션 타입 =====
export interface SoloSession {
  people?: number;
  activity?: Candidate;
  location?: string;
  candidates?: Candidate[];
  randomMethod?: 'spin' | 'shell';
  resultId?: string;
}

export interface GroupSession {
  roomCode?: string;
  roomId?: string;
  hostId?: string;
  participantId?: string;
  myNickname?: string;
  myEmoji?: string;
  candidates?: Candidate[];
  roomMode?: RoomMode;
  myVote?: Candidate;
  splashSeen?: boolean;
}
