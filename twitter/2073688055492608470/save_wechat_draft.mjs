import playwright from "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js";
const { chromium } = playwright;
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const page = browser.contexts()[0].pages()[0];
const save = page.getByRole("button", {name:"保存为草稿", exact:true});
const count = await save.count();
if (count !== 1) throw new Error(`“保存为草稿”按钮数量异常：${count}`);
await save.click();
await page.waitForTimeout(3500);
const state = await page.evaluate(() => ({
  url: location.href,
  notices: [...document.querySelectorAll('[role="alert"], .weui-desktop-toast, .weui-desktop-tips, .js_global_msg')].map(el => (el.innerText || "").trim()).filter(Boolean).slice(0,20),
  bodyTail: (document.body.innerText || "").slice(-1000)
}));
await page.screenshot({path:"/Users/apple/Documents/GitHub/gcc-skills/twitter/2073688055492608470/草稿保存结果.png", fullPage:false});
console.log(JSON.stringify(state, null, 2));
