import { test, expect } from '@playwright/test';

/**
 * 시나리오 10: 반응형 레이아웃 및 콘솔 에러 검사
 * - 모바일(430px) / 데스크톱(1280px) 해상도에서 레이아웃 확인
 * - 주요 페이지 콘솔 에러 없음 확인
 */

const PAGES_TO_CHECK = [
  { path: '/', name: '홈' },
  { path: '/solo/setting', name: 'Solo 설정' },
  { path: '/solo/people', name: 'Solo 인원 선택' },
  { path: '/solo/custom', name: 'Solo 직접 입력' },
  { path: '/solo/location', name: 'Solo 위치 입력' },
  { path: '/food/setting', name: '맛집 설정' },
  { path: '/food/custom', name: '맛집 직접 입력' },
  { path: '/food/location', name: '맛집 위치 입력' },
  { path: '/group/setting', name: '그룹 설정' },
  { path: '/group/create', name: '그룹 방 만들기' },
  { path: '/group/join', name: '그룹 참여하기' },
];

test.describe('반응형 레이아웃 - 모바일 (430px)', () => {
  test.use({ viewport: { width: 430, height: 932 } });

  for (const { path, name } of PAGES_TO_CHECK) {
    test(`${name} 페이지가 모바일(430px)에서 가로 스크롤 없이 렌더된다`, async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
      await page.goto(path);

      // 수평 스크롤 없음 확인 (scrollWidth <= clientWidth)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll, `${path} 페이지에서 가로 스크롤 발생`).toBe(false);
    });
  }
});

test.describe('반응형 레이아웃 - 데스크톱 (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const { path, name } of PAGES_TO_CHECK) {
    test(`${name} 페이지가 데스크톱(1280px)에서 렌더된다`, async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
      await page.goto(path);

      // 페이지가 정상 로드됐는지 (body 존재)
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('콘솔 에러 검사', () => {
  for (const { path, name } of PAGES_TO_CHECK) {
    test(`${name} 페이지 콘솔 에러 없음`, async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          // Next.js hydration 관련 일부 경고는 무시 (외부 라이브러리 이슈)
          const text = msg.text();
          if (
            text.includes('Warning:') ||
            text.includes('Download the React DevTools') ||
            text.includes('net::ERR_') // 네트워크 요청 실패는 별도 시나리오
          ) {
            return;
          }
          errors.push(text);
        }
      });

      await page.goto('/');
      await page.evaluate(() => sessionStorage.setItem('splashSeen', 'true'));
      await page.goto(path);

      // 페이지 완전 로드 대기
      await page.waitForLoadState('domcontentloaded');

      expect(errors, `${path} 페이지 콘솔 에러: ${errors.join(', ')}`).toHaveLength(0);
    });
  }
});
