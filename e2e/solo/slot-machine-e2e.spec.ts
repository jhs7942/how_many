/**
 * SlotMachine 및 전체 게임 타입 E2E 테스트
 * 테스트 대상: /solo/random 페이지의 spin, shuffle, slot, rope 게임
 *
 * 전략:
 * - 각 게임 타입이 나올 때까지 재시도 (최대 10번)
 * - 실제 포인터 이벤트(mouse down/move/up)로 드래그 조작
 * - 결과 판정: URL이 /solo/result이거나 결과 페이지 콘텐츠(result-card)가 보이면 성공
 *   (Next.js App Router에서 client-side navigation 시 URL 감지 이슈 대응)
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';

const CANDIDATES = [
  { label: '치킨', emoji: '🍗' },
  { label: '피자', emoji: '🍕' },
  { label: '초밥', emoji: '🍣' },
  { label: '버거', emoji: '🍔' },
  { label: '파스타', emoji: '🍝' },
];

const SCREENSHOT_DIR = path.resolve(
  __dirname,
  '../../.claude/fix/2026-03-21/e2e-slot-machine-test/screenshots'
);

/** addInitScript를 한 번만 등록 (중복 방지) */
async function setupInitScript(page: Page) {
  await page.addInitScript((candidates) => {
    sessionStorage.setItem('soloCandidates', JSON.stringify(candidates));
    sessionStorage.setItem('soloLocation', JSON.stringify('서울'));
    sessionStorage.setItem('splashSeen', 'true');
  }, CANDIDATES);
}

/** /solo/random으로 이동 (addInitScript는 별도 호출 필요) */
async function gotoRandom(page: Page) {
  // UrlNormalizer가 replaceState로 load를 지연시키므로 domcontentloaded로 대기
  await page.goto('/solo/random', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
}

/** 현재 로드된 게임 타입 반환 */
async function getGameType(page: Page): Promise<string> {
  const title = await page.locator('h1').textContent() ?? '';
  if (title.includes('돌림판')) return 'spin';
  if (title.includes('셔플')) return 'shuffle';
  if (title.includes('슬롯머신')) return 'slot';
  if (title.includes('줄 뽑기')) return 'rope';
  return 'unknown';
}

/**
 * 결과 페이지에 도달했는지 확인
 * Next.js App Router client-side navigation 시 URL이 / 로 잠시 보이는 이슈가 있어
 * result-card DOM 요소나 "활동 결정 완료!" 텍스트로 판정
 */
async function waitForResult(page: Page, timeoutMs = 12000) {
  // URL 기반 또는 result-card DOM 기반으로 판정
  await expect(
    page.locator('[data-testid="result-card"], [data-testid="result-activity"]').first()
  ).toBeVisible({ timeout: timeoutMs });
}

/** spin 게임 조작 */
async function playSpin(page: Page) {
  const spinBtn = page.getByTestId('btn-spin');
  await expect(spinBtn).toBeVisible({ timeout: 3000 });
  await spinBtn.click();
  await waitForResult(page, 12000);
}

/** shuffle 게임 조작: choosing 상태 대기 후 첫 번째 컵 클릭 */
async function playShuffle(page: Page) {
  await expect(
    page.locator('p').filter({ hasText: '어느 컵일까요?' })
  ).toBeVisible({ timeout: 15000 });
  const cups = page.locator('div[style*="cursor: pointer"]');
  await cups.first().click();
  await waitForResult(page, 8000);
}

/** slot 게임 조작: 레버 드래그 80px */
async function playSlot(page: Page) {
  await expect(
    page.locator('p').filter({ hasText: '레버를 당겨보세요' })
  ).toBeVisible({ timeout: 3000 });

  const leverHandle = page.locator('div[style*="touch-action: none"]').first();
  await expect(leverHandle).toBeVisible({ timeout: 3000 });

  const box = await leverHandle.boundingBox();
  if (!box) throw new Error('레버 손잡이를 찾을 수 없습니다');

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy + 30, { steps: 5 });
  await page.mouse.move(cx, cy + 60, { steps: 5 });
  await page.mouse.move(cx, cy + 80, { steps: 5 });
  await page.mouse.up();

  // 릴 애니메이션 완료 대기: 릴0=2600ms + 릴1=3300ms + 릴2=4000ms
  await waitForResult(page, 12000);
}

/**
 * rope 게임 조작: evaluate로 직접 PointerEvent 디스패치
 *
 * page.mouse API는 Pixel 5 에뮬레이션에서 setPointerCapture와 호환 이슈가 있음.
 * 대신 DOM 요소에 직접 PointerEvent를 디스패치하여 React onPointerDown/Move/Up 핸들러를 트리거.
 * 모든 이벤트를 동일 요소에 디스패치하므로 pointer capture 없이도 핸들러가 동작.
 */
