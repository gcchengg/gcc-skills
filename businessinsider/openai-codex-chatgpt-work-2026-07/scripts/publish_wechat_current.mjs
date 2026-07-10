import playwright from "../../../tools/browser-publisher/node_modules/playwright/index.js";
import fs from "node:fs/promises";

const { chromium } = playwright;

const cdp = "http://127.0.0.1:9222";
const title = "Codex 进入 ChatGPT App：OpenAI 想把聊天框变成工作台";
const author = "郭春成";
const digest = "如果 Codex、Work 模式和 GPT-5.6 系列同时进入 ChatGPT，重点就不是多一个代码助手，而是 ChatGPT 的产品边界正在从聊天工具扩展成办公操作系统。";
const htmlPath = "/Users/apple/Documents/GitHub/gcc-skills/businessinsider/openai-codex-chatgpt-work-2026-07/公众号发布稿_浏览器版.wechat.html";
const screenshotBase = "/Users/apple/Documents/GitHub/gcc-skills/businessinsider/openai-codex-chatgpt-work-2026-07";

function extractToken(url) {
  const match = url.match(/[?&]token=(\d+)/);
  return match?.[1] || null;
}

async function clickText(page, text, exact = true, timeout = 8000) {
  const locator = page.getByText(text, { exact });
  await locator.last().click({ timeout });
}

async function main() {
  const html = await fs.readFile(htmlPath, "utf8");
  const browser = await chromium.connectOverCDP(cdp);
  const context = browser.contexts()[0];
  const pages = context.pages();
  const token = pages.map((p) => extractToken(p.url())).find(Boolean);
  if (!token) throw new Error("No WeChat backend token found in current browser pages.");

  const page = await context.newPage();
  const editorUrl = `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=10&token=${token}&lang=zh_CN`;
  await page.goto(editorUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.bringToFront();

  const editors = page.locator(".ProseMirror");
  await editors.nth(0).click({ timeout: 15000 });
  await page.keyboard.press("Meta+A");
  await page.keyboard.type(title);

  await page.locator("#author").evaluate((el, value) => {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, author).catch(() => {});

  await editors.nth(1).click({ timeout: 15000 });
  await page.keyboard.press("Meta+A");
  await page.keyboard.press("Backspace");
  await page.evaluate(async (content) => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([content], { type: "text/html" }),
        "text/plain": new Blob([content.replace(/<[^>]+>/g, "\\n")], { type: "text/plain" }),
      }),
    ]);
  }, html);
  await page.keyboard.press("Meta+V");
  await page.waitForTimeout(4000);

  await page.locator("#js_description").evaluate((el, value) => {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, digest).catch(() => {});

  await page.screenshot({ path: `${screenshotBase}/wechat_filled_latest_before_save.png`, fullPage: false });

  await clickText(page, "保存为草稿");
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${screenshotBase}/wechat_latest_after_save.png`, fullPage: false });

  const savedUrl = page.url();
  const bodyText = await page.locator("body").innerText({ timeout: 10000 });
  if (!bodyText.includes(title)) throw new Error("Saved editor does not include expected title.");

  await clickText(page, "发表");
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${screenshotBase}/wechat_latest_after_publish_click.png`, fullPage: false });

  const textAfterPublish = await page.locator("body").innerText({ timeout: 10000 });
  const confirmTexts = ["确定", "继续发表", "确认发表", "发表"];
  for (const confirm of confirmTexts) {
    const loc = page.getByText(confirm, { exact: true });
    if (await loc.count().catch(() => 0)) {
      await loc.last().click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(5000);
      break;
    }
  }

  await page.screenshot({ path: `${screenshotBase}/wechat_latest_final_state.png`, fullPage: false });
  const finalText = await page.locator("body").innerText({ timeout: 10000 }).catch(() => "");
  console.log(JSON.stringify({
    saved: true,
    savedUrl: savedUrl.replace(/token=\d+/g, "token=REDACTED"),
    finalUrl: page.url().replace(/token=\d+/g, "token=REDACTED"),
    visibleSummary: finalText.split("\\n").filter((line) => /发表|成功|审核|保存|封面|标题|预览|草稿|实名|确定|确认/.test(line)).slice(-80),
  }, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
