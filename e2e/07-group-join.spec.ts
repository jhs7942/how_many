import { test, expect } from '@playwright/test';

/**
 * 시나리오 7: 그룹 방 참여하기 (코드 입력)
 * /group/join → 6자리 코드 입력 → 에러 처리 확인
 * (실제 DB 조회는 네트워크 모킹으로 처리)
 */

test.describe('그룹 방 참여하기', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
  });

  test('/group/join 에서 코드 입력 필드와 입장하기 버튼이 있다', async ({ page }) => {
    await page.goto('/group/join');

    await expect(page.getByPlaceholder('XXXXXX')).toBeVisible();
    await expect(page.getByRole('button', { name: '입장하기' })).toBeVisible();
  });

  test('6자리 미만 입력 시 입장하기 버튼이 비활성화된다', async ({ page }) => {
    await page.goto('/group/join');

    await page.getByPlaceholder('XXXXXX').fill('ABC');
    await expect(page.getByRole('button', { name: '입장하기' })).toBeDisabled();
  });

  test('6자리 입력 시 입장하기 버튼이 활성화된다', async ({ page }) => {
    await page.goto('/group/join');

    await page.getByPlaceholder('XXXXXX').fill('ABCDEF');
    await expect(page.getByRole('button', { name: '입장하기' })).toBeEnabled();
  });

  test('소문자 입력 시 자동으로 대문자로 변환된다', async ({ page }) => {
    await page.goto('/group/join');

    await page.getByPlaceholder('XXXXXX').fill('abcdef');
    const value = await page.getByPlaceholder('XXXXXX').inputValue();
    expect(value).toBe('ABCDEF');
  });

  test('7자 이상 입력 시 6자리까지만 저장된다', async ({ page }) => {
    await page.goto('/group/join');

    await page.getByPlaceholder('XXXXXX').fill('ABCDEFGH');
    const value = await page.getByPlaceholder('XXXXXX').inputValue();
    expect(value.length).toBe(6);
  });

  test('존재하지 않는 방 코드 입력 시 에러 메시지 표시', async ({ page }) => {
    // Supabase API 호출을 모킹: 방 없음 응답
    await page.route('**/rest/v1/rooms*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/group/join');
    await page.getByPlaceholder('XXXXXX').fill('ZZZZZ9');
    await page.getByRole('button', { name: '입장하기' }).click();

    await expect(page.getByText('방을 찾을 수 없습니다')).toBeVisible({ timeout: 5000 });
  });

  test('네트워크 오류 시 에러 메시지 표시', async ({ page }) => {
    // 네트워크 에러 모킹
    await page.route('**/rest/v1/rooms*', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/group/join');
    await page.getByPlaceholder('XXXXXX').fill('AAAAAA');
    await page.getByRole('button', { name: '입장하기' }).click();

    await expect(page.getByText('오류가 발생했습니다')).toBeVisible({ timeout: 5000 });
  });

  test('Enter 키로도 입장 가능하다', async ({ page }) => {
    await page.route('**/rest/v1/rooms*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/group/join');
    await page.getByPlaceholder('XXXXXX').fill('ABCDEF');
    await page.getByPlaceholder('XXXXXX').press('Enter');

    // 에러 메시지(방 없음) 또는 이동 확인
    await expect(page.getByText('방을 찾을 수 없습니다')).toBeVisible({ timeout: 5000 });
  });

  test('뒤로가기 버튼 클릭 시 / 로 이동', async ({ page }) => {
    await page.goto('/group/join');
    await page.getByTestId('btn-back').click();
    await expect(page).toHaveURL(/^\//);
  });
});