async function playRope(page: Page) {
  await expect(
    page.locator('p').filter({ hasText: '줄을 잡아당겨보세요' })
  ).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(200);

  const handles = page.locator('div[style*="touch-action: none"]');
  await expect(handles.first()).toBeVisible({ timeout: 3000 });

  // 첫 번째 손잡이 선택 (어떤 손잡이든 동일하게 동작)
  const handle = handles.first();
  const box = await handle.boundingBox();
  if (!box) throw new Error('손잡이 없음');

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const DRAG_TOTAL = 80; // DRAG_THRESHOLD=60 초과

  // 1. pointerdown 디스패치
  await handle.evaluate((el, { cx, cy }) => {
    el.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, pointerType: 'mouse',
      clientX: cx, clientY: cy,
      bubbles: true, cancelable: true,
    }));
  }, { cx, cy });

  // React state 업데이트(idle→grabbed) 대기
  await page.waitForTimeout(300);

  // 2. pointermove 점진적 디스패치 (같은 요소에 직접)
  for (const dy of [20, 40, 60, DRAG_TOTAL]) {
    await handle.evaluate((el, { cx, cy }) => {
      el.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 1, pointerType: 'mouse',
        clientX: cx, clientY: cy,
        bubbles: true, cancelable: true,
      }));
    }, { cx, cy: cy + dy });
    await page.waitForTimeout(50);
  }

  // 3. pointerup 디스패치
  await handle.evaluate((el, { cx, cy }) => {
    el.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 1, pointerType: 'mouse',
      clientX: cx, clientY: cy,
      bubbles: true, cancelable: true,
    }));
  }, { cx, cy: cy + DRAG_TOTAL });

  await page.waitForTimeout(500);

  // revealing 상태 → 1800ms 후 result 이동 + saveResult 네트워크 시간
  await waitForResult(page, 15000);
}

