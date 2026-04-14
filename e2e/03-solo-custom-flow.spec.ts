import { test, expect } from '@playwright/test';

/**
 * 시나리오 3: Solo 직접 입력 플로우
 * /solo/setting → "직접 입력하기" → /solo/custom → 후보 추가 → /solo/location → /solo/random
 */

test.describe('Solo 직접 입력 플로우', () => {
  test('"직접 입력하기" 클릭 시 /solo/custom 으로 이동', async ({ page }) => {
    await page.goto('/solo/setting');
    await page.getByTestId('btn-mode-custom').click();
    await expect(page).toHaveURL(/\/solo\/custom/);
  });

  test('/solo/custom 에서 기본 후보 2개(카페, 영화)가 있다', async ({ page }) => {
    await page.goto('/solo/custom');

    // 후보 목록에서 정확히 "카페", "영화" 텍스트 확인 (CandidateEditor 목록 내)
    // CandidateEditor 내 span 엘리먼트로 좁혀서 확인
    const candidateList = page.locator('div').filter({ hasText: /카페/ }).first();
    await expect(candidateList).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^카페$/ })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^영화$/ })).toBeVisible();
  });

  test('후보 직접 입력 후 추가 버튼 클릭 시 목록에 추가된다', async ({ page }) => {
    await page.goto('/solo/custom');

    await page.getByPlaceholder('후보 추가...').fill('볼링');
    await page.getByRole('button', { name: '추가' }).click();

    await expect(page.locator('span').filter({ hasText: /^볼링$/ })).toBeVisible();
  });

  test('후보 2개 미만이면 "다음" 버튼이 비활성화된다', async ({ page }) => {
    await page.goto('/solo/custom');

    // 기본 후보(카페, 영화) 2개 모두 삭제
    const removeButtons = page.locator('button', { hasText: '×' });
    await removeButtons.first().click();
    await removeButtons.first().click();

    await expect(page.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  test('후보 2개 이상이면 "다음" 버튼이 활성화된다', async ({ page }) => {
    await page.goto('/solo/custom');

    // 기본 후보 2개 있으므로 바로 확인
    await expect(page.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  test('중복 후보 입력 시 경고 메시지가 표시된다', async ({ page }) => {
    await page.goto('/solo/custom');

    // 이미 있는 "카페" 다시 입력
    await page.getByPlaceholder('후보 추가...').fill('카페');
    await page.getByRole('button', { name: '추가' }).click();

    await expect(page.getByText('이미 추가된 항목이에요!')).toBeVisible();
  });

  test('후보 추가 후 "다음" 클릭 시 /solo/location 으로 이동', async ({ page }) => {
    await page.goto('/solo/custom');

    // 기본 후보 2개 있으므로 바로 다음 클릭
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page).toHaveURL(/\/solo\/location/);
  });

  test('후보 삭제(×) 버튼 클릭 시 해당 항목이 사라진다', async ({ page }) => {
    await page.goto('/solo/custom');

    // 카페를 포함하는 후보 행을 찾아서 그 안의 × 버튼 클릭
    // CandidateEditor 내 카페 행: flex row with span.카페
    const cafeRow = page.locator('div').filter({ hasText: /^☕카페$/ });
    const removeBtn = cafeRow.getByRole('button');
    await removeBtn.click();

    await expect(page.locator('span').filter({ hasText: /^카페$/ })).not.toBeVisible();
  });

  test('최대 8개 후보 도달 시 입력 필드가 사라진다', async ({ page }) => {
    await page.goto('/solo/custom');

    // 추가 6개 (기본 2개 포함해서 총 8개)
    const labels = ['볼링', '노래방', '방탈출', '등산', '수영', '독서'];
    for (const label of labels) {
      await page.getByPlaceholder('후보 추가...').fill(label);
      await page.getByRole('button', { name: '추가' }).click();
    }

    // 최대 도달 시 입력 필드 숨김
    await expect(page.getByPlaceholder('후보 추가...')).not.toBeVisible();
    await expect(page.getByText('8/8')).toBeVisible();
  });
});
