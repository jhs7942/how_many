# Plan — Linear Todo 4건 순차 수정 (2026-04-17)

## 작업 범위
Linear HM 팀의 Todo 상태 이슈 4건(HM-4, HM-8, HM-9, HM-10)을 우선순위대로 처리한다. 추가로 팀원이 제기한 HM-22(Urgent Backlog)는 HM-8과 동일한 fetch-subscribe race 루트 원인으로 판단되어 같은 루프에서 함께 개선한다.

## 우선순위 및 처리 방침

### 1. HM-8 — [Bug] 대기실 참여자 수 0명 표시 (Urgent)
- **파일**: `lib/hooks/useParticipants.ts`, `app/group/lobby/page.tsx`
- **근본 원인**
  - fire-and-forget fetch(`await` 없음)로 초기값 `[]`이 노출되는 구간 존재
  - fetch와 realtime INSERT 이벤트의 race condition
  - `roomId` 변경 시 이전 배열을 clear하지 않음
  - 로딩 상태가 호출 측에 노출되지 않아 "로딩 중"과 "참여자 0명"이 시각적으로 동일
- **수정 내용**
  - `async/await` + `cancelled` flag로 cleanup 안전하게 정리
  - `isLoading` state 추가 → 반환을 `{ participants, isLoading }` 객체로 변경
  - `roomId` 변경 시 `participants=[]`, `isLoading=true`로 리셋
  - `lobby/page.tsx`는 `isLoading` 중에는 "불러오는 중…" 플레이스홀더 표시

### 2. HM-22 — [Bug] 웹↔앱 투표 시 방장 외 결과 확인 불가 (Urgent)
- **파일**: `lib/hooks/useRoomSubscription.ts`, `lib/hooks/useRandomEvent.ts`
- **근본 원인 (추정)**
  - 참가자가 `/group/random` 도달 직후 방장이 `random_events` INSERT를 수행하면,
    realtime `subscribe()`가 완료되기 전의 이벤트를 놓쳐 `event=null` 고착 → "방장을 기다리는 중..." 무한 대기
  - `useRoomSubscription`도 동일한 fetch-subscribe race 가능성 (status 전이 누락 → 페이지 전환 실패)
- **수정 내용**
  - 두 훅 모두 `async/await` + `cancelled` flag 적용
  - `subscribe()` 콜백의 `status === 'SUBSCRIBED'` 직후 **catch-up fetch**를 한 번 더 실행 — realtime 준비 시점을 기준으로 최신 상태 재확인

### 3. HM-4 — [Bug] 토스트 시스템 내비바 겹침 (Urgent)
- **파일**: `components/Toast.tsx`
- **수정 내용**
  - `bottom` offset 72px → `max(96px, calc(48px + env(safe-area-inset-bottom, 0px)))` 로 상향
  - WebView에서 `env(safe-area-inset-bottom)`을 0으로 회신하는 기기에서도 96px 최소 보장

### 4. HM-9 / HM-10 — [Improvement] 문구 통일 (Urgent, 코드 작업 불필요)
- 현재 코드 기준 이미 `다시 돌리기 🔄`, `링크 복사 📤`로 통일되어 있음
- **수정 내용**: Linear 이슈 state=Done 전환 + 코멘트로 "현재 코드 기준 이미 통일됨" 기록

## 검증 절차
1. `npm run build` — 타입/빌드 에러 없음 확인
2. Linear 상태 업데이트 (HM-8/22/4 → In Review, HM-9/10 → Done)
3. 실제 다중 기기(웹↔앱) 재현 테스트는 사용자/팀원 확인 단계로 전달

## 구현 금지 영역
- Supabase 스키마·RLS·환경변수 변경 없음
- 공용 컴포넌트 API 변경은 `useParticipants` 반환 형태 한 건만 (영향 범위: `app/group/lobby/page.tsx` 1개 파일)
