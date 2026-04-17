# Galaxy S25+ 전 페이지 불필요 세로 드래그

## 발생 환경
- 날짜: 2026-04-18
- 관련 파일:
  - `app/globals.css`
  - `components/PageLayout.tsx`
  - `app/page.tsx`
  - `app/privacy/page.tsx`
- 라이브러리·버전: Next.js 15 + Capacitor Android, targetSdkVersion 36 (Android 15), compileSdkVersion 36
- 재현 기기: Galaxy S25+ (CSS 뷰포트 412×915, DPR 3.0, safe-area-inset-top ≈ 28px)

## 증상
- Android 15 Capacitor WebView에서 **홈·solo 전체·food 전체·group/join 등 콘텐츠가 뷰포트 안에 들어가야 하는 모든 페이지**에서 세로 스크롤이 발생.
- 드래그 가능한 추가 영역은 약 28px 로 상단 상태바 높이(safe-area-inset-top)와 일치.
- Playwright 기본 실행 환경(Chrome headless, viewport 393×851)에서는 `env(safe-area-inset-*)`가 항상 0이라 **재현되지 않음** → e2e 회귀 감지 실패.

## 시행착오

1. **1차 측정 (부정확)** — Playwright로 iPhone SE / Pixel 5 / iPhone 14 Pro Max 뷰포트를 돌려 scrollHeight 측정. 대부분 페이지가 뷰포트와 정확히 일치(overflow=0)하게 나와 "버그 없음"으로 결론 낼 뻔함. → safe-area-inset이 0인 환경에서만 측정했기 때문에 버그가 숨음.

2. **2차 시도 (Capacitor 설정 추적)** — `capacitor.config.ts` 의 StatusBar 플러그인 설정과 AndroidManifest 를 확인. `android:fitsSystemWindows` 등 별도 처리가 없었고 MainActivity는 기본 `BridgeActivity` 상속. Edge-to-Edge 비활성화 옵션도 없었음.

3. **3차 시도 (CSS 구조 재검토)** — `globals.css`·`PageLayout.tsx`·`app/page.tsx` 를 나란히 비교하며 box model 추적. `body { min-height: 100svh; padding-top: var(--safe-top) }` + 자식 `min-height: 100svh` 조합이 safe-area 비-0 환경에서 body 총 높이를 `100svh + safe-top` 으로 팽창시키는 걸 확인.

4. **4차 측정 (safe-area 주입)** — `scripts/measure-heights.js` 에서 `page.addStyleTag()` 로 `:root { --safe-top: 28px !important }` 를 주입해 Galaxy S25+ WebView 환경을 시뮬. 수정 전 모든 정상 페이지 943px(+28px overflow), 수정 후 915px(overflow=0) 확인.

## 원인

**Android 15 Edge-to-Edge 강제 적용과 CSS 레이아웃 구조의 중복 높이 요구.**

- `targetSdkVersion = 36` (Android 15) 부터는 WebView 가 상태바·제스처바 영역을 포함한 디스플레이 전체를 덮고, `env(safe-area-inset-top/bottom)` 에 실제 값(≈ 28px / 16px)을 전달.
- 기존 CSS:
  ```css
  body {
    min-height: 100svh;           /* 뷰포트 전체 = 915px */
    padding-top: var(--safe-top); /* + 28px */
  }
  ```
  그리고 자식 `PageLayout` 이 `minHeight: '100svh'` 로 다시 915px 를 요구.
- `box-sizing: border-box` 여도 **자식 min-height 가 부모 content-area 보다 크면** 부모가 자식을 수용하기 위해 `padding + 100svh` 로 팽창 → body 총 높이 943px, 뷰포트 915px → 28px 세로 overflow 발생.
- 이 overflow 가 바로 "불필요한 세로 드래그" 의 정체.

## 해결책

**body 는 safe-area 에 관여하지 않고, 콘텐츠 컨테이너가 자신의 padding 안에서 safe-top·safe-bottom 을 흡수하도록 재배치.**

| 파일 | Before | After |
|---|---|---|
| `app/globals.css` body | `padding-top: var(--safe-top)` | 제거 (이유 주석 추가) |
| `components/PageLayout.tsx` | `paddingTop: 0` | `paddingTop: 'var(--safe-top)'` |
| `app/page.tsx` | `padding: '0 20px calc(24px + env(safe-area-inset-bottom, 0px))'` | `padding: 'var(--safe-top) 20px calc(24px + env(safe-area-inset-bottom, 0px))'` |
| `app/privacy/page.tsx` | `padding: '0 20px 40px'` | `padding: 'var(--safe-top) 20px calc(40px + env(safe-area-inset-bottom, 0px))'` |

`box-sizing: border-box` 이므로 `paddingTop` 은 `minHeight: 100svh` 안에 포함되어 overflow 가 사라짐. body 총 높이 = 자식 높이 = 100svh = 뷰포트 정확히 일치.

Capacitor StatusBar 플러그인·Android MainActivity 코드는 손대지 않음 (Android 15 Edge-to-Edge 가이드라인 존중).

### 검증

- `scripts/measure-heights.js` 로 safe-top=28px, safe-bottom=16px 주입 후 재측정:
  - 홈/solo/food/group/join 모두 **scrollHeight 915px == innerHeight 915px** (overflow 0)
- `e2e/11-safe-area-overflow.spec.ts` 신규 작성 후 13/13 통과 (일반 9 페이지 + 게임 4종)
- `npm run build` 성공, 32개 페이지 prerender

## 재발 방지

1. **e2e 회귀 테스트**: `e2e/11-safe-area-overflow.spec.ts` 가 Galaxy S25+ 뷰포트 + safe-area 주입 환경에서 **`scrollHeight ≤ innerHeight + 2` 단언**. 이후 누군가 body·PageLayout·app/page·privacy 의 padding 또는 min-height 구조를 되돌리면 해당 spec 이 즉시 실패.

2. **Playwright 기본 실행은 safe-area 0** 이라는 한계를 문서화. 디바이스별 버그를 잡으려면 반드시 `addStyleTag` 로 `--safe-top` / `--safe-bottom` 을 주입해야 함 (`e2e/11-safe-area-overflow.spec.ts` 의 `injectSafeArea()` 헬퍼 참고).

3. **CSS 레이아웃 원칙**: body 는 배경·최대 너비만 책임지고, **safe-area 삽입은 항상 콘텐츠 컨테이너 쪽에서 padding 으로 처리**한다. body padding-top 과 자식 min-height:100svh 는 공존 금지 (`globals.css` 에 주석으로 명시).

4. **targetSdk 상향 시 체크리스트**: 향후 Android SDK 올릴 때 Edge-to-Edge 동작이 바뀌지 않는지 이 spec 재실행으로 확인.
