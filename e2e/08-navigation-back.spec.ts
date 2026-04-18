import { test, expect } from '@playwright/test';

/**
 * 시나리오 8: 뒤로가기 내비게이션
 * 각 페이지의 BackButton이 올바른 경로로 이동하는지 확인
 *
 * UrlNormalizer가 URL을 '/'로 강제 변경하므로 toHaveURL 대신 DOM 요소 기반으로 페이지 전환 검증
 * 단, 홈('/')으로 이동하는 경우는 toHaveURL 사용 가능 (UrlNormalizer 결과가 '/'이기 때문)
 */

test.describe('뒤로가기 내비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
  });

  test('/solo/setting 에서 뒤로가기 시 / 로 이동', async ({ page }) => {
    await page.goto('/solo/setting');
    await page.getByTestId('btn-back').click();
    // 홈 도착: '혼자 결정' 텍스트로 확인
    await expect(page.getByText('혼자 결정')).toBeVisible({ timeout: 5000 });
  });

  test('/solo/people 에서 뒤로가기 시 /solo/setting 으로 이동', async ({ page }) => {
    await page.goto('/solo/people');
    await page.getByTestId('btn-back').click();
    // /solo/setting 도착: btn-mode-default 확인
    await expect(page.getByTestId('btn-mode-default')).toBeVisible({ timeout: 5000 });
  });

  test('/solo/custom 에서 뒤로가기 시 /solo/setting 으로 이동', async ({ page }) => {
    await page.goto('/solo/custom');
    await page.getByTestId('btn-back').click();
    // /solo/setting 도착: btn-mode-default 확인
    await expect(page.getByTestId('btn-mode-default')).toBeVisible({ timeout: 5000 });
  });

  test('/solo/location 에서 뒤로가기 시 /solo/people 으로 이동', async ({ page }) => {
    await page.goto('/solo/location');
    await page.getByTestId('btn-back').click();
    // /solo/people 도착: btn-people-3 확인
    await expect(page.getByTestId('btn-people-3')).toBeVisible({ timeout: 5000 });
  });

  test('/solo/random 에서 뒤로가기 시 /solo/setting 으로 이동', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('soloCandidates', JSON.stringify([
        { label: '볼링', emoji: '🎳' },
        { label: '영화', emoji: '🎬' },
      ]));
      sessionStorage.setItem('devTestMode', 'true');
    });
    await page.goto('/solo/random');
    // devTestMode: 게임 타입 선택 화면 대기
    await expect(page.getByText('게임 타입 선택')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('btn-back').click();
    // /solo/setting 도착: btn-mode-default 확인
    await expect(page.getByTestId('btn-mode-default')).toBeVisible({ timeout: 5000 });
  });

  test('/solo/result 에서 뒤로가기 시 /solo/random 으로 이동', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('activity', JSON.stringify({ label: '볼링', emoji: '🎳' }));
    });
    await page.goto('/solo/result');

    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-back').click();
    // UrlNormalizer가 URL을 '/'로 고정 → /solo/random 도착 시 result 화면이 사라지면 전환 성공
    // candidates 없으면 ⏳ 로딩 상태로 렌더되므로 result-card 소멸로 판단
    await expect(page.getByTestId('result-card')).not.toBeVisible({ timeout: 5000 });
  });

  test('/food/setting 에서 뒤로가기 시 / 로 이동', async ({ page }) => {
    await page.goto('/food/setting');
    await page.getByTestId('btn-back').click();
    // 홈 도착: '맛집 결정' 텍스트로 확인
    await expect(page.getByText('맛집 결정')).toBeVisible({ timeout: 5000 });
  });

  test('/food/custom 에서 뒤로가기 시 /food/setting 으로 이동', async ({ page }) => {
    await page.goto('/food/custom');
    await page.getByTestId('btn-back').click();
    // /food/setting 도착: btn-mode-default 확인
    await expect(page.getByTestId('btn-mode-default')).toBeVisible({ timeout: 5000 });
  });

  test('/food/location 에서 뒤로가기 시 적절한 이전 경로로 이동', async ({ page }) => {
    await page.goto('/food/location');
    await page.getByTestId('btn-back').click();
    // food/location 의 backHref는 food/setting → btn-mode-default 확인
    await expect(page.getByTestId('btn-mode-default')).toBeVisible({ timeout: 5000 });
  });

  test('/group/setting 에서 뒤로가기 시 / 로 이동', async ({ page }) => {
    await page.goto('/group/setting');
    await page.getByTestId('btn-back').click();
    // 홈 도착: '같이 결정' 텍스트로 확인
    await expect(page.getByText('같이 결정')).toBeVisible({ timeout: 5000 });
  });

  test('/group/create 에서 뒤로가기 시 /group/setting 으로 이동', async ({ page }) => {
    await page.goto('/group/create');
    await page.getByTestId('btn-back').click();
    // /group/setting 도착: btn-mode-vote 또는 btn-mode-random 확인 (strict mode violation 방지)
    await expect(page.getByTestId('btn-mode-vote')).toBeVisible({ timeout: 5000 });
  });

  test('/group/join 에서 뒤로가기 시 / 로 이동', async ({ page }) => {
    await page.goto('/group/join');
    await page.getByTestId('btn-back').click();
    // 홈 도착: '혼자 결정' 텍스트로 확인
    await expect(page.getByText('혼자 결정')).toBeVisible({ timeout: 5000 });
  });
});
