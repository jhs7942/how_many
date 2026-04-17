# 아키텍처 설계서

## 1. 시스템 개요

"몇명이니"는 모임 활동/맛집을 랜덤 게임으로 결정하는 모바일 우선 웹 애플리케이션이다. Next.js App Router 기반 SPA로, Solo/Food 플로우는 순수 클라이언트 사이드, Group 플로우는 Supabase Realtime을 통한 서버 동기화 구조를 갖는다.

### 기술 스택

| 계층 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.7 |
| UI 라이브러리 | React | 19.2.3 |
| 언어 | TypeScript | 5.x |
| 스타일 | Tailwind CSS v4 + CSS 변수 | 4.x |
| BaaS | Supabase (PostgreSQL + Realtime + Auth) | 2.99.2 |
| 모바일 래퍼 | Capacitor | 8.2.0 |
| 테스트 | Playwright | 1.58.2 |
| 배포 (웹) | Vercel | - |
| 배포 (앱) | Google Play Console | - |

---

## 2. 아키텍처 다이어그램

```
+-------------------+     +-------------------+     +-------------------+
|     사용자          |     |     사용자          |     |     사용자          |
|   (모바일 브라우저)    |     |  (Android 앱)     |     |  (PC 브라우저)     |
+--------+----------+     +--------+----------+     +--------+----------+
         |                          |                          |
         +------------+-------------+-------------+------------+
                      |                           |
                      v                           v
              +-------+-------+           +-------+-------+
              |   Vercel CDN   |           |  Capacitor    |
              | (Next.js SSR)  |           | (WebView)     |
              +-------+-------+           +-------+-------+
                      |                           |
                      +------------+--------------+
                                   |
                                   v
                      +------------+------------+
                      |      Supabase           |
                      |  +------------------+   |
                      |  | PostgreSQL       |   |
                      |  | (rooms, votes,   |   |
                      |  |  participants,   |   |
                      |  |  results, ...)   |   |
                      |  +------------------+   |
                      |  | Realtime         |   |
                      |  | (Postgres Changes|   |
                      |  |  + Broadcast)    |   |
                      |  +------------------+   |
                      +-------------------------+
```

---

## 3. 클라이언트 아키텍처

### 3.1 디렉토리 구조

```
app/                          # Next.js App Router
  layout.tsx                  # 루트 레이아웃 (Pretendard, Kakao SDK, AndroidBackHandler)
  page.tsx                    # 홈 (스플래시 + 4개 카드)
  globals.css                 # @theme 블록 + 디자인 토큰
  solo/                       # 혼자 결정 플로우 (7 페이지)
  food/                       # 맛집 결정 플로우 (7 페이지)
  group/                      # 같이 결정 플로우 (10+ 페이지)
  result/[id]/                # 공유 결과 페이지 (동적 라우트)
  privacy/                    # 개인정보처리방침

components/
  flow/                       # Solo/Food 공용 플로우 컴포넌트 (7개)
  SpinWheel.tsx               # Canvas 기반 돌림판
  ContentShuffle.tsx          # 컵 셔플 애니메이션
  SlotMachine.tsx             # 3릴 슬롯머신
  RopePull.tsx                # 줄뽑기
  CandidateEditor.tsx         # 후보 편집 (추가/제거/이모지)
  ActivityPresetPicker.tsx    # 프리셋 토글
  PageLayout.tsx              # 전체 페이지 래퍼
  Toast.tsx                   # 토스트 알림
  BackButton.tsx              # 뒤로가기 버튼
  AndroidBackHandler.tsx      # Capacitor 물리 백 버튼 처리
  UrlNormalizer.tsx           # URL 정규화

lib/
  data.ts                     # 정적 데이터 (활동, 음식, 장소, 팁)
  session.ts                  # sessionStorage 타입세이프 래퍼
  supabase.ts                 # Supabase 브라우저 클라이언트 (싱글턴)
  kakao.ts                    # 카카오 공유 API
  utils.ts                    # pickGameType, getAppBaseUrl, copyToClipboard
  types.ts                    # 타입 정의 (Room, Participant, Vote, Result 등)
  clientId.ts                 # 클라이언트 식별자
  hooks/                      # Supabase Realtime 구독 훅
    useRoomSubscription.ts    # 방 상태 변경 감지
    useParticipants.ts        # 참여자 목록 실시간 동기화
    useVoteStatus.ts          # 투표 현황 집계
    useVoteTimer.ts           # 투표 타이머
    useRandomEvent.ts         # 랜덤 게임 이벤트 수신
    useHostPresence.ts        # 방장 연결 상태 감지
    useRoomResult.ts          # 방 결과 조회

assets/data/                  # JSON 데이터 파일
  foods.json                  # 음식 카테고리 12종
  menus.json                  # 카테고리별 세부 메뉴
  food-tips.json              # 음식별 추천 팁
```

