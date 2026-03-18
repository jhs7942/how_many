# 몇명이니 (HowMany) — Construction ver_5

> 마지막 업데이트: 2026-03-19

---

## 1. 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind v4 + CSS Variables (인라인 스타일 우선) |
| 백엔드/DB | Supabase (PostgreSQL + Realtime + Presence) |
| 상태관리 | React useState/useEffect + Supabase 구독 훅 |
| 로컬 상태 | sessionStorage (`lib/session.ts`) — 페이지 간 임시 전달 |
| 클라이언트 식별 | localStorage UUID (`lib/clientId.ts`) |
| 배포 | Vercel |

---

## 2. 디렉터리 구조 (변경·신규 위주)

```
app/
├── page.tsx                        # 홈 (수정 — 3버튼)
├── result/
│   └── [id]/page.tsx               # 공유 결과 (신규)
├── solo/
│   ├── setting/page.tsx            # 설정 선택 (신규)
│   ├── people/page.tsx             # 인원 선택 (수정 — 이동 경로 변경)
│   ├── custom/page.tsx             # 직접 설정 (신규)
│   ├── location/page.tsx           # 위치 입력 (신규)
│   ├── random/page.tsx             # 랜덤 통합 (신규 — spin 대체)
│   └── result/page.tsx             # 결과 (수정 — 공유 URL 추가)
│   # 삭제: spin/, place/
└── group/
    ├── setting/page.tsx            # 설정 선택 (신규)
    ├── create/page.tsx             # 방 만들기 (대폭 수정)
    ├── join/page.tsx               # 참여하기 (신규)
    ├── lobby/page.tsx              # 대기실 (신규)
    ├── vote/page.tsx               # 투표 (수정)
    ├── vote-status/page.tsx        # 투표 현황 (신규)
    ├── random/page.tsx             # 그룹 랜덤 (신규)
    └── result/page.tsx             # 결과 (수정)
    # 삭제: invite/, nickname/, wait/

components/
├── SpinWheel.tsx                   # 수정 (seed, enableRespin props 추가)
├── ShellGame.tsx                   # 신규 (야바위)
├── CandidateEditor.tsx             # 신규 (직접 설정 입력)
├── LocationInput.tsx               # 신규 (위치 입력)
├── HostDisconnectedModal.tsx       # 신규 (방장 이탈 팝업)
├── NicknameInput.tsx               # 신규 (대기실 인라인)
└── PageLayout.tsx                  # 유지

lib/
├── supabase.ts                     # 신규 — singleton 브라우저 클라이언트
├── clientId.ts                     # 신규 — localStorage UUID 관리
├── types.ts                        # 신규 — DB 타입 정의
├── api/
│   ├── rooms.ts                    # 신규 — 방 CRUD
│   ├── votes.ts                    # 신규 — 투표 CRUD
│   ├── random.ts                   # 신규 — 랜덤 이벤트
│   └── results.ts                  # 신규 — 결과 저장/조회
├── hooks/
│   ├── useRoomSubscription.ts      # 신규 — rooms 구독
│   ├── useParticipants.ts          # 신규 — participants 구독
│   ├── useVoteStatus.ts            # 신규 — 투표 현황 구독
│   ├── useRandomEvent.ts           # 신규 — random_events 구독
│   └── useHostPresence.ts          # 신규 — Presence 채널
├── session.ts                      # 유지
├── data.ts                         # 유지 (ACTIVITY_DATA, PLACE_DATA)
└── utils.ts                        # 유지 (generateRoomCode, copyToClipboard)
```

---

## 3. Supabase DB 스키마

### rooms
```sql
create table rooms (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,           -- 6자리 대문자
  host_client_id text not null,
  mode          text not null,                  -- 'vote' | 'random'
  preset        text not null,                  -- 'default' | 'custom'
  people_count  int,                            -- 기본값 모드일 때
  location      text,                           -- nullable
  time_limit    int not null default 300,       -- 초 단위
  status        text not null default 'waiting', -- waiting | voting | random_playing | finished
  created_at    timestamptz not null default now()
);
```

### room_candidates
```sql
create table room_candidates (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references rooms(id) on delete cascade,
  label      text not null,
  emoji      text not null,
  sort_order int not null
);
```

