# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드 (타입 체크 포함)
npm run lint     # ESLint 실행
npm run start    # 빌드 후 프로덕션 서버 실행
```

## 아키텍처 개요

**Solo/Food 플로우**: 순수 프론트엔드. 페이지 간 상태 전달은 `lib/session.ts`(sessionStorage 래퍼)로만 이루어진다. 결과는 Supabase `results` 테이블에 저장 (`saveResult()`).

**Group 플로우**: Supabase Realtime을 통한 멀티 디바이스 동기화. `lib/hooks/` 훅들이 Postgres Changes를 구독해 실시간으로 방 상태·투표·참여자를 반영한다.

### 사용자 플로우

```
혼자 결정 (Solo)
  /solo/setting → /solo/people → /solo/location → /solo/random → /solo/result
                                                                ↘ /solo/place/spin → /solo/place/result
  /solo/setting → /solo/custom → /solo/location → /solo/random → /solo/result

같이 결정 (Group)
  /group/create → /group/invite → /group/nickname → /group/vote → /group/wait → /group/result

맛집 결정 (Food)
  /food/setting → /food/location → /food/random → /food/result
                                                 ↘ /food/detail/random → /food/detail/result
  /food/setting → /food/custom → /food/location → /food/random → /food/result
```

**Solo**: 인원수 추천 or 직접 입력 → 위치 입력(선택) → 4종 게임 랜덤 → 결과 → (선택) 장소 세부 뽑기  
**Group**: 방장이 방 생성 + 후보 설정 → 초대 코드 공유 → 각자 닉네임 등록 → 투표 → 집계  
**Food**: 추천 메뉴 or 직접 입력 → 위치 입력(선택) → 4종 게임 랜덤 → 결과 → (선택) 세부 메뉴 뽑기

### 공용 플로우 컴포넌트 (`components/flow/`)

Solo와 Food 플로우가 공유하는 페이지 로직을 추출한 컴포넌트들. 각 페이지는 이 컴포넌트에 props만 전달하는 얇은 래퍼다.

| 컴포넌트 | 역할 |
|----------|------|
| `FlowSettingPage` | 모드 선택 카드 UI |
| `FlowCustomPage` | `CandidateEditor` + `ActivityPresetPicker` 조합 |
| `FlowLocationPage` | 위치 텍스트 입력 + 건너뛰기 |
| `FlowRandomPage` | 4종 게임(`pickGameType`) 실행 + `saveResult()` 호출 |
| `FlowResultPage` | 결과 표시 + 지도 검색 + 공유 + 세부 뽑기 버튼 |
| `FlowDetailRandomPage` | 2차 랜덤 (`dataMap[parentActivity]` 로드) |
| `FlowDetailResultPage` | 2차 결과 (부모 카테고리 + 세부 메뉴) |

### sessionStorage 키 목록

| 키 | 설정 위치 | 사용 위치 |
|----|-----------|-----------|
| `soloMode` | solo/setting | solo/location (backHref 결정) |
| `soloCandidates` | solo/custom | solo/random |
| `soloLocation` | solo/location | solo/random, solo/result |
| `activity` | solo/random | solo/result, solo/place/spin |
| `soloResultId` | solo/random | solo/result |
| `place` | solo/place/spin | solo/place/result |
| `placeResultId` | solo/place/spin | solo/place/result |
| `foodMode` | food/setting | food/custom |
| `foodCandidates` | food/setting, food/custom | food/random |
| `foodLocation` | food/location | food/random, food/result |
| `foodActivity` | food/random | food/result, food/detail/random |
| `foodResultId` | food/random | food/result |
| `foodDetailActivity` | food/detail/random | food/detail/result |
| `foodDetailResultId` | food/detail/random | food/detail/result |
| `roomCode` | group/create | group/invite, group/nickname |
| `roomPeople` | group/create | group/wait |
| `candidates` | group/create | group/vote |
| `myNickname` | group/nickname | group/vote, group/wait |
| `myEmoji` | group/nickname | group/vote, group/wait |
| `myVote` | group/vote | group/wait |
| `splashSeen` | app/page.tsx | app/page.tsx |
| `devTestMode` | F10 키 토글 | FlowRandomPage (게임 타입 수동 선택 UI 표시) |

### 정적 데이터 (`lib/data.ts`)

- `ACTIVITY_DATA`: 인원수(2–6) → `ActivityItem[]` (Solo 추천 모드)
- `ALL_ACTIVITIES`: 전체 활동 목록 (중복 제거, Solo 직접입력 프리셋)
- `PLACE_DATA`: 활동명 → 장소 유형 배열
- `ALL_FOODS`: 음식 카테고리 목록 (인원수 무관)
- `MENU_DATA`: 음식 카테고리 → 세부 메뉴 배열
- `TIPS_DATA`: 활동명 → 팁 문자열
- `DUMMY_PARTICIPANTS`, `DUMMY_VOTE_RESULTS`: 그룹 결과 화면용 더미

### Supabase DB 테이블 (Group 플로우)

| 테이블 | 역할 |
|--------|------|
| `rooms` | 방 메타데이터 (`status`: waiting→voting→random_playing→finished) |
| `room_candidates` | 방별 후보 목록 |
| `participants` | 닉네임·이모지·`last_seen` (호스트 프레즌스 감지) |
| `votes` | 참여자별 투표 레코드 |
| `results` | Solo/Food/Group 결과 공통 저장 (`room_id` null = Solo/Food) |
| `random_events` | Group 랜덤 게임 동기화 (seed + result_index로 결정론적 재현) |

Realtime 구독은 `lib/hooks/` 훅들이 담당:
- `useRoomSubscription`: 방 상태 변경 감지
- `useParticipants`: 참여자 목록 실시간 동기화
- `useVoteStatus`: 투표 현황 집계
- `useRandomEvent`: 방장이 브로드캐스트한 게임 이벤트 수신
- `useHostPresence`: 방장 연결 상태 감지 (`last_seen` 기반)

### 주요 컴포넌트

- **`SpinWheel`**: Canvas 기반 돌림판. `spin()` / `spinWithSeed(seed, resultIndex)` 노출 (Group 동기화용). `segments` prop 변경 시 재렌더.
- **`CandidateEditor`**: 후보 추가/제거. 자동 이모지 순환 할당.
- **`ActivityPresetPicker`**: 프리셋 토글. `title` prop(기본: `"추천 활동 빠른 선택"`).
- **`PageLayout`**: 모든 페이지를 감싸는 `minHeight: 100dvh` flex 컨테이너.
- **`Toast` / `useToast`**: 토스트 메시지.

### 유틸 (`lib/utils.ts`)

- `pickGameType(count)`: count ≥ 7이면 rope 제외(화면 공간 부족). 나머지는 4종 균등 확률.
- `getAppBaseUrl()`: Capacitor 환경(`localhost` / `capacitor://`)에서는 배포 URL 반환.
- `copyToClipboard()`: Capacitor 네이티브 → `navigator.clipboard` → `execCommand` 순 폴백.