### 3.2 공용 플로우 컴포넌트 패턴

Solo와 Food 플로우는 동일한 로직을 공유한다. 공용 컴포넌트가 비즈니스 로직을 담당하고, 각 페이지는 props만 전달하는 얇은 래퍼 역할을 한다.

```
FlowSettingPage     - 모드 선택 (추천 vs 직접입력)
FlowCustomPage      - CandidateEditor + ActivityPresetPicker 조합
FlowLocationPage    - 위치 텍스트 입력 + 건너뛰기
FlowRandomPage      - 4종 게임 실행 + 결과 저장
FlowResultPage      - 결과 표시 + 지도 검색 + 공유
FlowDetailRandomPage - 2차 랜덤 (세부 메뉴/장소)
FlowDetailResultPage - 2차 결과 표시
```

예시 (Food 랜덤 페이지):
```tsx
// app/food/random/page.tsx
export default function FoodRandomPage() {
  return (
    <FlowRandomPage
      backHref="/food/location"
      sessionKeys={{
        candidates: 'foodCandidates',
        location: 'foodLocation',
        activity: 'foodActivity',
        resultId: 'foodResultId',
      }}
      resultHref="/food/result"
    />
  );
}
```

---

## 4. 상태 관리

### 4.1 Solo/Food 플로우: sessionStorage

서버 상태 없이 클라이언트 `sessionStorage`만 사용한다. `lib/session.ts`가 타입세이프 래퍼를 제공한다.

```
session.set<T>(key, value)  // JSON.stringify 후 저장
session.get<T>(key)         // JSON.parse 후 반환 (null 가능)
session.remove(key)
```

#### Hydration 안전 패턴

`session.get()`은 클라이언트 전용이므로, 컴포넌트 최상위에서 직접 호출하면 Hydration Error가 발생한다.

```tsx
// 올바른 패턴
const [value, setValue] = useState(defaultValue);
useEffect(() => {
  setValue(session.get<T>(key) ?? defaultValue);
}, []);
```

#### sessionStorage 키 맵

| 플로우 | 키 | 데이터 |
|--------|------|--------|
| Solo | `soloMode`, `soloCandidates`, `soloLocation`, `activity`, `soloResultId` | 모드, 후보, 위치, 당첨 활동, 결과 ID |
| Solo (장소) | `place`, `placeResultId` | 세부 장소, 결과 ID |
| Food | `foodMode`, `foodCandidates`, `foodLocation`, `foodActivity`, `foodResultId` | 모드, 후보, 위치, 당첨 음식, 결과 ID |
| Food (세부) | `foodDetailActivity`, `foodDetailResultId` | 세부 메뉴, 결과 ID |
| Group | `roomCode`, `roomPeople`, `candidates`, `myNickname`, `myEmoji`, `myVote` | 방코드, 인원, 후보, 닉네임, 이모지, 투표 |
| 공통 | `splashSeen`, `devTestMode` | 스플래시 표시 여부, 개발 테스트 모드 |

### 4.2 Group 플로우: Supabase Realtime

Group 플로우는 Supabase Realtime의 Postgres Changes를 구독하여 멀티 디바이스 상태를 동기화한다.

```
방장 (Host)                              참여자 (Participant)
    |                                          |
    |-- rooms INSERT -----------------------> useRoomSubscription
    |-- room_candidates INSERT ------------> (초기 로드)
    |                                          |
    |                                     participants INSERT
    |<- useParticipants ------------------|
    |                                          |
    |-- rooms.status = 'voting' ----------> useRoomSubscription
    |                                          |
    |                                     votes INSERT
    |<- useVoteStatus --------------------|
    |                                          |
    |-- random_events INSERT (seed) -------> useRandomEvent
    |                                          |
    |-- results INSERT --------------------> useRoomResult
```

#### Realtime 훅 목록

