import { test, expect } from '@playwright/test';

/**
 * 시나리오 6: 그룹 방 설정 및 생성 화면
 * /group/setting → 투표/랜덤 선택 → /group/create → 후보 설정
 * (실제 방 생성은 Supabase 연결이 필요하므로 UI 검증까지만)
 */

test.describe('그룹 방 설정 및 생성 화면', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
  });

  test('/group/setting 에서 투표/랜덤 버튼이 보인다', async ({ page }) => {
    await page.goto('/group/setting');

    await expect(page.getByTestId('btn-mode-vote')).toBeVisible();
    await expect(page.getByTestId('btn-mode-random')).toBeVisible();
    await expect(page.getByText('투표로 결정')).toBeVisible();
    await expect(page.getByText('랜덤으로 결정')).toBeVisible();
  });

  test('"투표로 결정" 클릭 시 roomMode=vote 세션 설정 후 /group/create 이동', async ({ page }) => {
    await page.goto('/group/setting');
    await page.getByTestId('btn-mode-vote').click();
    await expect(page).toHaveURL(/\/group\/create/);

    const roomMode = await page.evaluate(() => sessionStorage.getItem('roomMode'));
    expect(roomMode).toBe('vote');
  });

  test('"랜덤으로 결정" 클릭 시 roomMode=random 세션 설정 후 /group/create 이동', async ({ page }) => {
    await page.goto('/group/setting');
    await page.getByTestId('btn-mode-random').click();
    await expect(page).toHaveURL(/\/group\/create/);

    const roomMode = await page.evaluate(() => sessionStorage.getItem('roomMode'));
    expect(roomMode).toBe('random');
  });

  test('/group/create 에서 기본 후보 4개가 있다', async ({ page }) => {
    await page.goto('/group/setting');
    await page.evaluate(() => sessionStorage.setItem('roomMode', 'vote'));
    await page.goto('/group/create');

    await expect(page.getByText('보드게임')).toBeVisible();
    await expect(page.getByText('노래방')).toBeVisible();
    await expect(page.getByText('방탈출')).toBeVisible();
    await expect(page.getByText('볼링')).toBeVisible();
  });

  test('/group/create 에서 "직접 입력" / "인원 기반" 탭이 있다', async ({ page }) => {
    await page.goto('/group/create');
    await page.evaluate(() => sessionStorage.setItem('roomMode', 'vote'));
    await page.reload();

    await expect(page.getByRole('button', { name: /직접 입력/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /인원 기반/ })).toBeVisible();
  });

  test('"인원 기반" 탭 클릭 시 인원 선택 버튼이 표시된다', async ({ page }) => {
    await page.goto('/group/create');
    await page.evaluate(() => sessionStorage.setItem('roomMode', 'vote'));
    await page.reload();

    await page.getByRole('button', { name: /인원 기반/ }).click();

    // 인원 선택 버튼 (2~6명)
    await expect(page.getByRole('button', { name: /2명/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /6명/ })).toBeVisible();
  });

  test('후보 1개 이하인 경우 방 만들기 클릭 시 에러 메시지', async ({ page }) => {
    await page.goto('/group/create');
    await page.evaluate(() => sessionStorage.setItem('roomMode', 'vote'));
    await page.reload();

    // 기본 후보 4개 모두 삭제
    const removeButtons = page.locator('button', { hasText: '×' });
    const count = await removeButtons.count();
    for (let i = 0; i < count; i++) {
      await removeButtons.first().click();
    }

    // 방 만들기 클릭
    await page.getByRole('button', { name: /방 만들기/ }).click();
    await expect(page.getByText('후보를 2개 이상 추가해주세요')).toBeVisible();
  });

  test('위치 입력 필드가 있다', async ({ page }) => {
    await page.goto('/group/create');

    await expect(page.getByPlaceholder('예: 강남역, 홍대...')).toBeVisible();
  });

  test('헤더에 방 모드(투표/랜덤) 표시', async ({ page }) => {
    await page.goto('/group/setting');
    await page.getByTestId('btn-mode-vote').click();
    await expect(page).toHaveURL(/\/group\/create/);

    await expect(page.getByText('방 만들기 (투표)')).toBeVisible();
  });
});
