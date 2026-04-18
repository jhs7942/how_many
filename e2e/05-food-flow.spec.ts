import { test, expect } from '@playwright/test';

/**
 * 시나리오 5: 맛집 결정 플로우
 * /food/setting → "추천 메뉴로 뽑기" → /food/location → /food/random → /food/result
 * /food/setting → "직접 입력하기" → /food/custom → /food/location
 *
 * UrlNormalizer가 URL을 '/'로 강제 변경하므로 toHaveURL 대신 DOM 요소 기반으로 페이지 전환 검증
 */

test.describe('맛집 결정 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
  });

  test('/food/setting 에서 두 가지 모드 버튼이 렌더된다', async ({ page }) => {
    await page.goto('/food/setting');

    await expect(page.getByTestId('btn-mode-default')).toBeVisible();
    await expect(page.getByTestId('btn-mode-custom')).toBeVisible();
    await expect(page.getByText('추천 메뉴로 뽑기')).toBeVisible();
    await expect(page.getByText('직접 입력하기')).toBeVisible();
  });

  test('"추천 메뉴로 뽑기" 클릭 시 foodCandidates 세션 설정 후 /food/location 으로 이동', async ({ page }) => {
    await page.goto('/food/setting');
    await page.getByTestId('btn-mode-default').click();
    // UrlNormalizer가 URL을 '/'로 고정 → /food/location 도착 시 "어디서 하실 건가요?" 텍스트로 확인
    await expect(page.getByText('어디서 하실 건가요?')).toBeVisible({ timeout: 5000 });

    // foodCandidates 세션이 설정됐는지 확인
    const foodCandidates = await page.evaluate(() => sessionStorage.getItem('foodCandidates'));
    expect(foodCandidates).not.toBeNull();
    const parsed = JSON.parse(foodCandidates!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  test('"직접 입력하기" 클릭 시 /food/custom 으로 이동', async ({ page }) => {
    await page.goto('/food/setting');
    await page.getByTestId('btn-mode-custom').click();
    // UrlNormalizer가 URL을 '/'로 고정 → /food/custom 도착 시 프리셋 타이틀로 확인
    await expect(page.getByText('음식 카테고리 빠른 선택')).toBeVisible({ timeout: 5000 });
  });

  test('/food/custom 에서 음식 카테고리 프리셋이 표시된다', async ({ page }) => {
    await page.goto('/food/custom');

    // "음식 카테고리 빠른 선택" 제목 확인
    await expect(page.getByText('음식 카테고리 빠른 선택')).toBeVisible();
    // 기본 음식 카테고리 중 몇 개 확인
    await expect(page.getByText('한식')).toBeVisible();
    await expect(page.getByText('중식')).toBeVisible();
  });

  test('/food/custom 에서 빈 상태에서 후보 2개 추가 후 "다음" 활성화', async ({ page }) => {
    await page.goto('/food/custom');

    // /food/custom 은 defaultCandidates=[] 이므로 초기 후보 없음
    // 후보 2개 입력
    await page.getByPlaceholder('후보 추가...').fill('파스타');
    await page.getByRole('button', { name: '추가' }).click();
    await page.getByPlaceholder('후보 추가...').fill('초밥');
    await page.getByRole('button', { name: '추가' }).click();

    await expect(page.getByRole('button', { name: '다음' })).toBeEnabled();
    await page.getByRole('button', { name: '다음' }).click();
    // UrlNormalizer가 URL을 '/'로 고정 → /food/location 도착 시 DOM으로 확인
    await expect(page.getByText('어디서 하실 건가요?')).toBeVisible({ timeout: 5000 });
  });

  test('/food/location 에서 건너뛰기 시 /food/random 으로 이동', async ({ page }) => {
    // addInitScript로 페이지 로드 전 세션 주입 (goto 후 evaluate + reload는 UrlNormalizer 경쟁 조건 발생)
    await page.addInitScript(() => {
      sessionStorage.setItem('foodCandidates', JSON.stringify([
        { label: '한식', emoji: '🍚' },
        { label: '중식', emoji: '🥟' },
      ]));
    });
    await page.goto('/food/location');

    await page.getByRole('button', { name: '건너뛰기' }).click();
    // UrlNormalizer가 URL을 '/'로 고정 → /food/random 도착 시
    // location 화면의 "건너뛰기" 버튼이 사라지면 페이지 전환 성공으로 간주
    await expect(page.getByRole('button', { name: '건너뛰기' })).not.toBeVisible({ timeout: 8000 });
  });

  test('/food/result 에서 오늘의 맛집 결과 카드가 표시된다', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('foodActivity', JSON.stringify({ label: '한식', emoji: '🍚' }));
    });
    await page.goto('/food/result');

    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('오늘의 맛집')).toBeVisible();
    await expect(page.getByTestId('result-activity')).toHaveText('한식');
  });

  test('/food/result 에서 "세부 메뉴 뽑기" 버튼이 표시된다', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('foodActivity', JSON.stringify({ label: '한식', emoji: '🍚' }));
    });
    await page.goto('/food/result');

    await expect(page.getByTestId('btn-detail')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('세부 메뉴 뽑기')).toBeVisible();
  });

  test('/food/result 에서 "세부 메뉴 뽑기" 클릭 시 /food/detail/random 으로 이동', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('foodActivity', JSON.stringify({ label: '한식', emoji: '🍚' }));
    });
    await page.goto('/food/result');

    await expect(page.getByTestId('btn-detail')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-detail').click();
    // UrlNormalizer가 URL을 '/'로 고정 → btn-detail이 사라지면 페이지 전환 성공으로 간주
    // /food/detail/random 페이지는 foodActivity 세션이 없으면 candidates가 없어 ⏳ 로딩 상태
    await expect(page.getByTestId('btn-detail')).not.toBeVisible({ timeout: 8000 });
  });

  test('/food/result 에서 activity 없으면 /food/setting 으로 리다이렉트', async ({ page }) => {
    await page.goto('/food/result');
    // UrlNormalizer가 URL을 '/'로 고정 → /food/setting 도착 시 btn-mode-default 확인
    await expect(page.getByTestId('btn-mode-default')).toBeVisible({ timeout: 5000 });
  });
});
