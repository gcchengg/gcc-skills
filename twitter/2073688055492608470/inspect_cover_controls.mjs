import playwright from "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js";
const { chromium } = playwright;
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const page = browser.contexts()[0].pages()[0];
const controls = await page.evaluate(() => [...document.querySelectorAll("*")]
  .filter(el => ["更换封面", "拖拽或选择封面", "默认首图为封面", "从正文选择"].includes((el.innerText || "").trim()))
  .map(el => ({tag: el.tagName, text: (el.innerText || "").trim(), className: el.className, id: el.id, html: el.outerHTML.slice(0, 1000)})));
console.log(JSON.stringify(controls, null, 2));
