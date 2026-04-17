import { test, expect } from '@playwright/test';

/**
 * 시나리오 11: safe-area 환경에서 불필요 세로 스크롤 회귀 방지
 *
 * 배경
 *   Android 15 (targetSdk 35+) Edge-to-Edge 강제 적용으로 WebView 전체에
 *   env(safe-area-inset-*) 가 실제 값으로 전달된다. 과거 body 에 padding-top
 *   + 자식에 min-height:100svh 가 동시에 걸려 body 총 높이 = 100svh + safe-top
 *   으로 팽창해, 갤럭시 S25+ 전 페이지에 불필요한 세로 드래그가 생겼다.
 *
 * 목적
 *   Playwright headless Chrome 은 safe-area-inset-* 이 항상 0px 이라
 *   기본 실행으로는 이 버그를 재현할 수 없다. 여기서는 CSS 변수
 *   `--safe-top` / `--safe-bottom` 을 addStyleTag 로 주입해 갤럭시 S25+
 *   실기기 환경(상단 28px, 하단 16px)을 시뮬레이션하고, 각 페이지에서
 *   document.documentElement.scrollHeight 가 window.innerHeight 를
 *   초과하지 않는지 단언한다.
 *
 * 대상 페이지
 *   콘텐츠 길이가 뷰포트 안에 들어가도록 설계된 페이지만 포함.
 *   group/create · privacy 는 콘텐츠 자체가 뷰포트보다 길어 내부 스크롤이
 *   정상 동작이므로 이 검사에서 제외한다.
 */

const VIEWPORT = { width: 412, height: 915 }; // Galaxy S25+ CSS 뷰포트
const SAFE_TOP = 28;
const SAFE_BOTTOM = 16;
const TOLERANCE = 2; // 서브픽셀 오차 허용

const PAGES = [
  { path: '/', name: '홈' },
  { path: '/solo/setting', name: 'solo/setting' },
  { path: '/solo/people', name: 'solo/people' },
  { path: '/solo/custom', name: 'solo/custom' },
  { path: '/solo/location', name: 'solo/location' },
  { path: '/food/setting', name: 'food/setting' },
  { path: '/food/custom', name: 'food/custom' },
  { path: '/food/location', name: 'food/location' },
  { path: '/group/join', name: 'group/join' },
];

const GAME_TYPES = ['spin', 'shuffle', 'slot', 'rope'] as const;

async function injectSafeArea(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      :root {
        --safe-top: ${SAFE_TOP}px !important;
        --safe-bottom: ${SAFE_BOTTOM}px !important;
      }
    `,
  });
  await page.waitForTimeout(300);
}

async function measureOverflow(page: import('@playwright/test').Page) {
  return page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
    bodyHeight: Math.round(document.body.getBoundingClientRect().height),
  }));
}

test.describe('safe-area 환경에서 세로 overflow 없음 (Galaxy S25+ 시뮬)', () => {
  test.use({ viewport: VIEWPORT });

  for (const { path, name } of PAGES) {
    test(`${name} — safe-top 28px / safe-bottom 16px 주입 후 body overflow 없음`, async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
      await page.goto(path, { waitUntil: 'networkidle' });

      await injectSafeArea(page);

      const metrics = await measureOverflow(page);
      const overflow = metrics.scrollHeight - metrics.innerHeight;

      expect(
        overflow,
        `${path}: scrollHeight(${metrics.scrollHeight}) > innerHeight(${metrics.innerHeight}), overflow=${overflow}px — safe-area 반영 후 세로 드래그 발생`,
      ).toBeLessThanOrEqual(TOLERANCE);
    });
  }
});

test.describe('게임 4종 safe-area 환경 overflow 없음 (/solo/random)', () => {
  test.use({ viewport: VIEWPORT });

  for (const gameType of GAME_TYPES) {
    test(`게임 ${gameType} — Galaxy S25+ safe-area 반영 후 버튼/타이틀 겹침 없음`, async ({ page }) => {
      await page.goto('/');

      // 게임 타입을 devTestMode 로 수동 선택하기 위한 세션 사전 설정
      await page.evaluate(() => {
        sessionStorage.setItem('splashSeen', 'true');
        sessionStorage.setItem('devTestMode', 'true');
        sessionStorage.setItem('soloMode', 'custom');
        sessionStorage.setItem(
          'soloCandidates',
          JSON.stringify([
            { label: '치킨', emoji: '🍗' },
            { label: '피자', emoji: '🍕' },
            { label: '떡볶이', emoji: '🍢' },
            { label: '초밥', emoji: '🍣' },
          ]),
        );
        sessionStorage.setItem('soloLocation', '강남역');
      });

      await page.goto('/solo/random', { waitUntil: 'networkidle' });
      await injectSafeArea(page);

      // devTestMode 선택 화면에서 해당 게임 타입 버튼 클릭
      const targetButton = page
        .getByRole('button')
        .filter({ hasText: { spin: '돌림판', shuffle: '컨텐츠 셔플', slot: '슬롯머신', rope: '줄 뽑기' }[gameType] });
      await targetButton.click();

      // 게임 캔버스/DOM 렌더 대기
      await page.waitForTimeout(800);

      const metrics = await measureOverflow(page);
      const overflow = metrics.scrollHeight - metrics.innerHeight;

      expect(
        overflow,
        `/solo/random [${gameType}]: scrollHeight(${metrics.scrollHeight}) > innerHeight(${metrics.innerHeight}), overflow=${overflow}px — 게임 컴포넌트가 뷰포트를 초과`,
      ).toBeLessThanOrEqual(TOLERANCE);
    });
  }
});
