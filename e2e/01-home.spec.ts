import { test, expect } from '@playwright/test';

/**
 * 시나리오 1: 홈 화면 렌더링
 * - 스플래시 화면 표시 후 홈 화면 진입
 * - 4개 카드(혼자 결정, 같이 결정, 참여하기, 맛집 결정) 확인
 * - 각 카드 클릭 시 올바른 경로로 이동
 */

// splashSeen 주입 후 홈 화면이 완전히 보일 때까지 대기하는 헬퍼
async function gotoHomeReady(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
  await page.reload();
  // homeVisible 이 true 가 될 때까지 대기
  await expect(page.getByText('혼자 결정')).toBeVisible({ timeout: 3000 });
}

test.describe('홈 화면', () => {
  test('스플래시 후 홈 4개 카드가 보인다', async ({ page }) => {
    // 첫 방문: splashSeen 없음 → 스플래시 표시
    await page.goto('/');

    // 스플래시 화면의 타이틀 확인
    await expect(page.getByText('몇명이니').first()).toBeVisible();

    // 스플래시 사라지고 홈 카드 등장 (최대 4초 대기)
    await expect(page.getByText('혼자 결정')).toBeVisible({ timeout: 4000 });
    await expect(page.getByText('같이 결정')).toBeVisible();
    await expect(page.getByText('참여하기')).toBeVisible();
    await expect(page.getByText('맛집 결정')).toBeVisible();
  });

  test('두 번째 방문 시 스플래시 없이 바로 홈 카드가 보인다', async ({ page }) => {
    await gotoHomeReady(page);

    await expect(page.getByText('혼자 결정')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('같이 결정')).toBeVisible();
    await expect(page.getByText('참여하기')).toBeVisible();
    await expect(page.getByText('맛집 결정')).toBeVisible();
  });

  test('"혼자 결정" 카드 클릭 시 /solo/setting 으로 이동', async ({ page }) => {
    await gotoHomeReady(page);
    await page.getByText('혼자 결정').click();
    await expect(page).toHaveURL(/\/solo\/setting/);
  });

  test('"같이 결정" 카드 클릭 시 /group/setting 으로 이동', async ({ page }) => {
    await gotoHomeReady(page);
    await page.getByText('같이 결정').click();
    await expect(page).toHaveURL(/\/group\/setting/);
  });

  test('"참여하기" 카드 클릭 시 /group/join 으로 이동', async ({ page }) => {
    await gotoHomeReady(page);
    await page.getByText('참여하기').click();
    await expect(page).toHaveURL(/\/group\/join/);
  });

  test('"맛집 결정" 카드 클릭 시 /food/setting 으로 이동', async ({ page }) => {
    await gotoHomeReady(page);
    await page.getByText('맛집 결정').click();
    await expect(page).toHaveURL(/\/food\/setting/);
  });

  test('콘솔 에러가 없다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await gotoHomeReady(page);
    expect(errors).toHaveLength(0);
  });
});
