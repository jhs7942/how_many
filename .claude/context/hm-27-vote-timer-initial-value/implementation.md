# Implementation: HM-27 useVoteTimer 초기값 fetch

## 배경
- Linear 이슈: HM-27 (High, Bug) — 앱(팀원)이 먼저 투표 완료 시 vote-status 타이머가 `05:00` 고정
- 근본 원인: `useVoteTimer` 훅이 Supabase Realtime UPDATE 이벤트만 구독. mount 시 DB 초기값 fetch 없음 → 참가자가 방장의 startTimer 이후에 진입하면 UPDATE 이벤트를 이미 놓친 상태

## 설계 결정: 옵션 A (useVoteStatus 패턴 복사)

참고: `lib/hooks/useVoteStatus.ts`가 이미 "mount fetch + realtime subscribe" 패턴 사용. 같은 스타일로 통일.

### 이유
- 프로젝트 기존 패턴과 일관성 (useVoteStatus)
- 호출부(vote-status/page.tsx) 무변경 → 회귀 위험 최소
- useVoteTimer 훅 self-contained 유지
- 신규 API 함수 추가 없음 (getRoomById 이미 존재)

### 탈락한 옵션
- 옵션 B (prop drilling): 시그니처 변경 + 호출부 수정 필요. 중복 쿼리만 피할 뿐.
- 옵션 C (전용 getter `getVoteStartedAt`): 신규 API 추가. room 전체 조회 오버헤드는 <50ms라 무시 가능.

## 변경 파일
- `lib/hooks/useVoteTimer.ts` (수정)

## 변경 요약
1. `import`에 `getRoomById` 추가 (이미 같은 경로 `../api/rooms`에서 setVoteStartedAt import 중)
2. 기존 useEffect 구독 블록 진입 직후 `loadInitial()` async 함수 추가
3. `loadInitial` → `getRoomById(roomId)` 호출 → `vote_started_at`이 truthy이면 `setStartedAt` 호출
4. Realtime UPDATE 구독 로직은 **그대로 유지** (이후 방장 진입 시 갱신용 보조 채널)

## 주의사항
- `getRoomById` 실패 시 silently skip — Realtime으로 이후 복구 가능 (현 동작과 동일)
- fetch 완료 전 Realtime UPDATE 수신되면 setStartedAt 두 번 호출되지만 값 동일 → 멱등
- `Room.vote_started_at` 타입은 `string | null`로 이미 정의 (lib/types.ts:15)

## 검증 계획
- `npm run build` 통과 (타입 체크 포함)
- `npm run lint` 통과
- 수동 재현: 웹(방장) + 앱(팀원) 환경에서 앱 먼저 투표 → vote-status 타이머 카운트다운 확인

## 범위 외 (별도 Task로 분리)
- `useRoomSubscription`, `useRandomEvent`도 같은 패턴 가능성 있음. 이번 Task에서 수정하지 않음. Task 002 이후 회귀 점검 시 확인 권장.

## 관련 파일 (참고만)
- `lib/hooks/useVoteStatus.ts` — 참고 패턴
- `lib/api/rooms.ts` — getRoomById 이미 존재 (62줄)
- `app/group/vote-status/page.tsx` — 변경 없음
- `lib/types.ts:15` — Room.vote_started_at 타입 정의
