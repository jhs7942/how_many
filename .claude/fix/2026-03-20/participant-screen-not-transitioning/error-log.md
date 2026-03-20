# 그룹 방 참가자 화면 미전환 버그

## 발생 환경
- 날짜: 2026-03-20
- 관련 파일:
  - `app/group/vote-status/page.tsx`
  - `app/group/random/page.tsx`
  - `lib/hooks/useRandomEvent.ts`
  - `lib/hooks/useRoomSubscription.ts`
- 라이브러리·버전: Next.js 16.1.7, Supabase Realtime

## 증상

### 1. 투표 룸
- 방장: 모든 인원 투표 완료 시 결과 화면으로 정상 이동
- 참가자: 투표 완료(2/2명) 상태임에도 "다른 친구들의 투표를 기다리는 중..." 화면에서 멈춤. 결과 화면으로 전환되지 않음

### 2. 랜덤 룸
- 방장: 돌림판 결과 후 정상 이동
- 참가자: "방장을 기다리는 중..." 화면에서 멈춤. 방장이 결과를 내도 화면 전환 없음

## 원인

### 1. 투표 룸
- `vote-status/page.tsx`에서 방장이 `updateRoomStatus(roomId, 'finished')`를 호출해 DB를 업데이트함
- 참가자 화면은 `useRoomSubscription` 훅(Supabase realtime)으로 `rooms` 테이블 변화를 감지하도록 설계되어 있었으나, realtime 이벤트가 참가자에게 전달되지 않음
- 결과적으로 참가자는 방 상태 변화를 감지하지 못해 화면 전환 로직이 실행되지 않음

### 2. 랜덤 룸
- `useRandomEvent` 훅이 Supabase realtime **구독(subscribe)만** 하고, 초기 fetch가 없었음
- 방장이 이벤트를 DB에 INSERT한 후 참가자가 페이지에 진입하면 구독 시작 전에 이벤트가 이미 생성되어 있어 INSERT 이벤트를 놓치는 타이밍 경쟁(Race Condition) 발생
- 참가자는 `gameType`이 `null`인 상태로 "방장을 기다리는 중..." 화면에 머무름

## 해결책

### 1. 투표 룸 — realtime → 폴링 교체
`useRoomSubscription` 제거 후, 참가자에 한해 2초 간격으로 `getRoomById`를 직접 호출해 방 상태를 확인하는 폴링 방식으로 교체

```tsx
// app/group/vote-status/page.tsx
useEffect(() => {
  if (isHost || !roomId) return;
  const poll = setInterval(async () => {
    const r = await getRoomById(roomId);
    if (r?.status === 'finished') {
      clearInterval(poll);
      router.push('/group/result');
    }
  }, 2000);
  return () => clearInterval(poll);
}, [isHost, roomId, router]);
```

### 2. 랜덤 룸 — 초기 fetch 추가
`useRandomEvent` 훅에 구독 전 최신 이벤트를 가져오는 초기 fetch 추가

```ts
// lib/hooks/useRandomEvent.ts
getLatestRandomEvent(roomId).then((existing) => {
  if (existing) setEvent(existing);
});
```

## 재발 방지
- Supabase realtime은 테이블별 설정 및 네트워크 환경에 따라 동작이 불안정할 수 있음
- **실시간성이 중요한 화면 전환 로직**은 realtime 단독 의존 대신 폴링을 병행하거나 폴링으로 대체할 것
- realtime 구독 훅 작성 시 **초기 fetch를 반드시 포함**해 타이밍 경쟁을 방지할 것