| 훅 | 구독 대상 | 역할 |
|------|-----------|------|
| `useRoomSubscription` | `rooms` UPDATE | 방 상태 변경 감지 (waiting -> voting -> finished) |
| `useParticipants` | `participants` INSERT/DELETE | 참여자 목록 실시간 동기화 |
| `useVoteStatus` | `votes` INSERT | 투표 현황 집계 |
| `useVoteTimer` | - | 투표 타이머 (5분 하드코딩) |
| `useRandomEvent` | `random_events` INSERT | 방장의 게임 이벤트 수신 (seed + result_index) |
| `useHostPresence` | `participants` UPDATE | 방장 last_seen 기반 연결 감지 |
| `useRoomResult` | `results` INSERT | 결과 조회 |

---

## 5. 데이터베이스 스키마

Supabase PostgreSQL. Solo/Food 결과 저장과 Group 실시간 동기화에 사용한다.

### 5.1 테이블 구조

#### rooms
방 메타데이터. Group 플로우의 핵심 테이블.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | 방 고유 ID |
| `code` | text (UNIQUE) | 6자리 초대 코드 |
| `host_client_id` | text | 방장 클라이언트 ID |
| `mode` | text | `'vote'` 또는 `'random'` |
| `preset` | text | `'default'` 또는 `'custom'` |
| `people_count` | integer | 인원수 (nullable) |
| `location` | text | 위치 (nullable) |
| `time_limit` | integer | 투표 제한 시간 (초) |
| `status` | text | `'waiting'` -> `'voting'` -> `'random_playing'` -> `'finished'` |
| `vote_started_at` | timestamptz | 투표 시작 시각 |
| `created_at` | timestamptz | 생성 시각 |

#### room_candidates
방별 후보 목록.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | |
| `room_id` | uuid (FK -> rooms) | 방 ID |
| `label` | text | 후보 이름 |
| `emoji` | text | 이모지 |
| `sort_order` | integer | 정렬 순서 |

#### participants
참여자 정보. `last_seen`으로 방장 프레즌스를 감지한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | |
| `room_id` | uuid (FK -> rooms) | 방 ID |
| `client_id` | text | 클라이언트 식별자 |
| `nickname` | text | 닉네임 |
| `emoji` | text | 이모지 |
| `is_host` | boolean | 방장 여부 |
| `last_seen` | timestamptz | 마지막 활성 시각 |
| `joined_at` | timestamptz | 참여 시각 |

#### votes
참여자별 투표 레코드.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | |
| `room_id` | uuid (FK -> rooms) | 방 ID |
| `participant_id` | uuid (FK -> participants) | 참여자 ID |
| `candidate_id` | uuid (FK -> room_candidates) | 선택한 후보 ID |

#### results
Solo/Food/Group 결과 공통 저장. `room_id`가 null이면 Solo/Food 결과.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | |
| `room_id` | uuid (FK -> rooms, nullable) | null = Solo/Food |
| `winner_label` | text | 당첨 항목 이름 |
| `winner_emoji` | text | 당첨 항목 이모지 |
| `method` | text | `'vote'`, `'spin'`, `'shuffle'`, `'slot'`, `'rope'` |
| `is_tie` | boolean | 동점 여부 |
| `vote_summary` | jsonb | 투표 집계 (nullable) |
| `location` | text | 위치 (nullable) |
| `created_at` | timestamptz | 생성 시각 |

#### random_events
Group 랜덤 게임 동기화. seed와 result_index로 결정론적 재현을 보장한다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | |
| `room_id` | uuid (FK -> rooms) | 방 ID |
| `event_type` | text | `'spin'`, `'shuffle'`, `'slot'`, `'rope'` |
| `seed` | integer | 난수 시드 |
| `result_index` | integer | 결과 인덱스 |
| `is_respin` | boolean | 재회전 여부 |
| `respin_direction` | text | 재회전 방향 (`'left'`, `'right'`, null) |
| `cup_order` | integer[] | 컵 순서 (셔플용) |

### 5.2 상태 전이 (rooms.status)

```
waiting ---------> voting ---------> random_playing ---------> finished
  (방 생성)      (투표 시작)        (랜덤 게임 진행)           (결과 확정)
```

---

## 6. 랜덤 게임 시스템

### 6.1 게임 타입 선택 로직

`pickGameType(count)` 함수가 후보 수에 따라 게임을 선택한다.

| 후보 수 | 가능한 게임 | 이유 |
|---------|------------|------|
| 1~6 | spin, shuffle, slot, rope | 4종 균등 확률 |
| 7+ | spin, shuffle, slot | rope 제외 (화면 공간 부족) |

### 6.2 Group 동기화

