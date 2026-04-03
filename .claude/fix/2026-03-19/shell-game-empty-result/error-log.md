# 야바위 — 결과에서 꽝이 나오는 오류

## 발생 환경
- 날짜: 2026-03-19
- 관련 파일: `components/ShellGame.tsx`
- 라이브러리·버전: React 19

## 증상
야바위에서 컵 선택 시 꽝(빈 결과)이 반환됨.
선택한 컵이 공(ball)을 가진 컵이 아닌 경우 '꽝' 텍스트와 회색 컵으로 표시됨.

## 원인
`ballIndex` 모델 기반 설계 — 하나의 컵에만 공이 존재하고, 나머지 컵은 빈 컵으로 처리됨.
스펙("컵 수 = 후보 수, 빈 컵 없음 — 각 컵이 곧 컨텐츠")과 불일치.

```tsx
// 현재 — ballIndex 모델
const [ballIndex, setBallIndex] = useState(0);
const isBall = cupIdx === ballIndex;

// 결과 레이블: 공 없는 컵은 '꽝'
{isBall ? segments[cupIdx].label : '꽝'}

// handleChoose: ballIndex를 winner로 반환
onResult(ballIndex); // 선택 컵과 무관하게 ballIndex 고정
```

## 해결책
`ballIndex` 모델 제거. 컵 = 후보 1:1 매핑으로 변경.
- 모든 컵 아래에 각 후보 emoji 표시 (isBall 조건 제거)
- `handleChoose(screenPos)` 에서 선택된 screenPos에 해당하는 cupIdx 반환
- '꽝' 분기 완전 제거

```ts
// 수정 — screenPos → cupIdx 변환
function handleChoose(screenPos: number) {
  if (gameState !== 'choosing') return;
  const cupIdx = positions.indexOf(screenPos);
  setChosenScreenPos(screenPos);
  setGameState('revealing');
  setTimeout(() => setRevealed(true), 600);
  setTimeout(() => onResult(cupIdx), 1800);
}
```

## 재발 방지
- 스펙 "빈 컵 없음"을 컴포넌트 설계 시 반영할 것
- 야바위는 숨기기 게임이 아닌 "어떤 후보가 나오는가" 랜덤 결정 도구임을 명확히 정의
- `ballIndex` 같은 "정답 하나" 모델 대신 셔플된 positions 배열로 컵-후보 매핑을 직접 추적
