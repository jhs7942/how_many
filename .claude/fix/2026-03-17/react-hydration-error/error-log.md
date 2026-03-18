# React Hydration Error #418 — roomCode SSR 불일치

## 발생 환경
- 날짜: 2026-03-17
- 관련 파일: `app/group/nickname/page.tsx`
- 라이브러리·버전: Next.js 16.1.7 (App Router)

## 증상
`/group/nickname` 페이지에서 브라우저 콘솔에 Hydration Error #418 발생.
방 코드 표시 영역이 깜빡이거나 "------"로 고정.

## 원인
`const roomCode = session.get<string>('roomCode') ?? '------'` 가 컴포넌트 최상위 스코프에서 직접 호출됨.
- 서버(SSR): `typeof window === 'undefined'` → `session.get` 이 `null` 반환 → `"------"` 렌더
- 클라이언트(Hydration): sessionStorage에서 실제 코드(e.g. `"SDLUVZ"`) 읽어 렌더
- HTML 불일치 → React Hydration Error #418

## 해결책
`roomCode`를 `useState + useEffect` 패턴으로 이동해 클라이언트에서만 sessionStorage를 읽도록 변경.

```tsx
const [roomCode, setRoomCode] = useState('------');
useEffect(() => {
  setRoomCode(session.get<string>('roomCode') ?? '------');
}, []);
```

서버/초기 렌더는 항상 `"------"` → 클라이언트 마운트 후 실제 값으로 업데이트.

## 재발 방지
- 컴포넌트 최상위 스코프에서 `session.get()` 직접 호출 금지
- sessionStorage / localStorage 접근은 항상 `useEffect` 내부에서 수행
- `session.ts`의 `typeof window === 'undefined'` 가드는 서버 크래시를 막지만 Hydration 불일치는 막지 못함