### participants
```sql
create table participants (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references rooms(id) on delete cascade,
  client_id  text not null,
  nickname   text not null,
  emoji      text not null,
  is_host    boolean not null default false,
  last_seen  timestamptz,
  joined_at  timestamptz not null default now(),
  unique(room_id, client_id)
);
```

### votes
```sql
create table votes (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid references rooms(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  candidate_id   uuid references room_candidates(id) on delete cascade,
  unique(room_id, participant_id)   -- 1인 1표
);
```

### results
```sql
create table results (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid references rooms(id) on delete set null,  -- nullable (Solo 공유용)
  winner_label  text not null,
  winner_emoji  text not null,
  method        text not null,    -- 'vote' | 'spin' | 'shell'
  is_tie        boolean not null default false,
  vote_summary  jsonb,            -- { candidateId: count, ... }
  location      text,
  created_at    timestamptz not null default now()
);
```

### random_events
```sql
create table random_events (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid references rooms(id) on delete cascade,
  event_type       text not null,    -- 'spin' | 'shell'
  seed             bigint not null,
  result_index     int not null,
  is_respin        boolean not null default false,
  respin_direction text,             -- 'left' | 'right' | null
  cup_order        int[]             -- 야바위 컵 순서
);
```

### RLS & Realtime
- RLS: anon key 전체 open (MVP) — 앱 레벨에서 client_id 검증
- Realtime 활성화: `rooms`, `participants`, `votes`, `random_events`

---

## 4. 환경 변수

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 5. 핵심 모듈 설계

### lib/supabase.ts
```ts
// 브라우저 싱글턴 클라이언트
import { createBrowserClient } from '@supabase/ssr'
```

### lib/clientId.ts
```ts
// localStorage에 crypto.randomUUID() 저장/반환
// 탭 종료 후 재접속 시에도 동일 ID 유지
```

### lib/types.ts
```ts
// DB 테이블 대응 인터페이스
// Room, RoomCandidate, Participant, Vote, Result, RandomEvent
// + RoomStatus, RoomMode, RandomEventType 등 유니언 타입
```

---

## 6. 실시간 훅 설계

| 훅 | 구독 | 반환값 |
|----|------|--------|
| `useRoomSubscription(roomId)` | rooms UPDATE | `room: Room` |
| `useParticipants(roomId)` | participants INSERT/DELETE | `participants: Participant[]` |
| `useVoteStatus(roomId)` | votes INSERT → count 집계 | `{ counts: Record<candidateId, number>, completedCount: number, totalCount: number }` |
| `useRandomEvent(roomId)` | random_events INSERT | `event: RandomEvent \| null` |
| `useHostPresence(roomId, isHost)` | Presence Channel | `isHostConnected: boolean` |

### 방장 Presence 로직
- 방장: 5초마다 heartbeat ping
- 참여자: 30초 이상 방장 미감지 → `isHostConnected = false` → `HostDisconnectedModal` 표시

---

## 7. 컴포넌트 설계

### ShellGame.tsx
```ts
// Props
interface ShellGameProps {
  segments: { label: string; emoji: string }[]
  seed?: number
  resultIndex?: number      // 외부에서 결과 지정 (그룹 동기화)
  onResult: (index: number) => void
  viewOnly?: boolean        // 참여자 관람 모드
  hostChoice?: number       // 방장 선택 결과 (viewOnly일 때)
}

// 상태 머신
// idle → showing(2초) → covering → shuffling → choosing → revealing
// seed 기반 Fisher-Yates shuffle (mulberry32 PRNG)
// CSS transform으로 컵 위치 교환 애니메이션
```

### SpinWheel.tsx 수정
```ts
// 기존 props 유지 + 추가
interface SpinWheelProps {
  // 기존...
  seed?: number             // 그룹 동기화용
  enableRespin?: boolean    // 랜덤의 랜덤 (50% 재회전)
}
// spinWithSeed(seed) 메서드 추가 (useImperativeHandle)
```

---

## 8. sessionStorage 키 변경 (ver_5)

### 유지
| 키 | 용도 |
|----|------|
| `splashSeen` | 스플래시 화면 표시 여부 |
| `activity` | Solo 결과 → result 페이지 전달 |
| `people` | Solo 인원 → spin 페이지 전달 |

