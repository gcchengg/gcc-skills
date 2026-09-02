#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const CHROME_MAC = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DEFAULT_PROFILE = path.join(os.homedir(), ".codex", "wechat-publisher-profile");

function parseArgs(argv) {
  const args = {
    cdp: "http://127.0.0.1:9223",
    profile: DEFAULT_PROFILE,
    mode: "draft",
    loginTimeout: "600000",
    outputDir: process.cwd(),
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) args[key] = true;
    else { args[key] = next; i += 1; }
  }
  return args;
}

function requireArg(args, name) {
  if (!args[name]) throw new Error(`Missing required --${name}`);
}

async function loadPlaywright() {
  try {
    const mod = await import("playwright");
    return mod.default || mod;
  } catch {}
  const candidates = [
    "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js",
    "/Users/apple/Documents/GitHub/gcc-skills/node_modules/playwright/index.js",
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      const mod = await import(pathToFileURL(candidate).href);
      return mod.default || mod;
    } catch {}
  }
  throw new Error("Playwright is unavailable. Install it with: npm install --prefix tools/browser-publisher playwright");
}

function cdpPort(cdp) {
  const parsed = new URL(cdp);
  return parsed.port || "9223";
}

async function connectWithRetry(chromium, cdp, timeoutMs = 30000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try { return await chromium.connectOverCDP(cdp); }
    catch (error) { lastError = error; await new Promise((resolve) => setTimeout(resolve, 700)); }
  }
  throw new Error(`Could not connect to publishing browser at ${cdp}: ${lastError?.message || "timeout"}`);
}