Group 플로우에서는 모든 참여자가 동일한 결과를 봐야 한다. 이를 위해 방장이 `seed`와 `result_index`를 생성하여 `random_events` 테이블에 INSERT하면, 참여자 클라이언트가 이를 구독하여 결정론적으로 동일한 애니메이션을 재현한다.

```
방장: seed = Math.random() * 10000, result_index = 3
  -> random_events INSERT
  -> 모든 참여자: spinWithSeed(seed, resultIndex) 호출
  -> 동일한 결과 + 유사한 애니메이션
```

### 6.3 게임 컴포넌트 API

| 컴포넌트 | 외부 호출 | Group 동기화 |
|----------|----------|-------------|
| `SpinWheel` | `spin()`, `spinWithSeed(seed, idx)` | `spinWithSeed` |
| `ContentShuffle` | `shuffle()` | seed 기반 순서 재현 |
| `SlotMachine` | `spin()` | seed 기반 결과 결정 |
| `RopePull` | - | seed 기반 결과 결정 |

---

## 7. 정적 데이터 구조

`lib/data.ts`에서 JSON 파일을 import하여 타입 안전하게 제공한다.

| 데이터 | 설명 | 형태 |
|--------|------|------|
| `ACTIVITY_DATA` | 인원수(2~6) -> 추천 활동 | `Record<number, ActivityItem[]>` |
| `ALL_ACTIVITIES` | 전체 활동 목록 (중복 제거) | `ActivityItem[]` |
| `PLACE_DATA` | 활동 -> 장소 유형 | `Record<string, ActivityItem[]>` |
| `ALL_FOODS` | 음식 카테고리 12종 | `ActivityItem[]` |
| `MENU_DATA` | 음식 카테고리 -> 세부 메뉴 | `Record<string, ActivityItem[]>` |
| `TIPS_DATA` | 활동 -> 팁 문자열 | `Record<string, string>` |

`ActivityItem` 타입:
```typescript
{ label: string; emoji: string }
```

---

## 8. 배포 아키텍처

### 8.1 웹 (Vercel)

```
git push origin main
  -> GitHub webhook
  -> Vercel 자동 빌드 (next build)
  -> CDN 배포
  -> https://how-many-mauve.vercel.app
```

- `.vercelignore`로 `android/`, `test-results/`, `script.md` 제외
- 환경변수는 Vercel 대시보드에서 관리

### 8.2 Android (Capacitor)

```
npm run build:android
  -> NEXT_STATIC_EXPORT=true next build  (정적 HTML 출력 -> /out)
  -> npx cap sync android               (웹 에셋 -> android/app/src/main/assets)
  -> ./gradlew bundleRelease             (AAB 빌드)
  -> Google Play Console 업로드
```

- `capacitor.config.ts`의 `server.url`이 Vercel 배포 URL을 가리킨다
- Android 앱은 WebView로 웹 앱을 로드하는 구조
- 네이티브 플러그인: Haptics, Clipboard, Share, SplashScreen, StatusBar

### 8.3 정적 빌드 전환

`next.config.ts`에서 `NEXT_STATIC_EXPORT` 환경변수로 빌드 모드를 전환한다.

```typescript
const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';
const nextConfig = {
  ...(isStaticExport && {
    output: 'export',        // 정적 HTML 출력
    trailingSlash: true,     // /path/ 형태
    images: { unoptimized: true },
  }),
};
```

---

## 9. 외부 서비스 연동

| 서비스 | 용도 | 연동 방식 |
|--------|------|----------|
| Supabase | DB + Realtime | `@supabase/ssr` 브라우저 클라이언트 |
| Kakao JavaScript SDK | 카카오톡 공유 | `<Script>` 태그 로드 + `lib/kakao.ts` 래퍼 |
| Capacitor | Android 네이티브 기능 | 플러그인 API (Haptics, Clipboard, Share 등) |

---

## 10. 알려진 제약사항

| 항목 | 현황 | 영향 |
|------|------|------|
| Supabase RLS | 현재 anon 전체 허용 | Group 데이터 접근 제어 미비 |
| 에러 처리 | catch만 존재, 재시도 UI 없음 | 네트워크 불안정 시 UX 저하 |
| 후보 최소값 | 1개도 허용 | 게임 무의미한 상태 가능 |
| 인원 제한 | 2~6인만 지원 | 대규모 모임 미지원 |
| 테스트 | E2E만 존재 | 단위 테스트 부재 |
