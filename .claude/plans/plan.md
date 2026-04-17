# Plan — Galaxy S25+ 전 페이지 불필요 드래그 제거 (2026-04-18)

## 작업 브랜치

- **현재 브랜치**: `develop` (이미 체크아웃 완료)
- 별도 feature 브랜치 분기 없이 `develop`에서 직접 커밋·푸시
- Vercel preview URL(`how-many-git-develop-*.vercel.app`)로 자동 배포되어 내부 테스트 AAB가 즉시 반영됨
- `main` 병합은 실기기 검증 후 사용자 승인 시 별도 진행

## 작업 배경

Galaxy S25+ 실기기(Android 15, CSS 뷰포트 ~412×915)에서 메인을 포함한 **모든 페이지에서 세로 스크롤이 강제**되는 이슈. 드래그 폭은 `safe-area-inset-top`(상태바) 크기와 일치.

## 근본 원인

- `android/variables.gradle`의 `targetSdkVersion = 36` → Android 15 Edge-to-Edge 강제 적용.
- WebView가 상태바·제스처바 영역까지 전체를 덮고, `env(safe-area-inset-*)`에 실제 값 전달됨.
- 현재 CSS 구조가 body·자식 양쪽에서 safe-area와 100svh를 이중으로 요구:

| 위치 | 값 | 문제 |
|---|---|---|
| `app/globals.css:44-50` body | `min-height: 100svh` + `padding-top: var(--safe-top)` | box-sizing:border-box여도 자식이 별도로 100svh를 요구하면 body 총 높이 = safe-top + 100svh로 팽창 |
| `components/PageLayout.tsx:12` | `minHeight: '100svh'` | body의 content-area(= 100svh − safe-top)보다 커서 overflow 유발 |
| `app/page.tsx:64` / `app/privacy/page.tsx:10` | `minHeight: '100svh'` 직접 지정 | 동일 |

결과: body 실제 높이 ≈ 100svh + 28px → 모든 페이지에서 상태바 높이만큼 스크롤 가능.

## 해결 방식 (A안 채택)

body는 safe-area에 관여하지 않고, 콘텐츠 컨테이너(PageLayout / 홈 / privacy)가 safe-top·safe-bottom을 **자신의 padding 안에서** 흡수한다. `box-sizing: border-box`이므로 padding은 min-height 안에 포함돼 overflow가 사라진다.

대안 B(body min-height를 `calc`로)·C(MainActivity에서 Edge-to-Edge 비활성화)는 트레이드오프 검토 결과 기각 (단일 포인트 수정이 아니거나 Android 15 가이드라인 역행).

## 수정 범위

| 파일 | 변경 내용 |
|---|---|
| `app/globals.css` | body에서 `padding-top: var(--safe-top)` 제거. `min-height`는 `100svh` 유지. |
| `components/PageLayout.tsx` | 루트 div의 `paddingTop: 0` → `paddingTop: 'var(--safe-top)'` 로 교체. `paddingBottom`은 기존 그대로 (`calc(32px + env(safe-area-inset-bottom, 0px))`) 유지. |
| `app/page.tsx` | 루트 div의 `padding` 값을 `'var(--safe-top) 20px calc(24px + env(safe-area-inset-bottom, 0px))'`로 수정. `minHeight: '100svh'`는 유지. |
| `app/privacy/page.tsx` | 동일하게 `paddingTop`에 `var(--safe-top)` 추가. |

`Toast.tsx`의 `bottom: max(96px, calc(48px + env(safe-area-inset-bottom, 0px)))`는 이미 safe-area 반영돼 있으므로 건드리지 않음.

## 보완 사항 (plan 검토에서 추가)

### 1. 변경 파일별 정확한 수정 값을 plan에 명시 (위 표에 반영 완료)
구현 단계에서 "minHeight만 고치고 padding 누락"하는 실수 방지.

### 2. 회귀 방지용 e2e 테스트 추가
- `e2e/11-safe-area-overflow.spec.ts` 신규 작성.
- Galaxy S25+ 프리셋(412×915) + `addInitScript`로 `--safe-top: 28px`, `--safe-bottom: 16px` 주입.
- 주요 페이지 11개(홈·solo/*·food/*·group/create·group/join·privacy) 순회하며 `document.documentElement.scrollHeight ≤ window.innerHeight + 2` 단언.
- `scripts/measure-heights.js`의 측정 로직을 재활용.

### 3. 게임 컴포넌트 가용 높이 재확인
- safe-top(~28) + safe-bottom(~48) + PageLayout bottom padding(32) = **약 108px 추가 차감** 후 `SpinWheel` / `RopePull` / `SlotMachine` / `ContentShuffle` 표시 여유 검증.
- Playwright 스크린샷으로 iPhone SE(375×667), Pixel 5(393×851), Galaxy S25+(412×915) 3개 뷰포트에서 게임 4종이 타이틀·버튼과 겹치지 않는지 시각 확인.
- 겹침 발견 시 `FlowRandomPage` 내부 레이아웃의 `gap` 또는 Canvas 크기 조정을 **이번 작업 범위 내**에서 같이 처리.

## 수용 기준

- [ ] Galaxy S25+ WebView에서 모든 페이지 `document.body.scrollHeight === window.innerHeight` (±2px 오차 허용)
- [ ] iPhone SE / Pixel 5 / Galaxy S25+ 에서 `/`, `/solo/*`, `/food/*`, `/group/*`, `/privacy` 세로 드래그 불가
- [ ] 게임 4종(SpinWheel / RopePull / SlotMachine / ContentShuffle)이 3개 뷰포트 모두에서 완전히 보이고 하단 버튼과 겹치지 않음
- [ ] 신규 e2e spec `11-safe-area-overflow.spec.ts`가 safe-area 주입 환경에서 전 페이지 통과
- [ ] 상태바 아래 헤더/타이틀이 가려지지 않음 (safe-top padding이 제대로 적용됨)

## 작업 순서

1. `globals.css` + `PageLayout.tsx` + `app/page.tsx` + `app/privacy/page.tsx` 4개 파일 수정
2. `npm run dev`로 로컬 검증 (Chrome devtools에서 `--safe-top: 28px` 주입 테스트)
3. e2e spec 추가 및 실행
4. 게임 컴포넌트 viewport-test (필요시 겹침 수정)
5. `npm run build` 로 타입/빌드 검증
6. Android APK 재빌드 후 실기기(Galaxy S25+) 확인 — **사용자 확인 단계**