### 신규
| 키 | 설정 위치 | 사용 위치 |
|----|-----------|-----------|
| `soloMode` | solo/setting | solo/people, solo/custom |
| `soloCandidates` | solo/people, solo/custom | solo/random |
| `soloLocation` | solo/location | solo/random, solo/result |
| `soloResultId` | solo/result | - (공유 URL 생성) |
| `roomId` | group/create | group/lobby 이후 전체 |
| `roomCode` | group/create | group/lobby |
| `myClientId` | lib/clientId.ts | 그룹 전체 |

### 제거 (DB로 이관)
- `roomPeople`, `candidates`, `myNickname`, `myEmoji`, `myVote`

---

## 9. 라우팅 및 상태 전달 흐름

### Solo
```
/solo/setting
  → sessionStorage: soloMode = 'default' | 'custom'
/solo/people (기본값) or /solo/custom (직접)
  → sessionStorage: soloCandidates = Candidate[]
/solo/location
  → sessionStorage: soloLocation = string | null
/solo/random
  → 돌림판/야바위 50:50 자동 선택
  → 결과 후 saveResult() → sessionStorage: soloResultId
/solo/result
  → /result/[soloResultId] 공유 버튼
```

### Group
```
/group/create
  → createRoom() → DB
  → sessionStorage: roomId, roomCode
/group/lobby (방장+참여자 공통)
  → useParticipants() 실시간 구독
  → 방장: 시작 버튼 → updateRoomStatus('voting' | 'random_playing')
/group/vote
  → castVote() → DB
  → 완료 시 /group/vote-status로 이동
/group/vote-status
  → useVoteStatus() 실시간 구독
  → 마감 조건 충족 → /group/result
/group/random
  → 방장: seed 생성 → createRandomEvent()
  → 참여자: useRandomEvent() 구독 → 동일 seed로 재현
  → 완료 시 /group/result
```

---

## 10. 방 코드 유효성 검증

참여 시 순서대로 검증:
1. 코드 형식 유효 (6자리 영숫자)
2. `getRoomByCode()` → 존재하지 않으면 "방을 찾을 수 없습니다"
3. `created_at + 1시간 < now()` → "만료된 방입니다"
4. `status !== 'waiting'` → "이미 시작된 방입니다"
5. 통과 → `/group/lobby`로 이동

클라이언트 보안: 5회 연속 실패 시 30초 쿨다운 (sessionStorage 카운터)

---

## 11. 새로고침/재접속 복구 로직

각 그룹 페이지 진입 시 `useEffect`에서:
```
client_id + roomId → getParticipant() → room.status 확인
  waiting → /group/lobby
  voting  → 내 투표 여부 확인
              투표 완료 → /group/vote-status
              미완료   → /group/vote
  random_playing → /group/result (애니메이션 생략)
  finished → /group/result
```

---

## 12. 참여자 이탈 처리 (투표)

- `participants` 테이블의 `last_seen` 기준으로 30초 이상 미응답 시 이탈 간주
- `useVoteStatus` 훅 내부에서 active participants(last_seen 기준) 수를 M으로 계산
- 투표 완료 후 이탈: vote 레코드 유지, M에서만 제외
- 투표 전 이탈: M-1 반영, 남은 인원 전원 완료 시 자동 마감

---

## 13. 야바위 컵 수 / 야바위 확률

| 후보 수 | 야바위 확률 |
|---------|------------|
| 2~6개 | 50% |
| 7~8개 | 30% (모바일 화면 공간 부족) |

---

## 14. 의존성 변경

### 신규 설치
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 제거 없음 (기존 의존성 유지)

---

## 15. 배포

- 플랫폼: Vercel
- 환경 변수: Vercel 프로젝트 설정에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록
- `npm run build` 타입 에러 없이 통과 후 배포

---

## 16. 구현 순서 (Phase)

| Phase | 내용 |
|-------|------|
| 0 | Supabase 설정 (패키지, 환경변수, DB 스키마, 타입) |
| 1 | 공통 모듈 (api/, hooks/) |
| 2 | 신규 컴포넌트 (ShellGame, SpinWheel 수정, CandidateEditor, LocationInput, HostDisconnectedModal) |
| 3 | Solo 플로우 (setting → custom/people → location → random → result) |
| 4 | Group 플로우 (setting → create → join → lobby → vote/vote-status → random → result) |
| 5 | 홈 수정 + 공유 결과 페이지 + 에지 케이스 (새로고침 복구, 방 만료, 방장 이탈) |
| 6 | 마무리 (globals.css 야바위 키프레임, sessionStorage 정리, CLAUDE.md 업데이트) |
