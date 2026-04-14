import { test, expect } from '@playwright/test';

/**
 * 시나리오 9: UI 상태 (로딩, 빈 상태, 에러 상태)
 * - 버튼 비활성화 상태
 * - 빈 후보 목록
 * - 에러 메시지 표시
 * - 로딩 표시
 */

test.describe('UI 상태 검증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
  });

  test('solo/custom: 후보 0개일 때 다음 버튼 비활성화', async ({ page }) => {
    await page.goto('/solo/custom');

    // 기본 후보(카페, 영화) 모두 삭제
    let removeBtn = page.locator('button', { hasText: '×' }).first();
    while (await removeBtn.isVisible()) {
      await removeBtn.click();
      removeBtn = page.locator('button', { hasText: '×' }).first();
    }

    await expect(page.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  test('solo/custom: 후보 1개일 때 다음 버튼 비활성화', async ({ page }) => {
    await page.goto('/solo/custom');

    // 카페 삭제 (영화만 남음)
    await page.locator('button', { hasText: '×' }).first().click();

    await expect(page.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  test('solo/custom: 후보 2개일 때 다음 버튼 활성화', async ({ page }) => {
    await page.goto('/solo/custom');
    // 기본 후보 2개 있음
    await expect(page.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  test('group/create: 방 생성 버튼 클릭 중 로딩 텍스트 표시', async ({ page }) => {
    // Supabase 요청을 지연시켜서 로딩 상태 확인
    await page.route('**/rest/v1/rooms*', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-id', code: 'TEST00' }),
      });
    });

    await page.goto('/group/create');
    await page.evaluate(() => sessionStorage.setItem('roomMode', 'vote'));
    await page.reload();

    await page.getByRole('button', { name: /방 만들기/ }).click();
    await expect(page.getByText('방 생성 중...')).toBeVisible({ timeout: 3000 });
  });

  test('group/create: 후보 없을 때 에러 메시지', async ({ page }) => {
    await page.goto('/group/create');
    await page.evaluate(() => sessionStorage.setItem('roomMode', 'vote'));
    await page.reload();

    // 후보 모두 삭제
    const removeButtons = page.locator('button', { hasText: '×' });
    const count = await removeButtons.count();
    for (let i = 0; i < count; i++) {
      await removeButtons.first().click();
    }

    await page.getByRole('button', { name: /방 만들기/ }).click();
    await expect(page.getByText('후보를 2개 이상 추가해주세요')).toBeVisible();
  });

  test('group/join: 코드 입력 중 에러 표시 후 입력 변경 시 에러 사라짐', async ({ page }) => {
    await page.route('**/rest/v1/rooms*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/group/join');
    await page.getByPlaceholder('XXXXXX').fill('ZZZZZZ');
    await page.getByRole('button', { name: '입장하기' }).click();
    await expect(page.getByText('방을 찾을 수 없습니다')).toBeVisible({ timeout: 5000 });

    // 입력 변경 시 에러 메시지 사라짐
    await page.getByPlaceholder('XXXXXX').fill('AAAAAA');
    await expect(page.getByText('방을 찾을 수 없습니다')).not.toBeVisible();
  });

  test('food/custom: 초기 후보가 0개(빈 상태)로 시작한다', async ({ page }) => {
    await page.goto('/food/custom');

    // food/custom은 defaultCandidates=[] 이므로 초기 후보 없음
    // 카운터가 0/8 이어야 함
    await expect(page.getByText('0/8')).toBeVisible();
  });

  test('food/custom: 후보 1개일 때 다음 버튼 비활성화', async ({ page }) => {
    await page.goto('/food/custom');

    await page.getByPlaceholder('후보 추가...').fill('파스타');
    await page.getByRole('button', { name: '추가' }).click();

    await expect(page.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  test('location: 위치 입력 전에는 버튼이 "건너뛰기"로 표시', async ({ page }) => {
    await page.goto('/solo/location');

    await expect(page.getByRole('button', { name: '건너뛰기' })).toBeVisible();
  });

  test('location: 위치 입력 후 버튼이 "다음"으로 바뀐다', async ({ page }) => {
    await page.goto('/solo/location');

    await page.getByPlaceholder('예: 강남역, 홍대, 서울 마포구...').fill('홍대');
    await expect(page.getByRole('button', { name: '다음' })).toBeVisible();
    await expect(page.getByRole('button', { name: '건너뛰기' })).not.toBeVisible();
  });
});
