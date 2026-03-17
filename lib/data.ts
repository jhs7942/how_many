// 인원 기반 활동 데이터
export const ACTIVITY_DATA: Record<number, { label: string; emoji: string }[]> = {
  2: [
    { label: '카페', emoji: '☕' },
    { label: '산책', emoji: '🚶' },
    { label: '전시', emoji: '🎨' },
    { label: '영화', emoji: '🎬' },
  ],
  3: [
    { label: '카페', emoji: '☕' },
    { label: '술집', emoji: '🍺' },
    { label: '보드게임', emoji: '🎲' },
    { label: '노래방', emoji: '🎤' },
  ],
  4: [
    { label: '노래방', emoji: '🎤' },
    { label: '보드게임', emoji: '🎲' },
    { label: '방탈출', emoji: '🔐' },
    { label: '볼링', emoji: '🎳' },
  ],
  5: [
    { label: '고깃집', emoji: '🥩' },
    { label: '술집', emoji: '🍺' },
    { label: '볼링', emoji: '🎳' },
    { label: '방탈출', emoji: '🔐' },
  ],
  6: [
    { label: '고깃집', emoji: '🥩' },
    { label: '볼링', emoji: '🎳' },
    { label: '술집', emoji: '🍺' },
    { label: '노래방', emoji: '🎤' },
  ],
};

// 활동별 장소 유형 데이터
export const PLACE_DATA: Record<string, { label: string; emoji: string }[]> = {
  '카페': [
    { label: '아늑한 카페', emoji: '☕' },
    { label: '루프탑 카페', emoji: '🏙️' },
    { label: '베이커리 카페', emoji: '🥐' },
    { label: '북카페', emoji: '📚' },
  ],
  '산책': [
    { label: '한강공원', emoji: '🌊' },
    { label: '도심 공원', emoji: '🌳' },
    { label: '숲길', emoji: '🌲' },
    { label: '야경 명소', emoji: '✨' },
  ],
  '전시': [
    { label: '미술관', emoji: '🖼️' },
    { label: '갤러리', emoji: '🎨' },
    { label: '팝업 전시', emoji: '📸' },
    { label: '박물관', emoji: '🏛️' },
  ],
  '영화': [
    { label: '멀티플렉스', emoji: '🎬' },
    { label: '독립영화관', emoji: '🎥' },
    { label: '4DX/IMAX', emoji: '🌀' },
    { label: '드라이브인', emoji: '🚗' },
  ],
  '노래방': [
    { label: '코인 노래방', emoji: '🪙' },
    { label: '일반 노래방', emoji: '🎤' },
    { label: '프리미엄 룸', emoji: '👑' },
    { label: '주점 노래방', emoji: '🍺' },
  ],
  '술집': [
    { label: '포장마차', emoji: '🏮' },
    { label: '이자카야', emoji: '🍶' },
    { label: '와인바', emoji: '🍷' },
    { label: '수제맥주 바', emoji: '🍻' },
  ],
  '보드게임': [
    { label: '보드게임 카페', emoji: '🎲' },
    { label: '방탈출 카페', emoji: '🔐' },
    { label: '오락실', emoji: '🕹️' },
    { label: '다트바', emoji: '🎯' },
  ],
  '방탈출': [
    { label: '공포 테마', emoji: '👻' },
    { label: '추리 테마', emoji: '🔍' },
    { label: '액션 테마', emoji: '💥' },
    { label: '판타지 테마', emoji: '🧙' },
  ],
  '볼링': [
    { label: '볼링장', emoji: '🎳' },
    { label: '스크린 스포츠', emoji: '🏆' },
    { label: '스포츠 복합관', emoji: '⚽' },
    { label: '당구장', emoji: '🎱' },
  ],
  '고깃집': [
    { label: '삼겹살 집', emoji: '🥓' },
    { label: '소고기 전문점', emoji: '🥩' },
    { label: '양고기 구이', emoji: '🍖' },
    { label: '닭갈비 집', emoji: '🍗' },
  ],
};

// 더미 참여자 데이터
export const DUMMY_PARTICIPANTS = [
  { name: '민준', voted: true, emoji: '🐯' },
  { name: '서연', voted: true, emoji: '🦊' },
  { name: '지호', voted: false, emoji: '🐧' },
  { name: '하은', voted: false, emoji: '🐰' },
  { name: '도윤', voted: true, emoji: '🦁' },
];

// 더미 투표 결과 데이터
export const DUMMY_VOTE_RESULTS = [
  { label: '보드게임', emoji: '🎲', votes: 3 },
  { label: '노래방', emoji: '🎤', votes: 3 },
  { label: '방탈출', emoji: '🔐', votes: 2 },
  { label: '볼링', emoji: '🎳', votes: 1 },
];
