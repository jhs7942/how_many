import { test, expect } from '@playwright/test';

/**
 * 시나리오 8: 뒤로가기 내비게이션
 * 각 페이지의 BackButton이 올바른 경로로 이동하는지 확인
 */

test.describe('뒤로가기 내비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
  });

  test('/solo/setting 에서 뒤로가기 시 / 로 이동', async ({ page }) => {
    await page.goto('/solo/setting');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/^\/$/);
  });

  test('/solo/people 에서 뒤로가기 시 /solo/setting 으로 이동', async ({ page }) => {
    await page.goto('/solo/people');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/\/solo\/setting/);
  });

  test('/solo/custom 에서 뒤로가기 시 /solo/setting 으로 이동', async ({ page }) => {
    await page.goto('/solo/custom');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/\/solo\/setting/);
  });

  test('/solo/location 에서 뒤로가기 시 /solo/people 으로 이동', async ({ page }) => {
    await page.goto('/solo/location');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/\/solo\/people/);
  });

  test('/solo/random 에서 뒤로가기 시 /solo/setting 으로 이동', async ({ page }) => {
    await page.goto('/solo/random');
    await page.evaluate(() => {
      sessionStorage.setItem('soloCandidates', JSON.stringify([
        { label: '볼링', emoji: '🎳' },
        { label: '영화', emoji: '🎬' },
      ]));
      sessionStorage.setItem('devTestMode', 'true');
    });
    await page.reload();

    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/\/solo\/setting/);
  });

  test('/solo/result 에서 뒤로가기 시 /solo/random 으로 이동', async ({ page }) => {
    await page.goto('/solo/result');
    await page.evaluate(() => {
      sessionStorage.setItem('activity', JSON.stringify({ label: '볼링', emoji: '🎳' }));
    });
    await page.reload();

    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/\/solo\/random/);
  });

  test('/food/setting 에서 뒤로가기 시 / 로 이동', async ({ page }) => {
    await page.goto('/food/setting');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/^\/$/);
  });

  test('/food/custom 에서 뒤로가기 시 /food/setting 으로 이동', async ({ page }) => {
    await page.goto('/food/custom');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/\/food\/setting/);
  });

  test('/food/location 에서 뒤로가기 시 적절한 이전 경로로 이동', async ({ page }) => {
    await page.goto('/food/location');
    await page.getByTestId('btn-back').click();
    // food/location 의 backHref는 food/setting
    await expect(page).toHaveURL(/\/food\/setting/);
  });

  test('/group/setting 에서 뒤로가기 시 / 로 이동', async ({ page }) => {
    await page.goto('/group/setting');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/^\/$/);
  });

  test('/group/create 에서 뒤로가기 시 /group/setting 으로 이동', async ({ page }) => {
    await page.goto('/group/create');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/\/group\/setting/);
  });

  test('/group/join 에서 뒤로가기 시 / 로 이동', async ({ page }) => {
    await page.goto('/group/join');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/^\/$/);
  });
});
