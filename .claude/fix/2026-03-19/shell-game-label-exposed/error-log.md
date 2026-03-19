# 야바위 — 시작 시 하단에 컨텐츠 마크가 노출되는 오류

## 발생 환경
- 날짜: 2026-03-19
- 관련 파일: `components/ShellGame.tsx` (lines 230–246)
- 라이브러리·버전: React 19

## 증상
야바위 셔플 애니메이션 시작 시점에 화면 하단에 컨텐츠(후보) 레이블이 렌더링됨.
컵을 선택하기 전 단계(showing, covering, shuffling)에서 이미 후보 목록이 노출됨.

## 원인
선택지 레이블 `<div>` 가 `gameState`와 무관하게 항상 렌더링됨.

```tsx
// 현재 — 항상 렌더링
<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
  {segments.map((s, i) => (
    <span key={i}>{s.emoji} {s.label}</span>
  ))}
</div>
```

## 해결책
`gameState === 'choosing'` 또는 `'revealing'` 상태일 때만 렌더링하도록 조건 추가.

```tsx
{(gameState === 'choosing' || gameState === 'revealing') && (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
    {segments.map((s, i) => (
      <span key={i}>{s.emoji} {s.label}</span>
    ))}
  </div>
)}
```

## 재발 방지
- 게임 진행 단계별로 노출되어야 할 UI 요소를 `gameState` 조건으로 명시적으로 제어할 것
- 상태 머신(`idle → showing → covering → shuffling → choosing → revealing`) 각 단계의 노출 범위를 컴포넌트 설계 시 문서화
