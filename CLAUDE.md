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
- **빌드 스크립트**:
  ```bash
  # 프로덕션 빌드 (기본) — prod URL 고정
  npm run build:android        # = build:android:prod 과 동일
  npm run build:android:prod   # 명시적 prod 빌드

  # 개발 빌드 — CAPACITOR_SERVER_URL을 shell에서 주입
  CAPACITOR_SERVER_URL=https://how-many-git-develop-xxx.vercel.app npm run build:android:dev

  # AAB 생성
  cd android && JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home ./gradlew bundleRelease
  ```
- **AAB 출력**: `android/app/build/outputs/bundle/release/app-release.aab`
- **키스토어**: `android/howmany-release.keystore` + `android/key.properties` (git 제외, 별도 백업)
- **트랙 정책**: 내부 테스트 트랙 = dev URL 빌드, 프로덕션 트랙 = prod URL 빌드
- **versionCode 규칙**: dev/prod 모두 같은 `applicationId`를 사용하므로, versionCode는 **전역 단조 증가**해야 한다 (dev 10 → prod 11 → dev 12 ...). Play Console이 동일 앱의 모든 트랙에서 versionCode 유일성을 요구함.

### 브랜치 전략

```
develop → main
  ↑
(feature 브랜치는 선택사항)
```

**기본 원칙: 모든 구현은 `develop` 브랜치에서 직접 커밋한다.** 2026-04 이후 실제 워크플로우.

- **develop**: 개발 통합 브랜치 **겸 작업 브랜치**. Vercel preview URL(`how-many-git-develop-*.vercel.app`)이 자동 할당됨. 내부 테스트 AAB는 이 URL을 바라봄. 대부분의 버그 수정·기능 개발이 여기서 직접 이루어짐.
- **main**: 프로덕션. 실기기 검증 완료 후 사용자 승인 시 `develop → main` fast-forward 머지. `git push origin main` → Vercel 자동 배포 → 실사용자 즉시 반영.
- **feature 브랜치 (선택)**: 다음 상황에서만 분기한다.
  - 여러 세션에 걸친 대규모 작업으로 중간 상태가 develop에 노출되면 안 될 때
  - 실험적 변경이라 롤백 가능성이 높을 때
  - 외부 리뷰·PR 검토가 필요한 기여
  - 네이밍: Linear 자동 생성 형식 `saver7942/hm-{번호}-{제목-slug}` 사용
  - 완료 시 `develop` 으로 PR → 머지 → feature 브랜치 삭제

## Linear 이슈 트래킹

### 팀 구성 (2인)

| 역할 | 이름 | 이메일 | Linear user id | 주 책임 |
|---|---|---|---|---|
| 개발자 (project lead) | 정현승 | saver7942@gmail.com | `393b680a-570b-40ce-8158-90b2bd7178dc` | 분석·설계·구현·리뷰·배포, 이슈 상태 전이 주도 |
| 기획자 / QA | [서울_18반_문은서] | rlashfod0202@gmail.com | `a1d2088f-02e1-4466-9ead-d46d92824959` | 버그 제보·재현 검증·Done 확정, 요구사항 피드백 |

- 두 사람 모두 HM 팀 admin 권한 보유
- 프로젝트 `몇명이니 v1.1 안정화`의 project member에는 lead인 정현승만 등록됨 (Linear UI상 분리)

### 워크스페이스 / 프로젝트

| 항목 | 값 |
|---|---|
| 워크스페이스 | https://linear.app/wqeqw |
| Team | `몇명이니` (key: HM, id: `04715cd9-4111-410d-96f9-82db1a0a3c1b`) |
| Active Project | `몇명이니 v1.1 안정화` (MVP 출시 후 안정화 단계, 시작일 2026-04-16, 상태 In Progress) |
| 동기화 대상 | `sync_target: linear` (GitHub 미사용) |
| 로컬 메타 | `.claude/plans/progress.md § Linear` |

### 상태 플로우

```
Backlog ─▶ Todo ─▶ In Progress ─▶ In Review ─▶ Done
   ▲                                   │
   └─── 재오픈(재현 실패) ──────────────┘
```

