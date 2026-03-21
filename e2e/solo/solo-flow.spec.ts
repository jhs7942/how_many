import { test, expect } from '@playwright/test';

test.describe('Solo 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 스플래시 스킵을 위해 splashSeen 설정
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
  });

  test('기본값 모드: 인원 선택 → 결과까지 전체 플로우', async ({ page }) => {
    await page.goto('/solo/setting');

    // 1. 인원 수 추천 선택
    await page.getByTestId('btn-mode-default').click();
    await expect(page).toHaveURL('/solo/people');

    // 2. 3명 선택
    await page.getByTestId('btn-people-3').click();
    await expect(page).toHaveURL('/solo/location');

    // 3. 위치 건너뛰기
    await page.goto('/solo/random');

    // 4. 돌림판 or 컨텐츠 셔플 렌더링 확인
    await expect(page.locator('canvas, [data-testid="btn-spin"]').first()).toBeVisible({ timeout: 3000 });

    // spin 버튼이 있으면 (돌림판 모드) 클릭
    const spinBtn = page.getByTestId('btn-spin');
    if (await spinBtn.isVisible()) {
      await spinBtn.click();
      await expect(spinBtn).toBeDisabled();
    }
  });

  test('백버튼: setting → home', async ({ page }) => {
    await page.goto('/solo/setting');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL('/');
  });

  test('백버튼: people → setting', async ({ page }) => {
    await page.goto('/solo/people');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL('/solo/setting');
  });

  test('결과 화면: result-card, 버튼들 표시', async ({ page }) => {
    // sessionStorage에 activity 직접 설정
    await page.goto('/solo/result');
    await page.evaluate(() => {
      sessionStorage.setItem('activity', JSON.stringify({ label: '카페', emoji: '☕' }));
    });
    await page.reload();

    await expect(page.getByTestId('result-card')).toBeVisible();
    await expect(page.getByTestId('result-activity')).toContainText('카페');
    await expect(page.getByTestId('btn-share')).toBeVisible();
    await expect(page.getByTestId('btn-retry')).toBeVisible();
    await expect(page.getByTestId('btn-home')).toBeVisible();
  });

  test('결과 화면: 위치 있을 때 지도 버튼 표시', async ({ page }) => {
    await page.goto('/solo/result');
    await page.evaluate(() => {
      sessionStorage.setItem('activity', JSON.stringify({ label: '카페', emoji: '☕' }));
      sessionStorage.setItem('soloLocation', '강남역');
    });
    await page.reload();

    await expect(page.getByTestId('btn-map-kakao')).toBeVisible();
    await expect(page.getByTestId('btn-map-naver')).toBeVisible();
  });

  test('결과 화면: 위치 없으면 지도 버튼 미표시', async ({ page }) => {
    await page.goto('/solo/result');
    await page.evaluate(() => {
      sessionStorage.setItem('activity', JSON.stringify({ label: '보드게임', emoji: '🎲' }));
    });
    await page.reload();

    await expect(page.getByTestId('btn-map-kakao')).not.toBeVisible();
    await expect(page.getByTestId('btn-map-naver')).not.toBeVisible();
  });

  test('인원 선택: 2~6명 버튼 모두 표시', async ({ page }) => {
    await page.goto('/solo/people');

    for (const count of [2, 3, 4, 5, 6]) {
      await expect(page.getByTestId(`btn-people-${count}`)).toBeVisible();
    }
  });

  test('세션 없이 result 진입 시 setting으로 리다이렉트', async ({ page }) => {
    await page.goto('/solo/result');
    await expect(page).toHaveURL('/solo/setting');
  });
});
