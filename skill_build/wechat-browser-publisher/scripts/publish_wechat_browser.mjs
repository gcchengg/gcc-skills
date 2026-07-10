#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

function parseArgs(argv) {
  const args = { cdp: "http://127.0.0.1:9222", mode: "draft" };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function requireArg(args, name) {
  if (!args[name]) throw new Error(`Missing required --${name}`);
}

async function loadPlaywright() {
  try {
    const module = await import("playwright");
    return module.default || module;
  } catch {
    const localPath = "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js";
    try {
      await fs.access(localPath);
      const module = await import(pathToFileURL(localPath).href);
      return module.default || module;
    } catch {
      throw new Error(
        "Playwright is not available. Install it in the workspace, for example: npm install --prefix tools/browser-publisher playwright"
      );
    }
  }
}

async function firstUsablePage(browser) {
  for (const context of browser.contexts()) {
    const pages = context.pages();
    if (pages.length > 0) return pages[0];
  }
  const context = browser.contexts()[0] || (await browser.newContext());
  return await context.newPage();
}

async function fillText(page, value, candidates, label) {
  if (!value) return false;
  for (const candidate of candidates) {
    const locator = page.locator(candidate).first();
    try {
      if ((await locator.count()) === 0) continue;
      await locator.waitFor({ state: "visible", timeout: 1500 });
      await locator.fill(value, { timeout: 3000 });
      console.log(`OK filled ${label}: ${candidate}`);
      return true;
    } catch {}
  }
  console.log(`WARN could not find ${label} field automatically`);
  return false;
}

async function fillWechatTitle(page, title) {
  const ok = await page.evaluate((value) => {
    const textarea = document.querySelector("#title");
    if (textarea) {
      textarea.value = value;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const titleEditor = [...document.querySelectorAll('[contenteditable="true"]')]
      .find((el) => el.getAttribute("data-placeholder")?.includes("标题"));
    if (titleEditor) {
      titleEditor.focus();
      titleEditor.textContent = value;
      titleEditor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    }
    return Boolean(textarea || titleEditor);
  }, title);
  if (ok) console.log("OK filled title with WeChat editor fallback");
  else console.log("WARN could not fill title with WeChat editor fallback");
  return ok;
}

async function clickFirst(page, candidates, label) {
  for (const candidate of candidates) {
    const locator = page.locator(candidate).first();
    try {
      if ((await locator.count()) === 0) continue;
      await locator.waitFor({ state: "visible", timeout: 1500 });
      await locator.click({ timeout: 3000 });
      console.log(`OK clicked ${label}: ${candidate}`);
      return true;
    } catch {}
  }
  console.log(`WARN could not click ${label} automatically`);
  return false;
}

async function pasteHtmlIntoEditor(page, html) {
  const inserted = await page.evaluate((content) => {
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 200 && rect.height > 180 && getComputedStyle(el).visibility !== "hidden";
    };
    const editables = [...document.querySelectorAll('[contenteditable="true"], [contenteditable="plaintext-only"]')];
    for (const el of editables) {
      if (!visible(el)) continue;
      if (el.getAttribute("data-placeholder")?.includes("标题")) continue;
      el.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("insertHTML", false, content);
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertHTML", data: null }));
      return true;
    }
    return false;
  }, html);

  if (inserted) {
    console.log("OK inserted article HTML into a visible contenteditable editor");
    return true;
  }
  console.log("WARN could not find article body editor automatically");
  return false;
}

async function inlineLocalImageSources(html, htmlPath) {
  const baseDir = path.dirname(htmlPath);
  const matches = [...html.matchAll(/src="([^"]+)"/g)];
  let result = html;
  for (const match of matches) {
    const src = match[1];
    if (/^(https?:|data:|blob:)/i.test(src)) continue;
    const decoded = decodeURIComponent(src);
    const abs = path.isAbsolute(decoded) ? decoded : path.resolve(baseDir, decoded);
    try {
      const bytes = await fs.readFile(abs);
      const ext = path.extname(abs).toLowerCase();
      const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".gif" ? "image/gif" : "image/png";
      const dataUri = `data:${mime};base64,${bytes.toString("base64")}`;
      result = result.replaceAll(`src="${src}"`, `src="${dataUri}"`);
    } catch {
      console.log(`WARN could not inline image source: ${src}`);
    }
  }
  return result;
}

async function uploadFileToFirstChooser(page, filePath, triggerCandidates, label) {
  if (!filePath) return false;
  const abs = path.resolve(filePath);
  await fs.access(abs);

  for (const candidate of triggerCandidates) {
    try {
      const trigger = page.locator(candidate).first();
      if ((await trigger.count()) === 0) continue;
      const chooserPromise = page.waitForEvent("filechooser", { timeout: 3000 }).catch(() => null);
      await trigger.click({ timeout: 3000 });
      const chooser = await chooserPromise;
      if (!chooser) continue;
      await chooser.setFiles(abs);
      console.log(`OK uploaded ${label}: ${abs}`);
      return true;
    } catch {}
  }

  console.log(`WARN could not upload ${label} automatically`);
  return false;
}

async function main() {
  const args = parseArgs(process.argv);
  requireArg(args, "html");
  requireArg(args, "title");

  if (!["fill", "draft", "publish"].includes(args.mode)) {
    throw new Error("--mode must be one of: fill, draft, publish");
  }
  if (args.mode === "publish" && !args.confirmPublish) {
    throw new Error("Refusing final publish without --confirmPublish. Prefer --mode draft.");
  }

  const htmlPath = path.resolve(args.html);
  const rawHtml = await fs.readFile(htmlPath, "utf8");
  const html = await inlineLocalImageSources(rawHtml, htmlPath);
  const { chromium } = await loadPlaywright();
  const browser = await chromium.connectOverCDP(args.cdp);
  const page = await firstUsablePage(browser);

  console.log(`Connected to Chrome CDP: ${args.cdp}`);
  if (!page.url().includes("mp.weixin.qq.com")) {
    await page.goto("https://mp.weixin.qq.com/", { waitUntil: "domcontentloaded" });
  }

  console.log("If the page asks for QR login, account selection, or verification, complete it manually in the browser.");
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  const editUrl = "https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&lang=zh_CN";
  if (!page.url().includes("appmsg")) {
    await page.goto(editUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(2500);
  }

  const titleFilled = await fillText(page, args.title, [
    'input[placeholder*="标题"]',
    'textarea[placeholder*="标题"]',
    '[contenteditable="true"][placeholder*="标题"]',
    ".js_title input",
    "#title",
  ], "title");
  if (!titleFilled) await fillWechatTitle(page, args.title);

  await fillText(page, args.author || "", [
    'input[placeholder*="作者"]',
    'textarea[placeholder*="作者"]',
    ".js_author input",
    "#author",
  ], "author");

  await pasteHtmlIntoEditor(page, html);

  if (args.digest) {
    await fillText(page, args.digest, [
      'textarea[placeholder*="摘要"]',
      'input[placeholder*="摘要"]',
      ".js_digest textarea",
      "#digest",
    ], "digest");
  }

  if (args.cover) {
    await uploadFileToFirstChooser(page, args.cover, [
      "text=从图片库选择",
      "text=上传封面",
      "text=选择封面",
      "text=封面和摘要",
      ".js_cover_area",
    ], "cover");
  }

  if (args.mode === "fill") {
    console.log("Filled editor only. Please inspect and save manually.");
    return;
  }

  if (args.mode === "draft") {
    const clicked = await clickFirst(page, [
      "text=保存为草稿",
      "text=保存草稿",
      "text=保存",
      'button:has-text("保存")',
      'a:has-text("保存")',
    ], "save draft");
    if (!clicked) {
      console.log("Manual step required: inspect the editor and click save draft.");
      return;
    }
    await page.waitForTimeout(2500);
    console.log("Draft save was attempted. Verify the WeChat page for success confirmation.");
    return;
  }

  console.log("Publish mode requested. Manual final confirmation is still required in the browser.");
}

main().catch((error) => {
  console.error(`ERROR ${error.message}`);
  process.exit(1);
});
