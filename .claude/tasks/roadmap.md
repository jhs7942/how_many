# Taskboard: 몇명이니 v1.1 안정화 (우선순위 기반 Linear Todo 해결)

생성일: 2026-04-23
기반: `/linear:todo` 분석 결과 (2026-04-23)
Linear 프로젝트: `몇명이니 v1.1 안정화`
범위: Linear Team HM의 Todo 상태 이슈 5건을 우선순위 순으로 처리

## 진행 현황
완료: 0/5 | 현재: 없음 | 검증 대기: Task 001, Task 002

### 이전 로드맵
- `roadmap.hm-23.archive.md` — HM-23 (dev URL 분리) 완료 보관본

## 우선순위 선정 근거

| 이슈 | 우선순위 | 근거 |
|---|---|---|
| HM-27 | High | 사용자 혼란 직접 유발 (타이머 정지 = 투표 실패로 오인). 수정 규모 Small |
| HM-28 | High | 실기기 UI 파손. foldable 시장 비중 고려 대응 필요. Small-Medium |
| HM-29 | Medium | UX 개선. 기획 합의 선행 필요 (블록 존재) |
| HM-20 | Low | DB/read 기반 이미 구현, UI만 추가 |
| HM-18 | Low | 순수 연출 강화. 안정화 기능과 무관 |

## 태스크 목록

