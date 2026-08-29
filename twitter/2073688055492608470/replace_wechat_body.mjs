import fs from "node:fs/promises";
import path from "node:path";
import playwright from "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js";

const { chromium } = playwright;
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const page = browser.contexts()[0].pages()[0];

const closeButtons = page.locator("button.weui-desktop-dialog__close-btn:visible");
if (await closeButtons.count() > 0) await closeButtons.first().click();

const htmlPath = "/Users/apple/Documents/GitHub/gcc-skills/twitter/2073688055492608470/公众号发布稿_微信内联版.html";
let html = await fs.readFile(htmlPath, "utf8");
for (const match of [...html.matchAll(/src="([^"]+)"/g)]) {
  const src = match[1];
  if (/^(https?:|data:|blob:)/i.test(src)) continue;
  const abs = path.resolve(path.dirname(htmlPath), decodeURIComponent(src));
  const bytes = await fs.readFile(abs);
  const ext = path.extname(abs).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  html = html.replaceAll(`src="${src}"`, `src="data:${mime};base64,${bytes.toString("base64")}"`);
}

const result = await page.evaluate((content) => {
  const visible = el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 300 && rect.height > 300 && getComputedStyle(el).visibility !== "hidden";
  };
  const editor = [...document.querySelectorAll('[contenteditable="true"], [contenteditable="plaintext-only"]')]
    .filter(visible)
    .sort((a,b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];
  if (!editor) return {ok:false};
  editor.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editor);
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("insertHTML", false, content);
  editor.dispatchEvent(new InputEvent("input", {bubbles:true, inputType:"insertHTML", data:null}));
  const h2 = editor.querySelector("h2");
  return {ok:true, chars:(editor.innerText||"").length, h2Count:editor.querySelectorAll("h2").length, h3Count:editor.querySelectorAll("h3").length, h2Style:h2?.getAttribute("style")||"", images:editor.querySelectorAll("img").length};
}, html);
await page.waitForTimeout(2500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({path:"/Users/apple/Documents/GitHub/gcc-skills/twitter/2073688055492608470/新版排版编辑器预览.png", fullPage:false});
console.log(JSON.stringify(result, null, 2));
