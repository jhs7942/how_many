import { test, expect } from '@playwright/test';

test.describe('Group 플로우 — 오류 시나리오', () => {
  test('vote: roomId 없으면 홈으로 redirect', async ({ page }) => {
    await page.goto('/group/vote');
    // sessionStorage 비어있으면 / 로 이동
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('vote-status: roomId 없으면 홈으로 redirect', async ({ page }) => {
    await page.goto('/group/vote-status');
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('group/result: roomId 없으면 홈으로 redirect', async ({ page }) => {
    await page.goto('/group/result');
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('group/setting: 백버튼 → 홈', async ({ page }) => {
    await page.goto('/group/setting');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL('/');
  });
});
