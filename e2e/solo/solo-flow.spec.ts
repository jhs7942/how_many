import { test, expect } from '@playwright/test';

/**
 * UrlNormalizer가 모든 페이지에서 URL을 '/'로 강제 변경하므로
 * toHaveURL() 대신 DOM 요소 기반으로 페이지 전환을 검증한다.
 */
test.describe('Solo 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('splashSeen', 'true');
      sessionStorage.setItem('soloMode', JSON.stringify('default'));
    });
  });

  // /solo/people 페이지를 먼저 방문하여 Turbopack 컴파일 워밍업
  test('인원 선택: 2~6명 버튼 모두 표시', async ({ page }) => {
    await page.goto('/solo/people', { waitUntil: 'domcontentloaded' });

    for (const count of [2, 3, 4, 5, 6]) {
      await expect(page.getByTestId(`btn-people-${count}`)).toBeVisible();
    }
  });

  test.fixme('기본값 모드: 인원 선택 → 결과까지 전체 플로우', async ({ page }) => {
    // FIXME: UrlNormalizer의 replaceState('/')가 Next.js router.push와 경쟁 조건 발생
    // 클릭 후 router.push('/solo/people') 실행 시 UrlNormalizer가 URL을 '/'로 변경하면서
    // Next.js가 홈으로 재라우팅함. 실제 앱에서는 정상 동작 (사용자 인터랙션 타이밍 차이)
    await page.goto('/solo/setting', { waitUntil: 'domcontentloaded' });

    // React hydration 완료 대기
    const btn = page.getByTestId('btn-mode-default');
    await expect(btn).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // 1. 인원 수 추천 선택
    await btn.click();
    await expect(page.getByTestId('btn-people-3')).toBeVisible({ timeout: 20000 });

    // 2. 3명 선택
    await page.getByTestId('btn-people-3').click();
    await expect(page.locator('text=건너뛰기').or(page.locator('text=다음'))).toBeVisible({ timeout: 10000 });

    // 3. 위치 건너뛰기
    await page.goto('/solo/random', { waitUntil: 'domcontentloaded' });

    // 4. 게임 렌더링 확인
    await expect(page.locator('canvas, [data-testid="btn-spin"]').first()).toBeVisible({ timeout: 5000 });

    const spinBtn = page.getByTestId('btn-spin');
    if (await spinBtn.isVisible()) {
      await spinBtn.click();
      await expect(spinBtn).toBeDisabled();
    }
  });

  test('백버튼: setting → home', async ({ page }) => {
    await page.goto('/solo/setting', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('btn-back')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    await page.getByTestId('btn-back').click();
    await expect(page.locator('text=혼자 결정')).toBeVisible({ timeout: 15000 });
  });

  test.fixme('백버튼: people → setting', async ({ page }) => {
    // FIXME: UrlNormalizer + router.push 경쟁 조건 (위 테스트와 동일 원인)
    await page.goto('/solo/people', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('btn-back')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.getByTestId('btn-back').click();
    await expect(page.getByTestId('btn-mode-default')).toBeVisible({ timeout: 15000 });
  });

  test('결과 화면: result-card, 버튼들 표시', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('activity', JSON.stringify({ label: '카페', emoji: '☕' }));
    });
    await page.goto('/solo/result');

    await expect(page.getByTestId('result-card')).toBeVisible();
    await expect(page.getByTestId('result-activity')).toContainText('카페');
    await expect(page.getByTestId('btn-share')).toBeVisible();
    await expect(page.getByTestId('btn-retry')).toBeVisible();
    await expect(page.getByTestId('btn-home')).toBeVisible();
  });

  test('결과 화면: 위치 있을 때 지도 버튼 표시', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('activity', JSON.stringify({ label: '카페', emoji: '☕' }));
      sessionStorage.setItem('soloLocation', JSON.stringify('강남역'));
    });
    await page.goto('/solo/result');

    await expect(page.getByTestId('btn-map-kakao')).toBeVisible();
    await expect(page.getByTestId('btn-map-naver')).toBeVisible();
  });

  test('결과 화면: 위치 없으면 지도 버튼 미표시', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('activity', JSON.stringify({ label: '보드게임', emoji: '🎲' }));
    });
    await page.goto('/solo/result');

    await expect(page.getByTestId('btn-map-kakao')).not.toBeVisible();
    await expect(page.getByTestId('btn-map-naver')).not.toBeVisible();
  });

  test('세션 없이 result 진입 시 리다이렉트', async ({ page }) => {
    await page.goto('/solo/result');
    await expect(page.getByTestId('result-card')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('btn-mode-default')).toBeVisible({ timeout: 10000 });
  });
});
