import playwright from "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js";

const { chromium } = playwright;
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const page = browser.contexts()[0].pages()[0];
const inputs = page.locator('input[type="file"]');
const count = await inputs.count();
if (count !== 1) throw new Error(`封面文件控件数量异常：${count}`);
await inputs.setInputFiles("/Users/apple/Documents/GitHub/gcc-skills/twitter/2073688055492608470/assets/公众号封面.png");
await page.waitForTimeout(3500);
await page.screenshot({path: "/Users/apple/Documents/GitHub/gcc-skills/twitter/2073688055492608470/封面上传状态.png", fullPage: false});
console.log(JSON.stringify({url: page.url(), dialogs: await page.locator('[role="dialog"], .weui-desktop-dialog, .weui-desktop-dialog__wrp').count(), bodyText: (await page.locator("body").innerText()).slice(-1800)}, null, 2));