### 스타일 규칙

- Tailwind v4 (`@import "tailwindcss"`) + CSS 변수를 `globals.css` `@theme` 블록에 정의
- **인라인 스타일 우선** — `style={{ }}` 로 작성, Tailwind 클래스는 최소화
- 디자인 토큰: `var(--color-primary)` `#FF7A3D`, `var(--color-bg)` `#FFF7F2`, `var(--color-text)` `#2E2E2E`
- 최대 너비 `430px` (body 고정), 모바일 앱 형태

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://how-many-mauve.vercel.app
```

## 배포 설정

### Vercel
- **운영 URL**: `https://how-many-mauve.vercel.app`
- **배포 방법**: `git push origin main` → GitHub 연동 자동 배포 (`vercel --prod` CLI는 이 프로젝트에서 동작 안 함)
- **제외 파일**: `.vercelignore`에 `android/`, `test-results/`, `script.md` 포함

### Android (Capacitor)
- **앱 ID**: `com.howmany.app`
- **빌드**:
  ```bash
  npm run build:android   # Next.js static export + cap sync
  cd android && JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home ./gradlew bundleRelease
  ```
- **AAB 출력**: `android/app/build/outputs/bundle/release/app-release.aab`
- **키스토어**: `android/howmany-release.keystore` + `android/key.properties` (git 제외, 별도 백업)

---

### Hydration 주의

`session.get()`은 클라이언트 전용. 컴포넌트 최상위 스코프 호출 시 **Hydration Error #418** 발생.

```tsx
// ❌ 잘못된 패턴
const people = session.get<number>('people') ?? 4;

// ✅ 올바른 패턴
const [people, setPeople] = useState(4);
useEffect(() => { setPeople(session.get<number>('people') ?? 4); }, []);
```
