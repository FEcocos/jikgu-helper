// 빌드된 확장을 실제 크롬(Playwright Chromium)에 설치하고 아마존 상품 페이지에 배지가 뜨는지 확인한다.
// 사용법: pnpm build && pnpm e2e [상품 URL] [스크린샷 폴더]
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'https://www.amazon.com/dp/B0D1XD1ZV3';
const outDir = resolve(process.argv[3] ?? '.output/e2e');
const extensionPath = resolve('.output/chrome-mv3');
mkdirSync(outDir, { recursive: true });

const context = await chromium.launchPersistentContext(join(tmpdir(), `jikgu-e2e-${Date.now()}`), {
  channel: 'chromium',
  headless: true,
  locale: 'en-US',
  viewport: { width: 1280, height: 900 },
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

try {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const extensionId = new URL(worker.url()).host;

  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const badge = page.locator('jikgu-badge .card');
  await badge.waitFor({ timeout: 30_000 });
  await page.locator('jikgu-badge .krw').waitFor({ timeout: 15_000 });
  console.log('배지 내용:\n' + (await badge.innerText()));
  await badge.scrollIntoViewIfNeeded();
  const box = await page.locator('jikgu-badge').boundingBox();
  await page.screenshot({
    path: join(outDir, 'badge.png'),
    clip: box ? { x: Math.max(box.x - 340, 0), y: Math.max(box.y - 140, 0), width: 900, height: box.height + 200 } : undefined,
  });

  // 사이즈·색상을 바꾼 것처럼 가격을 $149.99 로 바꾸면 배지가 면세로 바뀌어야 한다
  await page.evaluate(() => {
    const label = document.querySelector('#apex-pricetopay-accessibility-label');
    if (label) label.textContent = ' $149.99 ';
  });
  await page.locator('jikgu-badge .status.ok').waitFor({ timeout: 5_000 });
  console.log('가격 변경 후: ' + (await page.locator('jikgu-badge .status').innerText()));
  await page.locator('jikgu-badge').screenshot({ path: join(outDir, 'badge-duty-free.png') });

  const popup = await context.newPage();
  await popup.setViewportSize({ width: 340, height: 600 });
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.locator('.rates').waitFor({ timeout: 15_000 });
  await popup.screenshot({ path: join(outDir, 'popup.png'), fullPage: true });

  console.log(`스크린샷: ${outDir}`);
} finally {
  await context.close();
}
