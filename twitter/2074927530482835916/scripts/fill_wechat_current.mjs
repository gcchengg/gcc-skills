import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const htmlPath = path.join(root, "公众号发布稿_浏览器版.wechat.html");
const coverPath = path.join(root, "assets/公众号封面.png");
const screenshotPath = path.join(root, "wechat_filled_current.png");

const title = "AI 可以写代码，但工程师必须拥有“外循环”";
const author = "郭春成";
const digest = "当智能体可以调查问题、修改代码、跑测试、提交结果时，工程师到底还负责什么？";

async function loadPlaywright() {
  const localPath = "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js";
  const module = await import(pathToFileURL(localPath).href);
  return module.default || module;
}

async function inlineLocalImages(html) {
  const baseDir = path.dirname(htmlPath);
  let result = html;
  for (const match of html.matchAll(/src="([^"]+)"/g)) {
    const src = match[1];
    if (/^(https?:|data:|blob:)/i.test(src)) continue;
    const abs = path.resolve(baseDir, decodeURIComponent(src));
    const bytes = await fs.readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
    result = result.replaceAll(`src="${src}"`, `src="data:${mime};base64,${bytes.toString("base64")}"`);
  }
  return result;
}

async function main() {
  const html = await inlineLocalImages(await fs.readFile(htmlPath, "utf8"));
  const { chromium } = await loadPlaywright();
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const page = browser
    .contexts()
    .flatMap((context) => context.pages())
    .find((candidate) => candidate.url().includes("appmsg_edit_v2"))
    || browser
      .contexts()
      .flatMap((context) => context.pages())
      .find((candidate) => candidate.url().includes("appmsgid=") && candidate.url().includes("appmsg"));

  if (!page) throw new Error("No WeChat article editor tab found");
  await page.bringToFront();
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(1000);

  await page.locator("div.ProseMirror").nth(0).click();
  await page.keyboard.press("Meta+A");
  await page.keyboard.type(title);

  await page.locator("#author").fill(author);

  await page.locator("div.ProseMirror").nth(1).click();
  await page.evaluate((content) => {
    const bodyEditor = [...document.querySelectorAll("div.ProseMirror")]
      .find((el) => !el.getAttribute("data-placeholder")?.includes("标题") && el.getBoundingClientRect().height > 100);
    if (!bodyEditor) throw new Error("Body editor not found");
    bodyEditor.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(bodyEditor);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("insertHTML", false, content);
    bodyEditor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertHTML", data: null }));
  }, html);

  await page.locator("#js_description").fill(digest);

  // Try to expose cover menu; cover selection may still need manual confirmation in the WeChat UI.
  await page.locator("#js_cover_area").click().catch(() => {});
  await page.waitForTimeout(1000);

  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Filled editor tab: ${page.url()}`);
  console.log(`Screenshot: ${screenshotPath}`);
  console.log(`Cover prepared locally: ${coverPath}`);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
