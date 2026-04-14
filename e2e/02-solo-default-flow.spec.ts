import { test, expect } from '@playwright/test';

/**
 * 시나리오 2: Solo 기본 플로우 (인원 수 추천)
 * /solo/setting → "인원 수로 추천받기" → /solo/people → 인원 선택 → /solo/location → 건너뛰기 → /solo/random
 */

// session.set은 JSON.stringify를 사용하므로 세션 주입 시 동일하게 처리
function setSession(key: string, value: unknown) {
  return `sessionStorage.setItem(${JSON.stringify(key)}, JSON.stringify(${JSON.stringify(value)}))`;
}

test.describe('Solo 기본 플로우 (인원 추천)', () => {
  test('/solo/setting 에서 두 가지 모드 버튼이 렌더된다', async ({ page }) => {
    await page.goto('/solo/setting');

    await expect(page.getByTestId('btn-mode-default')).toBeVisible();
    await expect(page.getByTestId('btn-mode-custom')).toBeVisible();
    await expect(page.getByText('인원 수로 추천받기')).toBeVisible();
    await expect(page.getByText('직접 입력하기')).toBeVisible();
  });

  test('"인원 수로 추천받기" 클릭 시 /solo/people 이동', async ({ page }) => {
    await page.goto('/solo/setting');
    await page.getByTestId('btn-mode-default').click();
    await expect(page).toHaveURL(/\/solo\/people/);
  });

  test('/solo/people 에서 2~6명 버튼이 모두 보인다', async ({ page }) => {
    await page.goto('/solo/people');

    for (const count of [2, 3, 4, 5, 6]) {
      await expect(page.getByTestId(`btn-people-${count}`)).toBeVisible();
    }
  });

  test('4명 선택 후 /solo/location 으로 이동', async ({ page }) => {
    await page.goto('/solo/people');
    await page.getByTestId('btn-people-4').click();
    await expect(page).toHaveURL(/\/solo\/location/);
  });

  test('/solo/location 에서 건너뛰기 클릭 시 /solo/random 으로 이동', async ({ page }) => {
    // soloCandidates 세션 주입 (page.goto 이후 evaluate, reload 없이 세션 세팅 후 직접 goto)
    await page.goto('/solo/location');
    await page.evaluate(() => {
      sessionStorage.setItem('soloCandidates', JSON.stringify([
        { label: '볼링', emoji: '🎳' },
        { label: '영화', emoji: '🎬' },
        { label: '카페', emoji: '☕' },
      ]));
    });

    // 건너뛰기 버튼 클릭
    await page.getByRole('button', { name: '건너뛰기' }).click();
    await expect(page).toHaveURL(/\/solo\/random/);
  });

  test('/solo/location 에서 위치 입력 후 "다음" 클릭 시 /solo/random 으로 이동', async ({ page }) => {
    await page.goto('/solo/location');
    await page.evaluate(() => {
      sessionStorage.setItem('soloCandidates', JSON.stringify([
        { label: '볼링', emoji: '🎳' },
        { label: '영화', emoji: '🎬' },
      ]));
    });

    await page.getByPlaceholder('예: 강남역, 홍대, 서울 마포구...').fill('강남역');
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page).toHaveURL(/\/solo\/random/);
  });

  test('/solo/random 에서 후보 없으면 로딩 상태(⏳) 표시', async ({ page }) => {
    // sessionStorage 비운 상태로 접근
    await page.goto('/solo/random');
    // 후보 없으면 빈 로딩 표시
    await expect(page.getByText('⏳')).toBeVisible({ timeout: 3000 });
  });

  test('/solo/random 에서 devTestMode 설정 시 게임 타입 선택 화면이 나온다', async ({ page }) => {
    await page.goto('/solo/random');
    await page.evaluate(() => {
      sessionStorage.setItem('soloCandidates', JSON.stringify([
        { label: '볼링', emoji: '🎳' },
        { label: '영화', emoji: '🎬' },
        { label: '카페', emoji: '☕' },
      ]));
      // devTestMode는 session.set이 아닌 raw set 사용
      sessionStorage.setItem('devTestMode', 'true');
    });
    await page.reload();

    // 게임 타입 선택 화면 확인 (🧪 게임 타입 선택 텍스트)
    await expect(page.getByText('게임 타입 선택')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('돌림판')).toBeVisible();
    await expect(page.getByText('슬롯머신')).toBeVisible();
  });
});