async function launchPersistentChrome(args) {
  await fs.mkdir(args.profile, { recursive: true });
  await fs.access(CHROME_MAC);
  const child = spawn(CHROME_MAC, [
    `--remote-debugging-port=${cdpPort(args.cdp)}`,
    `--user-data-dir=${args.profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--new-window",
    "https://mp.weixin.qq.com/",
  ], { detached: true, stdio: "ignore" });
  child.unref();
  console.log(`OPENED persistent WeChat publishing browser: ${args.profile}`);
}

async function getBrowser(chromium, args) {
  try {
    return await connectWithRetry(chromium, args.cdp, 2500);
  } catch {
    await launchPersistentChrome(args);
    return await connectWithRetry(chromium, args.cdp, 30000);
  }
}

async function getPage(browser) {
  const context = browser.contexts()[0];
  if (!context) throw new Error("Publishing browser has no default context");
  const existing = context.pages().find((page) => page.url().includes("mp.weixin.qq.com"));
  return existing || await context.newPage();
}

function tokenFrom(url) {
  return new URL(url).searchParams.get("token");
}

async function waitForWechatLogin(page, timeoutMs) {
  if (!page.url().includes("mp.weixin.qq.com")) {
    await page.goto("https://mp.weixin.qq.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
  }
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const url = page.url();
    const body = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    if (tokenFrom(url) || /新的创作|首页|草稿箱|内容与互动/.test(body)) {
      console.log("LOGIN_OK WeChat Official Account session is authenticated");
      return;
    }
    if (/扫码|二维码|微信公众平台登录/.test(body)) {
      console.log("LOGIN_REQUIRED Scan the visible QR code in the publishing browser. Waiting...");
      await page.bringToFront();
    }
    await page.waitForTimeout(1200);
  }
  throw new Error("Timed out waiting for WeChat QR login or administrator confirmation");
}

async function enterEditor(page) {
  let token = tokenFrom(page.url());
  if (!token) {
    await page.goto("https://mp.weixin.qq.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
    token = tokenFrom(page.url());
  }
  if (!token) throw new Error("Authenticated page did not expose a WeChat token");
  const editorUrl = `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=10&token=${token}&lang=zh_CN`;
  await page.goto(editorUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator(".ProseMirror").first().waitFor({ state: "visible", timeout: 30000 });
  return editorUrl;
}

async function localImagesToDataUris(html, htmlPath) {
  const base = path.dirname(htmlPath);
  let output = html;
  for (const match of [...html.matchAll(/src="([^"]+)"/g)]) {
    const src = match[1];
    if (/^(https?:|data:|blob:)/i.test(src)) continue;
    const absolute = path.isAbsolute(decodeURIComponent(src)) ? decodeURIComponent(src) : path.resolve(base, decodeURIComponent(src));
    const bytes = await fs.readFile(absolute);
    const ext = path.extname(absolute).toLowerCase();
    const mime = [".jpg", ".jpeg"].includes(ext) ? "image/jpeg" : ext === ".gif" ? "image/gif" : "image/png";
    output = output.replaceAll(`src="${src}"`, `src="data:${mime};base64,${bytes.toString("base64")}"`);
  }
  return output;
}

async function fillEditor(page, args, html) {
  const editors = page.locator(".ProseMirror");
  if (await editors.count() < 2) throw new Error("Unexpected WeChat editor layout: title/body editors not found");
  await editors.nth(0).fill(args.title);
  if (args.author) await page.locator("#author").fill(args.author).catch(() => {});

  await editors.nth(1).click();
  await page.keyboard.press("Meta+A");
  await page.keyboard.press("Backspace");
  const copied = await page.evaluate(async (content) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([content], { type: "text/html" }),
        "text/plain": new Blob([content.replace(/<[^>]+>/g, "\n")], { type: "text/plain" }),
      })]);
      return true;
    } catch { return false; }
  }, html);
  if (copied) await page.keyboard.press("Meta+V");
  else {
    await editors.nth(1).evaluate((el, content) => {
      el.focus();
      document.execCommand("insertHTML", false, content);
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertHTML" }));
    }, html);
  }
  if (args.digest) await page.locator("#js_description").fill(args.digest).catch(() => {});
  await page.waitForTimeout(2500);
}

async function uploadCover(page, coverPath) {
  if (!coverPath) return;
  const absolute = path.resolve(coverPath);
  await fs.access(absolute);
  const clickVisibleText = async (text) => {
    for (const candidate of await page.getByText(text, { exact: true }).all()) {
      if (await candidate.isVisible().catch(() => false)) { await candidate.click(); return true; }
    }
    return false;
  };
  const visiblePicker = page.locator(".weui-desktop-dialog_img-picker:visible");
  if (!await visiblePicker.count()) {
    const emptyCoverMask = page.locator(".select-cover__mask:visible");
    if (await emptyCoverMask.count()) await emptyCoverMask.first().click();
    else {
      const openedMenu = await clickVisibleText("拖拽或选择封面") || await clickVisibleText("选择封面");
      if (!openedMenu) throw new Error("Visible cover entry was not found");
    }
    await page.waitForTimeout(700);

    const currentImageLibrary = page.locator(".js_cover_null_pop:visible a.js_imagedialog");
    if (await currentImageLibrary.count()) await currentImageLibrary.first().click();
    else if (!await clickVisibleText("从图片库选择") && !await clickVisibleText("上传封面")) {
      throw new Error("Visible cover image-library entry was not found");
    }
  }

  const picker = page.locator(".weui-desktop-dialog_img-picker:visible .weui-desktop-img-picker").last();
  await picker.waitFor({ state: "visible", timeout: 10000 });
  const fileInput = picker.locator('input[type="file"]').last();
  if (!await fileInput.count()) throw new Error("Cover picker opened but its file input was not found");
  await fileInput.setInputFiles(absolute);
  await page.waitForTimeout(3500);

  const filename = path.basename(absolute);
  const item = picker.locator(".weui-desktop-img-picker__item").filter({ hasText: filename }).first();
  await item.waitFor({ state: "visible", timeout: 15000 });
  const thumb = item.locator(".weui-desktop-img-picker__img-thumb");
  const nextButton = page.getByText("下一步", { exact: true }).filter({ visible: true }).last();
  let selected = false;
  for (let attempt = 0; attempt < 20 && !selected; attempt += 1) {
    if (await thumb.count()) await thumb.click().catch(() => {});
    else await item.click().catch(() => {});
    await page.waitForTimeout(300);
    selected = await nextButton.isEnabled().catch(() => false);
  }
  if (!selected) throw new Error("Cover item was uploaded but could not be selected");
  await nextButton.click();

  let cropOpened = false;
  for (let attempt = 0; attempt < 120 && !cropOpened; attempt += 1) {
    cropOpened = await page.getByText("上一步", { exact: true }).last().isVisible().catch(() => false)
      || await page.getByText("编辑封面", { exact: true }).last().isVisible().catch(() => false);
    if (!cropOpened) await page.waitForTimeout(500);
  }
  if (!cropOpened) throw new Error("Cover crop page did not open after clicking Next");
  // The crop dialog is rendered asynchronously. Poll all known labels because
  // WeChat has used different wording across editor revisions.
  let confirmed = false;
  for (let attempt = 0; attempt < 120 && !confirmed; attempt += 1) {
    for (const label of ["完成", "确认", "确定"]) {
      const control = page.getByText(label, { exact: true }).last();
      if (await control.isVisible().catch(() => false)) {
        await control.click();
        confirmed = true;
        break;
      }
    }
    if (!confirmed) await page.waitForTimeout(500);
  }
  if (!confirmed) throw new Error("Cover crop confirmation control was not found after 60 seconds");
  await page.waitForTimeout(1500);
  await page.locator(".weui-desktop-dialog_img-picker").last().waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
  console.log(`COVER_OK ${absolute}`);
}

async function validateEditor(page, title) {
  const bodyText = await page.locator("body").innerText();
  const articleText = await page.locator(".ProseMirror").nth(1).innerText();
  const imageCount = await page.locator(".ProseMirror").nth(1).locator("img").count();
  const forbidden = ["原文引用", "资料来源", "公众号封面", "原文图片清单"];
  const leaked = forbidden.filter((item) => articleText.includes(item));
  if (!bodyText.includes(title)) throw new Error("Title is missing from live editor");
  if (articleText.length < 1000) throw new Error(`Article body is unexpectedly short: ${articleText.length}`);
  if (leaked.length) throw new Error(`Publishing artifacts leaked into body: ${leaked.join(", ")}`);
  if (imageCount < 2) throw new Error(`Expected at least 2 body images, found ${imageCount}`);
  console.log(`EDITOR_OK chars=${articleText.length} images=${imageCount}`);
}

async function saveDraft(page, args) {
  const before = page.url();
  await page.getByText("保存为草稿", { exact: true }).last().click({ timeout: 15000 });
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(1000);
    const url = page.url();
    const text = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    if (/appmsgid=\d+/.test(url) || /已保存|保存成功/.test(text) || (url !== before && /appmsg/.test(url))) {
      console.log(`DRAFT_SAVED ${url.replace(/token=\d+/g, "token=REDACTED")}`);
      return url;
    }
  }
  throw new Error("Save button was clicked but no unambiguous draft-save confirmation appeared");
}

async function main() {
  const args = parseArgs(process.argv);
  requireArg(args, "html");
  requireArg(args, "title");
  if (!['fill', 'draft', 'publish'].includes(args.mode)) throw new Error("--mode must be fill, draft, or publish");
  if (args.mode === "publish") throw new Error("Public publish is intentionally not automated by this script. Save a draft, inspect it, then use a separate explicitly approved publish step.");

  const htmlPath = path.resolve(args.html);
  const html = await localImagesToDataUris(await fs.readFile(htmlPath, "utf8"), htmlPath);
  await fs.mkdir(path.resolve(args.outputDir), { recursive: true });
  const { chromium } = await loadPlaywright();
  const browser = await getBrowser(chromium, args);
  const page = await getPage(browser);
  await waitForWechatLogin(page, Number(args.loginTimeout));
  await enterEditor(page);
  await fillEditor(page, args, html);
  await uploadCover(page, args.cover);
  await validateEditor(page, args.title);
  await page.screenshot({ path: path.join(path.resolve(args.outputDir), "wechat_editor_filled.png"), fullPage: false });

  if (args.mode === "fill") {
    console.log("EDITOR_FILLED Inspect the visible browser; nothing was saved yet");
    return;
  }
  const savedUrl = await saveDraft(page, args);
  await page.screenshot({ path: path.join(path.resolve(args.outputDir), "wechat_draft_saved.png"), fullPage: false });
  console.log(JSON.stringify({ status: "draft_saved", title: args.title, url: savedUrl.replace(/token=\d+/g, "token=REDACTED") }));
}

main().catch((error) => { console.error(`ERROR ${error.stack || error.message}`); process.exit(1); });
