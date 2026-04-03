# 결과 화면 — 홈으로 돌아가기 버튼 없음 / 돌림판 화면 뒤로가기 버튼 없음

## 발생 환경
- 날짜: 2026-03-19
- 관련 파일:
  - `app/solo/random/page.tsx` (돌림판/야바위 화면)
  - `app/solo/result/page.tsx` (결과 화면)
- 라이브러리·버전: Next.js 15 (App Router)

## 증상
- 돌림판/야바위(`/solo/random`) 화면에서 이전 화면으로 돌아가는 BackButton이 없음
- 결과 화면(`/solo/result`)에서 홈(`/`)으로 이동하는 버튼이 없음
  - BackButton은 `/solo/random` 으로만 연결 (재시도 용도)
  - "다시 돌리기" 버튼도 `/solo/random` 으로 이동

## 원인
구현 시 네비게이션 버튼 누락.

`solo/random/page.tsx`:
```tsx
// 현재 — BackButton 없음
<div style={{ paddingTop: 24 }}>
  <h1>...야바위/돌림판...</h1>
</div>
```

`solo/result/page.tsx`:
```tsx
// 현재 — 홈 이동 버튼 없음, BackButton만 존재
<BackButton href="/solo/random" />
```

## 해결책
**돌림판/야바위 화면**: 헤더에 `BackButton` 추가 (`href="/solo/setting"`)

```tsx
<div style={{ paddingTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
  <BackButton href="/solo/setting" />
  <h1 ...>{gameType === 'shell' ? '🥤 야바위' : '🎡 돌림판'}</h1>
</div>
```

**결과 화면**: 버튼 영역에 홈 이동 버튼 추가

```tsx
<button onClick={() => router.push('/')} ...>
  홈으로 돌아가기 🏠
</button>
```

## 재발 방지
- 모든 페이지에 뒤로가기 또는 홈 이동 수단이 있는지 구현 완료 후 체크리스트로 확인
- 특히 결과 페이지는 flow의 종착점이므로 홈 이동 버튼 필수
