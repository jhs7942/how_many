import { test, expect } from '@playwright/test';

/**
 * UrlNormalizer가 모든 URL을 '/'로 변경하므로
 * DOM 요소 기반으로 페이지 전환을 검증한다.
 */
test.describe('Group 플로우 — 방장', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('splashSeen', 'true');
    });
  });

  test('setting: 투표 모드 선택 → create 이동', async ({ page }) => {
    await page.goto('/group/setting');
    await page.getByTestId('btn-mode-vote').click();
    // create 페이지 도달 확인 ("방 만들기 🎉" 버튼으로 특정)
    await expect(page.locator('text=후보 설정 방식')).toBeVisible({ timeout: 15000 });
  });

  test('setting: 랜덤 모드 선택 → create 이동', async ({ page }) => {
    await page.goto('/group/setting');
    await page.getByTestId('btn-mode-random').click();
    await expect(page.locator('text=후보 설정 방식')).toBeVisible({ timeout: 15000 });
  });

  test('setting: 백버튼 → 홈 이동', async ({ page }) => {
    await page.goto('/group/setting');
    await page.getByTestId('btn-back').click();
    // 홈 페이지 도달 확인
    await expect(page.locator('text=혼자 결정')).toBeVisible({ timeout: 10000 });
  });

  test.skip('vote-status: 방장에게 강제 마감 버튼 표시', async ({ page }) => {
    // Supabase 연결 없이는 테스트 불가
    await page.goto('/group/vote-status');
  });

  test.skip('result: 결과 화면 렌더링', async ({ page }) => {
    // Supabase 연결 없이는 테스트 불가
    await page.goto('/group/result');
  });
});