### Task 001: HM-27 투표 타이머 초기값 동기화 수정
- 상태: IN_REVIEW (코드 구현·develop 푸시 완료, QA 재현 검증 대기)
- 시작일: 2026-04-23
- 구현 커밋: `3a91c38`
- 배포: develop → Vercel preview URL 자동 배포
- 예상 규모: Small (1 세션)
- Linear 이슈: [HM-27](https://linear.app/wqeqw/issue/HM-27) (High, Bug)
- 의존성: 없음
- 근본 원인:
  - `lib/hooks/useVoteTimer.ts:14-30`에서 Supabase Realtime `UPDATE` 이벤트만 구독
  - 마운트 시 DB에서 `vote_started_at` 초기값을 fetch하지 않음
  - 앱(팀원)이 방장보다 먼저 vote-status에 진입한 이후 방장이 startTimer를 호출하면 UPDATE 이벤트는 수신되지만, 반대 타이밍(방장이 먼저 startTimer → 그 뒤 참가자가 vote-status 진입)에서는 이미 과거에 설정된 `vote_started_at`을 수신 못 해 `05:00` 고정
- 완료 조건:
  - [ ] `useVoteTimer` 훅에 `roomId` 마운트 시 `vote_started_at` 초기값 fetch 로직 추가 (getRoomById 또는 전용 API)
  - [ ] 초기값이 있으면 `setStartedAt`으로 즉시 세팅, 이후 Realtime UPDATE는 보조로 사용
  - [ ] 동일 패턴이 필요한 다른 Realtime 훅(useRoomSubscription, useVoteStatus) 점검 및 동일 리스크 여부 메모
  - [ ] `npm run build` 통과
  - [ ] `npm run lint` 통과
  - [ ] 수동 재현 테스트: 웹 방장 + 앱 팀원 2명으로 앱 먼저 투표 완료 시 타이머 카운트다운 확인
  - [ ] Linear HM-27 상태 `Todo → In Progress → In Review` 전이
- 파일 범위:
  - `lib/hooks/useVoteTimer.ts` (수정)
  - `app/group/vote-status/page.tsx` (필요 시 initial value 전달 구조 변경)
  - `lib/api/rooms.ts` (전용 fetch 함수 추가 고려)
- 검증:
  - 실기기 재현 (Android 앱 + Chrome 웹) — QA에게 재현 요청
  - 단위적으로는 DB UPDATE 이후 진입한 새 구독자가 `timeLeft`를 올바르게 받는지 확인
- 예상 커밋: `HM-27 useVoteTimer 초기값 fetch 추가 (05:00 고정 버그 수정)`

---

### Task 002: HM-28 ContentShuffle/RopePull 반응형 레이아웃 수정 [CURRENT]
- 상태: IN_REVIEW (코드 구현 완료, develop 커밋 `00a2efe`, QA 재현 검증 대기)
- 시작일: 2026-04-23
- 구현 커밋: `00a2efe`
- 예상 규모: Small-Medium (1 세션)
- Linear 이슈: [HM-28](https://linear.app/wqeqw/issue/HM-28) (High, Bug)
- 의존성: 없음 (Task 001과 독립 병렬 가능)
- 근본 원인:
  - `components/ContentShuffle.tsx:119` — `CUP_W = Math.max(48, Math.min(72, Math.floor(360/n)-8))` 고정 상수 360 기반, viewport 무관
  - `components/RopePull.tsx:115-117` — `maxWidth = Math.min(380, 430-32)` 고정 상수, viewport 무관
  - foldable(삼성 Z Flip 6 cover ≈320px) 또는 n≥7 시 `n*CUP_W`가 뷰포트 폭 초과
- 완료 조건:
  - [ ] 뷰포트 폭 취득 공통 유틸/훅(`useViewportWidth` 또는 `useContainerWidth`) 추가 또는 기존 로직 개선
  - [ ] `ContentShuffle`의 `CUP_W` / `containerWidth`를 실제 가용 폭(430 max, viewport min) 기반으로 계산
  - [ ] `RopePull`의 `maxWidth` / `colW`를 동일 기준으로 재계산
  - [ ] n=10 (최대), 폭 320px (Z Flip 6 cover 가정), 412px (일반 Android), 375px (iPhone SE) 네 조합에서 컨테이너가 뷰포트 내부에 수납되는지 확인
  - [ ] `npm run build` + `npm run lint` 통과
  - [ ] `viewport-test` 에이전트 또는 수동 Chrome DevTools device mode로 4개 뷰포트 스크린샷 비교
  - [ ] Linear HM-28 상태 전이 + QA 재현 테스트 요청 (Z Flip 6 기기)
- 파일 범위:
  - `components/ContentShuffle.tsx` (수정)
  - `components/RopePull.tsx` (수정)
  - `lib/hooks/useViewportWidth.ts` (신규, 선택적)
- 검증:
  - DevTools 반응형 모드 320/375/412px 너비에서 n=10 후보로 렌더링
  - Z Flip 6 실기기 또는 에뮬레이터(가능 시)에서 기획자 QA 확인
- 예상 커밋: `HM-28 ContentShuffle/RopePull 뷰포트 반응형 리팩토링`

---

### Task 003: HM-29 맛집 돌림판 2단계 플로우 재구조화 (BLOCKED)
- 상태: BLOCKED (기획 합의 대기)
- 예상 규모: Medium (2 세션: 합의 세션 1 + 구현 세션 1)
- Linear 이슈: [HM-29](https://linear.app/wqeqw/issue/HM-29) (Medium, Improvement)
- 의존성: Task 001, Task 002 완료 권장 (릴리스 묶음 최소화)
- 블록 사유: 이미 `food/random → food/detail/random → food/detail/result` 2단계 플로우는 존재. 기획자는 "1차에서 12개 카테고리가 동시 표시되어 작음"을 문제로 지적. 처리 정책을 먼저 확정해야 함
- 선행 합의 필요 항목 (기획자 문은서 확인):
  - 옵션 A: `assets/data/foods.json`의 1차 후보를 4-6개 대분류로 축소 (예: 한식/중식/양식/일식 등)
  - 옵션 B: 상위 대분류 신설 (예: 아시아/유럽/패스트푸드/음료·디저트) → 1차는 4개, 2차는 기존 12개 카테고리, 3차는 세부 메뉴
  - 옵션 C: 항목 수는 유지하되 SpinWheel 섹터 렌더링을 확대 (radius·폰트 재조정)
- 완료 조건 (합의 후):
  - [ ] 기획자 합의 결과를 `.claude/plans/feedback/feedback-2026-04-23.md`에 기록
  - [ ] (옵션 A/B 선택 시) `assets/data/foods.json` / `assets/data/menus.json` 재구성
  - [ ] `app/food/setting/page.tsx`에서 `ALL_FOODS` 주입 방식 조정
  - [ ] (옵션 B 선택 시) `app/food/random → app/food/detail/random` 사이에 추가 단계 또는 데이터 매핑 변경
  - [ ] 기존 Solo 플로우에 영향이 없는지 회귀 테스트
  - [ ] `npm run build` + `npm run lint` 통과
  - [ ] Linear HM-29 상태 전이
- 파일 범위 (합의 내용에 따라 달라짐):
  - `assets/data/foods.json`, `assets/data/menus.json`
  - `lib/data.ts`
  - `app/food/setting/page.tsx`, `app/food/random/page.tsx`, `app/food/detail/random/page.tsx`, `app/food/detail/result/page.tsx`
  - `components/flow/FlowRandomPage.tsx` (필요 시)
- 검증: food 플로우 전 구간 수동 클릭 테스트 + Solo 플로우 영향도 확인
- 예상 커밋: `HM-29 맛집 1차 돌림판 {대분류 축소|상위 그루핑|SpinWheel 렌더 개선}`

---

### Task 004: HM-20 Group 투표 시간 커스텀 UI 추가
- 상태: TODO
- 예상 규모: Small (1 세션)
- Linear 이슈: [HM-20](https://linear.app/wqeqw/issue/HM-20) (Low, Feature)
- 의존성: Task 001 (useVoteTimer 안정화 이후 진행 권장 — 타이머 로직에 손대는 작업 연쇄 방지)
- 전제: `app/group/vote-status/page.tsx:73`에서 `room.time_limit`을 이미 읽고 있음 → DB 컬럼/read 경로 구현됨. UI와 생성 페이로드만 추가하면 됨
- 완료 조건:
  - [ ] `rooms` 테이블 `time_limit` 컬럼 존재 + default(300) 확인 (Supabase Studio 또는 migration 파일)
  - [ ] `app/group/create/page.tsx`에 투표 시간 선택 UI 추가 (1분/3분/5분/10분 라디오 또는 chip)
  - [ ] `lib/api/rooms.ts`의 `createRoom()` 시그니처에 `time_limit` 파라미터 추가
  - [ ] 기본값 5분 유지
  - [ ] `npm run build` + `npm run lint` 통과
  - [ ] 수동 테스트: 3분 선택 → 방 생성 → vote-status에서 `03:00`으로 시작 확인
  - [ ] Linear HM-20 상태 전이
- 파일 범위:
  - `app/group/create/page.tsx`
  - `lib/api/rooms.ts`
  - `lib/types.ts` (Room 타입 확장 필요 시)
- 검증: 각 시간 옵션으로 방 생성 후 vote-status 초기 시간 표시 확인
- 예상 커밋: `HM-20 Group 방 생성 시 투표 시간 커스텀 UI 추가`

---

### Task 005: HM-18 결과 축하 연출 (컨페티)
- 상태: TODO
- 예상 규모: Small (1 세션)
- Linear 이슈: [HM-18](https://linear.app/wqeqw/issue/HM-18) (Low, Feature)
- 의존성: 없음 (가장 나중 처리 권장 — 안정화 작업 완료 후 재미 요소 추가)
- 완료 조건:
  - [ ] `canvas-confetti` 또는 순수 CSS 애니메이션 중 선택 (bundle size 고려)
  - [ ] 선택 시 `npm install canvas-confetti @types/canvas-confetti`
  - [ ] Solo/Food/Group 결과 페이지 진입 시 1회 발사 훅 추가 (`useEffect` 마운트)
  - [ ] `prefers-reduced-motion: reduce` 환경에서는 연출 비활성화 (접근성)
  - [ ] 상세 페이지(`solo/place/result`, `food/detail/result`)도 동일 처리
  - [ ] `npm run build` + `npm run lint` 통과, 번들 사이즈 delta 기록
  - [ ] 수동 테스트: 세 결과 페이지에서 1회씩 컨페티 확인
  - [ ] Linear HM-18 상태 전이
- 파일 범위:
  - `package.json`, `package-lock.json`
  - `app/solo/result/page.tsx`, `app/solo/place/result/page.tsx`
  - `app/food/result/page.tsx`, `app/food/detail/result/page.tsx`
  - `app/group/result/page.tsx`
  - (선택) `components/ConfettiBurst.tsx` 공용 컴포넌트
- 검증: 결과 페이지 5곳에서 컨페티 발사 + 리듀스드 모션 설정 시 스킵 확인
- 예상 커밋: `HM-18 결과 페이지 컨페티 축하 연출 추가`

---

## 전체 작업 경로

```
Task 001 ─┬─▶ Task 004 ──┐
          │               │
Task 002 ─┘               ├─▶ Task 003 (BLOCKED: 기획 합의 후 해제)
                          │
                  Task 005 ┘
```

- Task 001, 002는 **병렬 가능** (타이머와 게임 컴포넌트는 독립 영역)
- Task 004는 Task 001 완료 후 (타이머 영역 변경 연쇄 방지)
- Task 003은 기획 합의 완료 시점까지 BLOCKED
- Task 005는 마지막 정리 단계에서

## 미포함 범위 (이번 사이클 외)

- HM-22(웹↔앱 방장 무한 대기) — 별도 근본 원인 조사 필요, Backlog 상태
- HM-4~HM-10 등 과거 이슈 — 이번 분석 스코프 밖
- Play Store 프로덕션 릴리즈 — 각 태스크 완료 후 별도 릴리즈 사이클에서 일괄 승격

## 참조

- 분석 결과: `/linear:todo` 실행 결과 (2026-04-23 대화 기록)
- Linear 프로젝트: [몇명이니 v1.1 안정화](https://linear.app/wqeqw)
- progress 메타: `.claude/plans/progress.md § Linear`
- 이전 로드맵(참고): `roadmap.hm-23.archive.md`