| 상태 | 의미 | 주 담당 | 전이 트리거 |
|---|---|---|---|
| Backlog | 아이디어·미분류 | 기획자 | 이슈 생성 직후 |
| Todo | 이번 사이클 진행 예정 | 기획자 → 개발자 | 우선순위 확정, 개발자 픽업 대기 |
| In Progress | 구현·조사 중 | 개발자 | 개발자 착수 시점 |
| In Review | 코드 반영 완료, 재현 검증 대기 | 개발자 → 기획자 | 커밋·배포 후 Linear 코멘트로 "재현 부탁" |
| Done | 해결 확정 | 기획자 | 기획자 재현 확인 완료 |

### 이슈 라이프사이클 (표준 버그 기준)

1. **기획자가 이슈 생성** — 증상·영향·재현·스크린샷을 description에 기록 (Backlog)
2. **개발자가 분석·픽업** — description을 코드 맥락과 대조, Todo로 이동하며 우선순위 라벨 부여
3. **개발자가 작업 착수** — `In Progress`로 전이 + `phase/implement` 라벨
4. **개발자가 코드 반영·검증** — 로컬 빌드/테스트 후 커밋 푸시, Linear 코멘트에 "수정 완료 + 재현 부탁" 기록, `In Review`로 전이
5. **기획자 재현 확인** — Vercel 배포본 또는 Android 기기에서 증상 소거 검증
   - 정상: `Done`으로 전이 (완료 코멘트 선택)
   - 실패: `Todo`로 되돌리고 추가 재현 정보(기기·환경·로그) 코멘트

### 라벨 체계 (16종)

4개 축으로 구성. 한 이슈에 축 당 최대 1개 라벨 부착 권장.

| 축 | 라벨 | 용도 |
|---|---|---|
| **phase/** (6) | `ideate` · `design` · `implement` · `review` · `docs` · `done` | dev-orchestrator 파이프라인 단계. Claude가 자동 전이 |
| **type/** (4) | `feature` · `bug` · `improvement` · `infra` | 이슈 분류 (리포트·대시보드용) |
| **priority/** (4) | `urgent` · `high` · `medium` · `low` | 처리 우선순위. Linear 내장 priority와 병행 사용 |
| **status/** (2) | `blocked` · `needs-info` | 특수 상태. `blocked` 감지 시 dev-orchestrator가 Phase 정지 |

라벨 id 매핑 전체는 `.claude/plans/progress.md § Linear > label_map` 참조.

### 동기화 메커니즘

| 방향 | 트리거 | 실행 주체 | 커맨드 |
|---|---|---|---|
| Claude → Linear | Phase 경계 + 수동 | 개발자 (Claude Code) | `/project/linear-sync` 또는 dev-orchestrator 훅 자동 |
| Linear → Claude | 세션 재개·Phase 전이 + 수동 | 개발자 | `/project/linear-pull` |
| 상태 조회 | 수동 | 누구든 | `/project/linear-status` |

- progress.md 단일 source of truth 원칙
- 기획자가 Linear 웹에서 직접 편집한 변경(`createdBy = 문은서` 기반)은 반드시 `/project/linear-pull`로 drift 반영
- Claude Code는 Linear webhook을 실시간으로 받을 수 없으므로 **세션 재개 시점이 동기화 포인트**

### 대표 이슈 예시

| 이슈 | 작성자 | 성격 |
|---|---|---|
| HM-22 (웹↔앱 방장 무한 대기) | 기획자 (문은서) | 외부 QA 리포트. description + 스크린샷 + 원인 추측 코멘트 포함 |
| HM-1 ~ HM-21 | 개발자 (정현승) | 초기 백로그. QA 피드백 + 코드 리뷰 결과를 일괄 이슈화 |

### Git 브랜치 컨벤션

**기본은 `develop` 직커밋** (위 `## 배포 설정 > 브랜치 전략` 참조). feature 브랜치를 만드는 경우에만 Linear 자동 생성 브랜치명 `saver7942/hm-{번호}-{제목-slug}` 사용.

- develop 직커밋 시: 커밋 메시지에 이슈 identifier(예: `HM-22`)를 포함하면 Linear가 자동 링킹.
- PR을 만드는 경우: PR 본문 상단에 이슈 identifier를 넣으면 자동 링킹하며, 머지 시 관련 이슈의 `phase/implement → phase/review` 전이가 트리거된다.

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