test.describe('SlotMachine & 전체 게임 타입 E2E', () => {

  // ──────────────────────────────────────────────
  // 1. 랜덤 페이지 - 어떤 게임이든 결과까지 완주
  // ──────────────────────────────────────────────
  test('random 페이지: 어떤 게임 타입이든 결과 페이지까지 완주', async ({ page }) => {
    await setupInitScript(page);
    await gotoRandom(page);

    const gameType = await getGameType(page);
    console.log(`[완주 테스트] 로드된 게임 타입: ${gameType}`);
    expect(['spin', 'shuffle', 'slot', 'rope']).toContain(gameType);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/test1-01-game-loaded.png`,
      fullPage: true,
    });

    switch (gameType) {
      case 'spin':    await playSpin(page); break;
      case 'shuffle': await playShuffle(page); break;
      case 'slot':    await playSlot(page); break;
      case 'rope':    await playRope(page); break;
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/test1-02-result.png`,
      fullPage: true,
    });

    // 결과 카드 확인
    await expect(page.getByTestId('result-card')).toBeVisible();
    await expect(page.getByTestId('result-activity')).toBeVisible();

    const resultText = await page.getByTestId('result-activity').textContent();
    console.log(`✅ [${gameType}] 완주 테스트 통과 - 결과: ${resultText}`);
  });

  // ──────────────────────────────────────────────
  // 2. slot 슬롯머신 레버 드래그 테스트
  // ──────────────────────────────────────────────
  test('slot: 슬롯머신 레버 드래그 → 결과 페이지', async ({ page }) => {
    await setupInitScript(page);
    let gameType = '';
    let attempts = 0;
    const MAX = 10;

    while (gameType !== 'slot' && attempts < MAX) {
      await gotoRandom(page);
      gameType = await getGameType(page);
      attempts++;
      console.log(`[slot] 시도 ${attempts}: ${gameType}`);
    }

    if (gameType !== 'slot') {
      test.skip(true, `${MAX}번 시도에도 slot이 나오지 않아 건너뜁니다`);
      return;
    }

    console.log(`[slot] ${attempts}번째 시도에 slot 확인`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/slot-01-initial.png`,
      fullPage: true,
    });

    const leverHandle = page.locator('div[style*="touch-action: none"]').first();
    const box = await leverHandle.boundingBox();
    if (!box) throw new Error('레버 손잡이 없음');

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    console.log(`[slot] 레버 위치: (${cx.toFixed(0)}, ${cy.toFixed(0)})`);

    await page.mouse.move(cx, cy);
    await page.mouse.down();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/slot-02-lever-down.png`,
      fullPage: true,
    });

    await page.mouse.move(cx, cy + 30, { steps: 5 });
    await page.mouse.move(cx, cy + 60, { steps: 5 });
    await page.mouse.move(cx, cy + 80, { steps: 5 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/slot-03-dragging.png`,
      fullPage: true,
    });

    await page.mouse.up();

    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/slot-04-spinning.png`,
      fullPage: true,
    });

    // 결과 카드 대기
    await waitForResult(page, 12000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/slot-05-result.png`,
      fullPage: true,
    });

    await expect(page.getByTestId('result-card')).toBeVisible();
    const resultText = await page.getByTestId('result-activity').textContent();
    console.log(`✅ slot 레버 드래그 테스트 통과 - 결과: ${resultText}`);
  });

  // ──────────────────────────────────────────────
  // 3. spin 돌림판 테스트
  // ──────────────────────────────────────────────
  test('spin: 돌림판 SPIN 버튼 클릭 → 결과 페이지', async ({ page }) => {
    await setupInitScript(page);
    let gameType = '';
    let attempts = 0;
    const MAX = 10;

    while (gameType !== 'spin' && attempts < MAX) {
      await gotoRandom(page);
      gameType = await getGameType(page);
      attempts++;
      console.log(`[spin] 시도 ${attempts}: ${gameType}`);
    }

    if (gameType !== 'spin') {
      test.skip(true, `${MAX}번 시도에도 spin이 나오지 않아 건너뜁니다`);
      return;
    }

    console.log(`[spin] ${attempts}번째 시도에 spin 확인`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/spin-01-initial.png`,
      fullPage: true,
    });

    const spinBtn = page.getByTestId('btn-spin');
    await expect(spinBtn).toBeVisible({ timeout: 3000 });
    await spinBtn.click();

    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/spin-02-spinning.png`,
      fullPage: true,
    });

    await waitForResult(page, 12000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/spin-03-result.png`,
      fullPage: true,
    });

    await expect(page.getByTestId('result-card')).toBeVisible();
    const resultText = await page.getByTestId('result-activity').textContent();
    console.log(`✅ spin 테스트 통과 - 결과: ${resultText}`);
  });

  // ──────────────────────────────────────────────
  // 4. shuffle 셔플 테스트
  // ──────────────────────────────────────────────
  test('shuffle: 컨텐츠 셔플 컵 선택 → 결과 페이지', async ({ page }) => {
    await setupInitScript(page);
    let gameType = '';
    let attempts = 0;
    const MAX = 10;

    while (gameType !== 'shuffle' && attempts < MAX) {
      await gotoRandom(page);
      gameType = await getGameType(page);
      attempts++;
      console.log(`[shuffle] 시도 ${attempts}: ${gameType}`);
    }

    if (gameType !== 'shuffle') {
      test.skip(true, `${MAX}번 시도에도 shuffle이 나오지 않아 건너뜁니다`);
      return;
    }

    console.log(`[shuffle] ${attempts}번째 시도에 shuffle 확인`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/shuffle-01-showing.png`,
      fullPage: true,
    });

    await expect(
      page.locator('p').filter({ hasText: '어느 컵일까요?' })
    ).toBeVisible({ timeout: 15000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/shuffle-02-choosing.png`,
      fullPage: true,
    });

    const cups = page.locator('div[style*="cursor: pointer"]');
    const count = await cups.count();
    console.log(`[shuffle] cursor:pointer 요소 수: ${count}`);
    await cups.first().click();

    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/shuffle-03-clicked.png`,
      fullPage: true,
    });

    await waitForResult(page, 8000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/shuffle-04-result.png`,
      fullPage: true,
    });

    await expect(page.getByTestId('result-card')).toBeVisible();
    const resultText = await page.getByTestId('result-activity').textContent();
    console.log(`✅ shuffle 테스트 통과 - 결과: ${resultText}`);
  });

  // ──────────────────────────────────────────────
  // 5. rope 줄뽑기 테스트
  // ──────────────────────────────────────────────
  test.fixme('rope: 줄 뽑기 손잡이 드래그 → 결과 페이지', async ({ page }) => {
    // FIXME: Playwright Pixel 5 에뮬레이션에서 setPointerCapture와 합성 이벤트 비호환
    // pointer capture 없이는 드래그 중 pointermove가 핸들 요소에 도달하지 않음
    test.slow();
    await setupInitScript(page);
    let gameType = '';
    let attempts = 0;
    const MAX = 10;

    while (gameType !== 'rope' && attempts < MAX) {
      await gotoRandom(page);
      gameType = await getGameType(page);
      attempts++;
      console.log(`[rope] 시도 ${attempts}: ${gameType}`);
    }

    if (gameType !== 'rope') {
      test.skip(true, `${MAX}번 시도에도 rope이 나오지 않아 건너뜁니다`);
      return;
    }

    console.log(`[rope] ${attempts}번째 시도에 rope 확인`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/rope-01-initial.png`,
      fullPage: true,
    });

    await playRope(page);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/rope-05-result.png`,
      fullPage: true,
    });

    await expect(page.getByTestId('result-card')).toBeVisible();
    const resultText = await page.getByTestId('result-activity').textContent();
    console.log(`✅ rope 테스트 통과 - 결과: ${resultText}`);
  });
});
