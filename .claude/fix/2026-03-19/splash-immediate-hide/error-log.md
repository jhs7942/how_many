# 스플래시 화면 즉시 사라짐

## 발생 환경
- 날짜: 2026-03-19
- 관련 파일: `app/page.tsx`
- 라이브러리·버전: Next.js 15 (App Router)

## 증상
홈 페이지(`/`) 진입 시 스플래시 화면이 2초를 기다리지 않고 즉시 사라짐.
`splashSeen` 세션값이 존재하는 경우 스플래시가 깜빡인 뒤 즉시 홈 화면으로 전환됨.

## 원인
`splashVisible`의 초기값이 `true`로 설정되어 있어, React가 첫 렌더에서 스플래시를 표시함.
이후 `useEffect`가 실행되면서 `splashSeen = true`를 확인하고 즉시 `setSplashVisible(false)`를 호출.
결과적으로 스플래시가 1프레임 렌더된 뒤 바로 사라지는 플래시 현상 발생.

```tsx
// ❌ 수정 전 — 초기값이 true라 항상 스플래시 렌더 후 즉시 hide
const [splashVisible, setSplashVisible] = useState(true);

useEffect(() => {
  const seen = session.get<boolean>('splashSeen');
  if (seen) {
    setSplashVisible(false); // useEffect에서 즉시 hide → 플래시
    setHomeVisible(true);
    return;
  }
  ...
}, []);
```

## 해결책
`splashVisible` 초기값을 `false`로 변경. `useEffect`에서 `splashSeen`이 없을 때만 `true`로 설정.

```tsx
// ✅ 수정 후 — 초기값 false, useEffect에서 조건부로만 표시
const [splashVisible, setSplashVisible] = useState(false);

useEffect(() => {
  const seen = session.get<boolean>('splashSeen');
  if (seen) {
    setHomeVisible(true); // 스플래시 표시 없이 바로 홈으로
    return;
  }
  setSplashVisible(true); // 미방문 시에만 스플래시 표시
  const timer = setTimeout(() => {
    setSplashHide(true);
    setTimeout(() => {
      setSplashVisible(false);
      setHomeVisible(true);
      session.set('splashSeen', true);
    }, 600);
  }, 2000);
  return () => clearTimeout(timer);
}, []);
```

## 재발 방지
- sessionStorage 값에 따라 조건부로 표시되는 UI는 초기값을 `false`(숨김)로 설정
- `useEffect` 실행 전 React 첫 렌더에서 의도치 않은 상태가 노출되지 않도록 주의
- `session.get()`은 항상 `useEffect` 내부에서만 호출할 것 (CLAUDE.md Hydration 주의 참고)
