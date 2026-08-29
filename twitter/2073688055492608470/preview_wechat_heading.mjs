import playwright from "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js";
const { chromium } = playwright;
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const page = browser.contexts()[0].pages()[0];
const h2 = page.locator('[contenteditable="true"] h2').first();
await h2.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({path:"/Users/apple/Documents/GitHub/gcc-skills/twitter/2073688055492608470/章节标题预览.png", fullPage:false});
console.log(await h2.innerText());
