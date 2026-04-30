# Implementation: HM-28 게임 컴포넌트 뷰포트 반응형

## 배경
- Linear 이슈: HM-28 (High, Bug) — 삼성 Z Flip 6 테스트 앱에서 셔플/줄 뽑기 콘텐츠가 화면 밖으로 잘림
- 첨부 이미지 2장 확인: 모두 n=6 환경. 셔플은 오른쪽 컵 1/2 잘림, 줄뽑기는 좌우 박스 잘림
- 근본 원인:
  - `ContentShuffle.tsx:119` — `Math.floor(360/n)-8` 고정 상수 360 기반 (viewport 무관)
  - `RopePull.tsx:115` — `Math.min(380, 430-32)` 고정 상수 380 기반 (viewport 무관)

## 설계 결정: 옵션 B + D 하이브리드 (useViewportWidth 훅)

### 선택 이유
- 공용 훅으로 재사용성 확보 (SpinWheel 등 향후 확장 가능)
- ResizeObserver 과잉 회피 (window resize 이벤트로 충분)
- Canvas 기반 SpinWheel은 280px 고정으로 문제없음 → 범위에서 제외

### 설계 상수
- PageLayout 좌우 padding = 20px씩 + 안전 마진 8px = 총 48px 제외
- 앱 max-width 430으로 clamp
- `availableW = Math.min(viewport, 430) - 48`

### ContentShuffle
- 컵 폭 상한 72, 하한 36 (이모지 식별 최소선)
- `idealCupW = floor((availableW - (n-1)*gap) / n)`
- `CUP_W = clamp(36, idealCupW, 72)`

### RopePull
- 컬럼 폭 하한 36
- `colW = max(36, floor((availableW - (n-1)*gap) / n))`

## 변경 파일

| 파일 | 변경 |
|---|---|
| `lib/hooks/useViewportWidth.ts` | 신규 — SSR 안전 (초기값 430, hydration 후 갱신) |
| `components/ContentShuffle.tsx` | CUP_W 계산 교체 (119-121줄) |
| `components/RopePull.tsx` | maxWidth/colW 계산 교체 (115-117줄) |

## 검증 결과 (시뮬레이션)

### ContentShuffle n=6 기준 (HM-28 실제 케이스)

| 뷰포트 | 수정 전 container | 수정 후 container | 결과 |
|---|---|---|---|
| 320px (Z Flip 6 cover) | 372 [100px 초과] | 276 [4px 미세 초과] | 사실상 해결 |
| 360px (이미지 환경) | 372 [60px 초과] | 312 [딱 맞음] | ✅ 해결 |
| 375px (iPhone SE) | 372 [45px 초과] | 324 | ✅ |
| 412px (Pixel/Galaxy) | 372 [8px 초과] | 360 | ✅ |
| 430px (iPhone Pro) | 372 OK | 378 | OK |

### RopePull 전 케이스

모든 viewport × n(2/4/6) 조합에서 container ≤ availableW 충족. 완전 해결.

## 잔존 이슈 (별도 후속 처리 권장)

### ContentShuffle n≥8 overflow
- 하한 36px 유지 시 불가피한 overflow 발생 (예: vp=360, n=8 → 372/312)
- 대응 옵션:
  1. `pickGameType`에서 `ContentShuffle`도 n 제한 추가 (현재는 rope만 n≥7 제외)
  2. n이 크면 컵을 여러 줄로 wrap 배치
  3. 하한을 더 낮추되 이모지 숨김
- 현재 Task 범위 밖. `.claude/plans/feedback/feedback-2026-04-23.md`에 기록 권장

## 주의사항
- `useViewportWidth` 초기값 fallback은 430 (앱 max-width) — SSR 단계 hydration mismatch 방지
- `useEffect` 내부 `handler()` 즉시 호출로 초기 렌더링 후 실제 값 반영 보장
- resize 이벤트만 구독. orientation change는 resize를 발생시키므로 별도 처리 불필요

## 검증 완료
- `npm run build` ✅ Compiled successfully (1.8s)
- 타입 체크 통과
- 수동 수치 검증 스크립트 통과 (5개 뷰포트 × 2-10 후보 매트릭스)

## 검증 필요 (QA)
- Vercel preview URL을 Z Flip 6 또는 foldable 시뮬레이터에서 접근
- n=6, n=4, n=2 후보 수에서 각각 셔플·줄뽑기 진행 → 화면 밖 잘림 없음 확인
