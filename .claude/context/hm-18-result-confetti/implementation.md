# Implementation: HM-18 결과 컨페티 연출

## 배경
- Linear 이슈: HM-18 (Low, Feature)
- 요구: 결과 페이지 진입 시 1회 컨페티 축하 연출

## 설계 결정

### 라이브러리 선택: canvas-confetti
- npm install: `canvas-confetti@^1.9.4`, `@types/canvas-confetti@^1.9.0`
- 순수 CSS 애니메이션 대비 개발 비용 낮고 기본 파티클·easing이 자연스러움
- 약 5KB gzipped, **동적 import**로 로드하여 초기 번들 증가 회피

### 공용 컴포넌트: ConfettiBurst
- 위치: `components/ConfettiBurst.tsx`
- 역할: 마운트 시 1회 발사 + cleanup
- 접근성: `prefers-reduced-motion: reduce` 매치 시 자동 스킵
- 색상 팔레트: 앱 primary(`#FF7A3D`) + 파생 톤 3종
- 연출: 양쪽 하단 코너에서 대각선 60°/120° 발사 → 꽃잎처럼 퍼짐

### 삽입 전략
Solo/Food 결과 페이지는 `FlowResultPage`/`FlowDetailResultPage` 공용 컴포넌트 래퍼이므로 공용 2개 + `app/group/result` 3개만 수정하면 5개 결과 페이지 모두 커버:

| 수정 파일 | 커버 페이지 |
|---|---|
| `components/flow/FlowResultPage.tsx` | `solo/result`, `food/result` |
| `components/flow/FlowDetailResultPage.tsx` | `solo/place/result`, `food/detail/result` |
| `app/group/result/page.tsx` | `group/result` |

### 발사 타이밍
- 세 파일 모두 `<PageLayout>` 내부 맨 처음에 `<ConfettiBurst />` 배치
- `if (!data) return null` 가드 이후의 return 블록에 삽입 → 결과 데이터 로드 완료 시점에만 마운트

## 변경 파일

| 파일 | 변경 |
|---|---|
| `package.json`, `package-lock.json` | canvas-confetti, @types/canvas-confetti 의존성 추가 |
| `components/ConfettiBurst.tsx` | 신규 — 마운트 시 1회 발사 (동적 import + reduce-motion 가드) |
| `components/flow/FlowResultPage.tsx` | import + `<ConfettiBurst />` 삽입 |
| `components/flow/FlowDetailResultPage.tsx` | 동일 |
| `app/group/result/page.tsx` | 동일 (정상 경로 return 블록에만 삽입, `!result` fallback 경로는 제외) |

## 검증
- `npm run build` ✅ Compiled successfully (1.8s)
- 타입 체크 통과
- `canvas-confetti`는 동적 import이므로 초기 bundle 영향 없음 (lazy chunk 분리)

## 수동 검증 필요 (QA)
- Solo/Food/Group/상세 결과 페이지 5곳 각각 진입 시 컨페티 1회 발사 확인
- macOS/iOS "동작 줄임(Reduce Motion)" 또는 Windows "애니메이션 줄이기" 설정 켠 상태에서는 **발사되지 않는지** 확인
- 결과 페이지 내에서 back → 다시 진입 시 재발사 (마운트 기반)

## 주의사항
- Web + Capacitor(Android WebView) 양쪽에서 동작 확인 필요
- 컨페티가 Toast, 카카오 공유 버튼 등 다른 UI 요소와 z-index 충돌 없는지 확인 — canvas-confetti는 기본 `z-index: 999999`로 document에 canvas 삽입
