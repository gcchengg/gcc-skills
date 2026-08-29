import playwright from "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js";

const { chromium } = playwright;
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const page = browser.contexts()[0].pages()[0];

const coverArea = page.locator("#js_cover_area:visible .js_cover_btn_area:visible");
if (await coverArea.count() !== 1) throw new Error(`封面区域数量异常：${await coverArea.count()}`);
await coverArea.click();
const choose = page.locator("#js_cover_area a.js_selectCoverFromContent:visible");
if (await choose.count() !== 1) throw new Error(`可见“从正文选择”数量异常：${await choose.count()}`);
await choose.click();
await page.waitForTimeout(1800);
await page.screenshot({path: "/Users/apple/Documents/GitHub/gcc-skills/twitter/2073688055492608470/从正文选封面状态.png", fullPage: false});
console.log((await page.locator("body").innerText()).slice(-2400));
