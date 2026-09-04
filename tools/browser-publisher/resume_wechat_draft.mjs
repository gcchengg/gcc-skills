import { chromium } from "playwright";

const outputDir = "/Users/apple/Documents/GitHub/gcc-skills/公众号文章/20260821-davinci-seven-2089196207138550270";
const title = "真正省下半小时的，不是公众号主题：是一条不会“假成功”的发布流水线";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9223");
const pages = browser.contexts().flatMap((context) => context.pages());
const page = pages.find((candidate) => candidate.url().includes("appmsg_edit_v2"));
if (!page) throw new Error("WeChat editor page not found");

const picker = page.locator(".weui-desktop-dialog_img-picker:visible");
if (!await picker.count()) throw new Error("Visible image picker not found");
const item = picker.locator(".weui-desktop-img-picker__item")
  .filter({ hasText: "davinci_发布流水线_封面.png" }).first();
await item.locator(".weui-desktop-img-picker__img-thumb").click();

const next = page.getByText("下一步", { exact: true }).filter({ visible: true }).last();
for (let attempt = 0; attempt < 20 && !await next.isEnabled(); attempt += 1) {
  await page.waitForTimeout(250);
}
if (!await next.isEnabled()) throw new Error("Cover item was clicked but Next stayed disabled");
await next.click();

const confirm = page.getByText("确认", { exact: true }).filter({ visible: true }).last();
await confirm.waitFor({ state: "visible", timeout: 60000 });
await confirm.click();
await page.locator(".weui-desktop-dialog__wrp:visible").waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
console.log("COVER_OK davinci_发布流水线_封面.png");

const editors = page.locator(".ProseMirror");
const articleText = await editors.nth(1).innerText();
const imageCount = await editors.nth(1).locator("img").count();
const bodyText = await page.locator("body").innerText();
if (!bodyText.includes(title)) throw new Error("Title is missing from live editor");
if (articleText.length < 1000) throw new Error(`Article body is unexpectedly short: ${articleText.length}`);
if (imageCount < 2) throw new Error(`Expected at least 2 body images, found ${imageCount}`);
console.log(`EDITOR_OK chars=${articleText.length} images=${imageCount}`);
await page.screenshot({ path: `${outputDir}/wechat_editor_filled.png`, fullPage: false });

const before = page.url();
await page.getByText("保存为草稿", { exact: true }).last().click({ timeout: 15000 });
const deadline = Date.now() + 30000;
let savedUrl = "";
while (Date.now() < deadline) {
  await page.waitForTimeout(1000);
  const current = page.url();
  const text = await page.locator("body").innerText().catch(() => "");
  if (/appmsgid=\d+/.test(current) || /已保存|保存成功/.test(text) || (current !== before && /appmsg/.test(current))) {
    savedUrl = current;
    break;
  }
}
if (!savedUrl) throw new Error("No unambiguous draft-save confirmation appeared");
await page.screenshot({ path: `${outputDir}/wechat_draft_saved.png`, fullPage: false });
const safeUrl = savedUrl.replace(/token=\d+/g, "token=REDACTED");
console.log(`DRAFT_SAVED ${safeUrl}`);
console.log(JSON.stringify({ status: "draft_saved", title, url: safeUrl }));
await browser.close();
