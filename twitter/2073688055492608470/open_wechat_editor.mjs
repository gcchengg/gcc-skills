import playwright from "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js";

const { chromium } = playwright;

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = browser.contexts()[0];
const page = context.pages()[0];
const token = new URL(page.url()).searchParams.get("token");
if (!token) throw new Error("公众号登录页没有可用 token");
const editorUrl = `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token=${token}&lang=zh_CN`;
await page.goto(editorUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
console.log(page.url());
