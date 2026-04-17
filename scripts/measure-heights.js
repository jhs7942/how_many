const { chromium } = require('playwright');

// Galaxy S25+ CSS 뷰포트 추정: 412×915 (DPR 3.0)
// Android 상태바 safe-top ~28px, 제스처 바 safe-bottom ~16px
const DEVICE = { name: 'Galaxy S25+', width: 412, height: 915, safeTop: 28, safeBottom: 16 };

const PAGES = [
  { path: '/', name: '홈(splash 후)' },
  { path: '/solo/setting', name: 'solo/setting' },
  { path: '/solo/people', name: 'solo/people' },
  { path: '/solo/custom', name: 'solo/custom' },
  { path: '/solo/location', name: 'solo/location' },
  { path: '/food/setting', name: 'food/setting' },
  { path: '/food/custom', name: 'food/custom' },
  { path: '/food/location', name: 'food/location' },
  { path: '/group/create', name: 'group/create' },
  { path: '/group/join', name: 'group/join' },
  { path: '/privacy', name: 'privacy' },
];

function formatRow(label, v) {
  return [
    label.padEnd(20),
    String(v.bodyH).padStart(6) + 'px',
    String(v.layoutH).padStart(6) + 'px',
    String(v.viewportH).padStart(4) + 'px',
    (v.bodyOverflow > 0 ? '+' : '') + v.bodyOverflow + 'px ' + (v.bodyOverflow > 2 ? '⚠️' : '✅'),
  ].join(' | ');
}

(async () => {
  const browser = await chromium.launch();

  for (const sim of [
    { label: 'safe-area 없음(브라우저 시뮬)', safeTop: 0, safeBottom: 0 },
    { label: `safe-area 실제(상${DEVICE.safeTop}·하${DEVICE.safeBottom})`, safeTop: DEVICE.safeTop, safeBottom: DEVICE.safeBottom },
  ]) {
    console.log(`\n═══ ${DEVICE.name} ${DEVICE.width}×${DEVICE.height} | ${sim.label} ═══`);
    console.log('페이지'.padEnd(20) + ' | body높이 | layout | viewH | overflow');
    console.log('-'.repeat(78));

    const context = await browser.newContext({
      viewport: { width: DEVICE.width, height: DEVICE.height },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    for (const p of PAGES) {
      try {
        await page.goto('http://localhost:3000' + p.path, { waitUntil: 'networkidle', timeout: 10000 });

        // splashSeen 설정하고 홈 재로딩 (splash 후 실제 메인 화면 측정)
        if (p.path === '/') {
          await page.evaluate(() => sessionStorage.setItem('splashSeen', '1'));
          await page.reload({ waitUntil: 'networkidle' });
        }

        // safe-area CSS 변수 override는 매 페이지 로드 후 DOM에 주입
        // (env()는 Playwright headless에서 항상 0이라 var(--safe-*) 경로를 override)
        await page.addStyleTag({
          content: `
            :root {
              --safe-top: ${sim.safeTop}px !important;
              --safe-bottom: ${sim.safeBottom}px !important;
            }
          `,
        });
        await page.waitForTimeout(300);

        const m = await page.evaluate(() => {
          const layout = document.querySelector('body > *') || document.body.firstElementChild;
          return {
            bodyH: Math.round(document.body.getBoundingClientRect().height),
            scrollH: document.documentElement.scrollHeight,
            layoutH: layout ? Math.round(layout.getBoundingClientRect().height) : 0,
            viewportH: window.innerHeight,
          };
        });
        m.bodyOverflow = m.scrollH - m.viewportH;
        console.log(formatRow(p.name, m));
      } catch (e) {
        console.log(p.name.padEnd(20) + ' | ERROR: ' + String(e.message).slice(0, 60));
      }
    }
    await context.close();
  }

  await browser.close();
})();
