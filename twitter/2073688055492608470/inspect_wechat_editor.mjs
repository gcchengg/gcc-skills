import playwright from "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js";
import path from "node:path";

const { chromium } = playwright;
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const page = browser.contexts()[0].pages()[0];
const state = await page.evaluate(() => ({
  url: location.href,
  titleValue: document.querySelector("#title")?.value || [...document.querySelectorAll('[contenteditable="true"]')].find(el => el.getAttribute("data-placeholder")?.includes("标题"))?.innerText || "",
  bodyChars: [...document.querySelectorAll('[contenteditable="true"]')].map(el => (el.innerText || "").length).sort((a,b)=>b-a)[0] || 0,
  digest: document.querySelector('textarea[placeholder*="摘要"]')?.value || "",
  files: [...document.querySelectorAll('input[type="file"]')].map((el, index) => ({index, accept: el.accept, multiple: el.multiple, id: el.id, name: el.name, className: el.className})),
  texts: [...document.querySelectorAll("button,a,label,span")].map(el => (el.innerText || "").trim()).filter(text => /封面|保存为草稿|保存草稿|从图片库选择|上传/.test(text)).slice(0,40)
}));
await page.screenshot({path: path.resolve("/Users/apple/Documents/GitHub/gcc-skills/twitter/2073688055492608470/编辑器填充预览.png"), fullPage: false});
console.log(JSON.stringify(state, null, 2));
