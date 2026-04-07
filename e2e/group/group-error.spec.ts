import { test, expect } from '@playwright/test';

/**
 * UrlNormalizer가 모든 URL을 '/'로 변경하므로
 * DOM 요소 기반으로 리다이렉트를 검증한다.
 */
test.describe('Group 플로우 — 오류 시나리오', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('splashSeen', 'true');
    });
  });

  test('vote: roomId 없으면 홈으로 redirect', async ({ page }) => {
    await page.goto('/group/vote', { waitUntil: 'domcontentloaded' });
    // 홈 페이지 도달 확인 (고유 텍스트)
    await expect(page.locator('text=혼자 결정')).toBeVisible({ timeout: 15000 });
  });

  test('vote-status: roomId 없으면 홈으로 redirect', async ({ page }) => {
    await page.goto('/group/vote-status', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=혼자 결정')).toBeVisible({ timeout: 15000 });
  });

  test('group/result: roomId 없으면 홈으로 redirect', async ({ page }) => {
    await page.goto('/group/result', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=혼자 결정')).toBeVisible({ timeout: 15000 });
  });

  test('group/setting: 백버튼 → 홈', async ({ page }) => {
    await page.goto('/group/setting');
    await page.getByTestId('btn-back').click();
    // homeVisible 렌더링 + hydration 대기
    await expect(page.locator('text=혼자 결정')).toBeVisible({ timeout: 15000 });
  });
});
