import { test, expect } from '@playwright/test';

/**
 * 시나리오 4: Solo 돌림판 게임 → 결과 화면
 * devTestMode를 활성화해 돌림판을 선택하고 결과 페이지까지 이동 확인
 */

test.describe('Solo 돌림판 게임 및 결과', () => {
  const CANDIDATES = [
    { label: '볼링', emoji: '🎳' },
    { label: '영화', emoji: '🎬' },
    { label: '카페', emoji: '☕' },
    { label: '노래방', emoji: '🎤' },
  ];

  // devTestMode 활성화 후 특정 gameType으로 random 페이지 진입
  async function gotoRandomWithTestMode(page: import('@playwright/test').Page) {
    await page.goto('/solo/random');
    await page.evaluate((candidates) => {
      sessionStorage.setItem('soloCandidates', JSON.stringify(candidates));
      // devTestMode는 raw string (FlowRandomPage에서 sessionStorage.getItem('devTestMode') === 'true' 비교)
      sessionStorage.setItem('devTestMode', 'true');
    }, CANDIDATES);
    await page.reload();
    // 게임 타입 선택 화면 대기
    await expect(page.getByText('게임 타입 선택')).toBeVisible({ timeout: 5000 });
  }

  test('/solo/random 에서 돌림판 게임 타입 선택 후 SPIN! 버튼이 보인다', async ({ page }) => {
    await gotoRandomWithTestMode(page);

    // 게임 타입 선택 화면에서 돌림판 선택
    await page.getByText('돌림판').click();

    // 돌림판 + SPIN! 버튼 확인
    await expect(page.getByTestId('btn-spin')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('btn-spin')).toHaveText('SPIN!');
  });

  test('SPIN! 버튼 클릭 시 버튼이 비활성화(...)로 바뀐다', async ({ page }) => {
    await gotoRandomWithTestMode(page);
    await page.getByText('돌림판').click();
    await expect(page.getByTestId('btn-spin')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-spin').click();

    // 스핀 중에는 버튼이 disabled
    await expect(page.getByTestId('btn-spin')).toBeDisabled();
  });

  test('결과 페이지에서 result-card 와 결과 활동이 표시된다', async ({ page }) => {
    // 결과 세션을 직접 주입해서 /solo/result 접근
    await page.goto('/solo/result');
    await page.evaluate((candidates) => {
      // session.set은 내부에서 JSON.stringify 하므로 동일하게 처리
      sessionStorage.setItem('activity', JSON.stringify(candidates[0]));
    }, CANDIDATES);
    // reload 없이 navigate로 세션 주입 후 바로 접근
    // useEffect에서 session.get으로 읽으므로 페이지가 마운트된 상태에서 재읽기 필요
    // 세션 주입 후 다시 goto로 페이지 재진입
    await page.goto('/solo/result');

    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('result-activity')).toBeVisible();
    await expect(page.getByText('볼링')).toBeVisible();
  });

  test('결과 페이지에서 "다시 돌리기" 버튼 클릭 시 /solo/random 으로 이동', async ({ page }) => {
    await page.goto('/solo/result');
    await page.evaluate((candidates) => {
      sessionStorage.setItem('activity', JSON.stringify(candidates[0]));
    }, CANDIDATES);
    await page.goto('/solo/result');

    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-retry').click();
    await expect(page).toHaveURL(/\/solo\/random/);
  });

  test('결과 페이지에서 "홈으로 돌아가기" 버튼 클릭 시 / 으로 이동', async ({ page }) => {
    await page.goto('/solo/result');
    await page.evaluate((candidates) => {
      sessionStorage.setItem('activity', JSON.stringify(candidates[0]));
    }, CANDIDATES);
    await page.goto('/solo/result');

    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('btn-home').click();
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('결과 페이지에서 activity 세션 없으면 fallback(/solo/setting)으로 리다이렉트', async ({ page }) => {
    // sessionStorage 비운 상태로 접근
    await page.goto('/solo/result');
    // activity 없으면 /solo/setting 으로 이동
    await expect(page).toHaveURL(/\/solo\/setting/, { timeout: 3000 });
  });

  test('결과 페이지에서 위치 있을 때 지도 버튼이 표시된다', async ({ page }) => {
    await page.goto('/solo/result');
    await page.evaluate((candidates) => {
      sessionStorage.setItem('activity', JSON.stringify(candidates[0]));
      // soloLocation은 raw string (null 아닌 경우 표시)
      sessionStorage.setItem('soloLocation', JSON.stringify('강남역'));
    }, CANDIDATES);
    await page.goto('/solo/result');

    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('btn-map-kakao')).toBeVisible();
    await expect(page.getByTestId('btn-map-naver')).toBeVisible();
  });

  test('결과 페이지에서 위치 없으면 지도 버튼이 표시되지 않는다', async ({ page }) => {
    await page.goto('/solo/result');
    await page.evaluate((candidates) => {
      sessionStorage.setItem('activity', JSON.stringify(candidates[0]));
      // soloLocation 없음
    }, CANDIDATES);
    await page.goto('/solo/result');

    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('btn-map-kakao')).not.toBeVisible();
    await expect(page.getByTestId('btn-map-naver')).not.toBeVisible();
  });
});
