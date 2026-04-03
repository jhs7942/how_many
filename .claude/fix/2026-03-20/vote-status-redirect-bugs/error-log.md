# 투표 현황 페이지 버그 (총 4가지)

## 발생 환경
- 날짜: 2026-03-20 / 관련 파일: app/group/vote-status/page.tsx, lib/api/rooms.ts, lib/api/votes.ts, lib/hooks/useVoteStatus.ts, lib/hooks/useRoomResult.ts

## 증상
1. 방장이 투표 완료 버튼 누르면 즉시 투표 종료됨 (참여자 투표 전인데도)
2. 투표 2/2 완료 후 "집계중..." 화면에서 결과 화면으로 넘어가지 않음 (간헐적)
3. 투표 현황 페이지 진입 시 콘솔에 `GET /participants 406 (Not Acceptable)` 에러 발생
4. 투표 페이지에서 `GET /votes?...&participant_id=eq... 406` 에러 발생

## 원인

### 버그 1 (조기 자동 마감)
`useVoteStatus`에서 `totalCount`를 계산할 때 `last_seen` 30초 기준으로 활성 참여자만 필터링.
방장이 투표 후 vote-status 페이지로 이동하는 시점에, 상대방 참여자의 `last_seen`이 30초 이상 지났으면 inactive 처리 → `totalCount=1`이 됨.
방장 혼자 투표해도 `completedCount(1) >= totalCount(1)` → `allVoted=true` → `closeVoting()` 실행.

### 버그 2 (집계중 화면 고착 — 2단계 발생)
**1차 원인**: `closeVoting()` 내부 `router.push` 제거 후 `useRoomResult` (results 테이블 INSERT 구독)으로 redirect 위임.
Supabase에서 `results` 테이블에 Realtime 미설정 → INSERT 이벤트 미수신 → redirect 불가.

**2차 원인 (useRoomSubscription 교체 후에도 간헐적 발생)**:
`closeVoting()` → `saveResult()` → `updateRoomStatus('finished')` 순서로 실행되는데,
`useRoomSubscription`의 Realtime 채널이 Supabase 서버에 완전히 연결되기 전에 UPDATE 이벤트가 발생하면 이벤트를 놓침.
→ 호스트: `router.push` 없으므로 `closing=true`로 무한 대기.
→ 참여자: Realtime 이벤트 miss로 redirect 미실행.

### 버그 3 (participants 406 에러)
`getParticipant()`, `joinRoom()`의 existing 체크에서 `.single()` 사용.
Supabase `.single()`은 행이 없을 때 406 에러 반환.
아직 participant 레코드가 없는 상태에서 이 함수들이 호출되면 406 발생.

### 버그 4 (votes 406 에러)
`getMyVote()`에서 `.single()` 사용.
투표 이전에 호출되거나 해당 투표 기록이 없을 때 406 에러 반환.

## 해결책

### 버그 1
`useVoteStatus`에서 `last_seen` 필터 완전 제거.
`totalCount = participants?.length ?? 0` (전체 참여자 수 기준).
이탈한 참여자가 있을 경우는 타이머(timeLeft <= 0)가 안전망 역할.

### 버그 2
**1차**: `useRoomResult` → `useRoomSubscription` 교체. `rooms` 테이블은 Realtime 활성화 확인.

**2차**: Realtime 타이밍 경쟁 방지를 위해 2중 안전장치 적용.
- 호스트: `closeVoting()` 내 `updateRoomStatus` 성공 후 `router.push('/group/result')` 직접 실행 복구.
- 참여자: `useRoomSubscription` Realtime + 3초 간격 폴백 폴링(`getRoomById`) 병행.

### 버그 3
`getParticipant()`, `joinRoom()` existing 체크 모두 `.single()` → `.maybeSingle()` 교체.

### 버그 4
`getMyVote()` `.single()` → `.maybeSingle()` 교체.

## 재발 방지
- Supabase Realtime은 테이블별로 별도 설정 필요. 새 테이블을 realtime trigger로 쓰기 전에 대시보드에서 활성화 여부 확인.
- 존재하지 않을 수 있는 행 조회는 항상 `.maybeSingle()` 사용. `.single()`은 반드시 1개 행이 있어야 하는 경우에만 사용.
- 참여자 수 카운트에 last_seen 임계값 사용 금지 — 타이밍 경쟁 조건 발생 가능.
- Realtime만 단독으로 화면 전환 트리거로 사용 금지 — 연결 지연 시 이벤트 miss 가능. 호스트는 직접 redirect, 참여자는 Realtime + 폴백 폴링 병행.
