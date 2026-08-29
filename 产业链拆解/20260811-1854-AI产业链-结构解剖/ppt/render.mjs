import { chromium } from '../../../tools/browser-publisher/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(here, 'index.html');
const out = path.join(here, '..', 'slides');
const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
await page.evaluate(async () => document.fonts.ready);
for (let i = 1; i <= 10; i++) {
  const slide = page.locator(`#slide-${i}`);
  await slide.screenshot({ path: path.join(out, `${String(i).padStart(2, '0')}-${['封面','认知反转','产业链全景','价值起点','上游底座','能力生产','能力分发','三流合一','议价权与瓶颈','结论'][i-1]}.png`) });
}
await browser.close();
