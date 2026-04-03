# 참여하기 — 방코드 입력 후 방장으로 진입되는 오류

## 발생 환경
- 날짜: 2026-03-19
- 관련 파일: `app/group/join/page.tsx`
- 라이브러리·버전: Next.js 15 (App Router)

## 증상
참여자가 6자리 방 코드 입력 후 입장 시 방장(host) 권한으로 처리됨.
대기실(lobby)에서 시작 버튼이 활성화되어 참여자가 게임을 시작할 수 있게 됨.

## 원인
`handleJoin()` 성공 분기에서 `isHost` 세션 키를 설정하지 않음.
lobby 페이지가 `isHost` 세션 값 부재를 host로 해석하거나 기본값 처리 없이 작동.

```ts
// 현재 — isHost 미설정
session.set('roomId', room.id);
session.set('roomCode', room.code);
router.push('/group/lobby');
```

## 해결책
방 코드 검증 통과 후 `session.set('isHost', false)` 추가.

```ts
session.set('roomId', room.id);
session.set('roomCode', room.code);
session.set('isHost', false);   // 추가
router.push('/group/lobby');
```

## 재발 방지
- 방 생성(`group/create`)과 방 참여(`group/join`) 양쪽에서 `isHost` 세션을 명시적으로 설정할 것
- lobby 진입 시 `isHost` 세션 값 부재를 `false`로 기본 처리하는 방어 코드 추가 검토
