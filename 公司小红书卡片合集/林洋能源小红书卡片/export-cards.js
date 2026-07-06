const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

const root = __dirname;
const htmlPath = path.join(root, 'index.html');
const outDir = path.join(root, 'png');

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const page = await browser.newPage({
    viewport: { width: 1242, height: 1660 },
    deviceScaleFactor: 1,
  });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready);

  for (let i = 1; i <= 9; i += 1) {
    const id = `card-${String(i).padStart(2, '0')}`;
    const el = await page.$(`#${id}`);
    if (!el) throw new Error(`Missing ${id}`);
    const output = path.join(outDir, `${String(i).padStart(2, '0')}.png`);
    await el.screenshot({ path: output });
    console.log(output);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
