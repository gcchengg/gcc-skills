import playwright from "../../../tools/browser-publisher/node_modules/playwright/index.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = playwright;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const assets = path.join(root, "assets");
await fs.mkdir(assets, { recursive: true });

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<style>
* { box-sizing: border-box; }
body {
  margin: 0;
  width: 1800px;
  height: 766px;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  color: #111827;
  background: #f7f5ef;
}
.canvas {
  position: relative;
  width: 1800px;
  height: 766px;
  overflow: hidden;
  padding: 72px 92px;
  background:
    linear-gradient(90deg, rgba(17,24,39,.06) 1px, transparent 1px),
    linear-gradient(rgba(17,24,39,.06) 1px, transparent 1px),
    linear-gradient(135deg, #fffdf7 0%, #edf6f3 52%, #f4eadf 100%);
  background-size: 44px 44px, 44px 44px, auto;
}
.kicker {
  font-size: 34px;
  font-weight: 850;
  color: #0f766e;
}
.title {
  margin-top: 70px;
  width: 1040px;
  font-size: 86px;
  line-height: 1.08;
  font-weight: 900;
  letter-spacing: 0;
}
.sub {
  margin-top: 30px;
  width: 940px;
  font-size: 38px;
  line-height: 1.34;
  font-weight: 720;
  color: #374151;
}
.chips {
  margin-top: 46px;
  display: flex;
  gap: 16px;
}
.chip {
  padding: 16px 22px;
  border-radius: 999px;
  background: rgba(255,255,255,.82);
  border: 2px solid rgba(17,24,39,.14);
  font-size: 28px;
  font-weight: 780;
}
.diagram {
  position: absolute;
  right: 96px;
  top: 92px;
  width: 560px;
  height: 560px;
}
.box {
  position: absolute;
  display: grid;
  place-items: center;
  border-radius: 28px;
  border: 3px solid rgba(17,24,39,.18);
  background: rgba(255,255,255,.86);
  box-shadow: 0 22px 44px rgba(31,41,55,.12);
  font-size: 30px;
  font-weight: 850;
}
.inner {
  left: 145px;
  top: 160px;
  width: 270px;
  height: 170px;
  background: #111827;
  color: #fff;
}
.outer {
  left: 46px;
  top: 48px;
  width: 468px;
  height: 468px;
  border-radius: 48px;
  border: 5px solid #0f766e;
  background: transparent;
  box-shadow: none;
  color: #0f766e;
  align-items: start;
  padding-top: 28px;
}
.mini {
  width: 164px;
  height: 88px;
  font-size: 26px;
}
.q { left: 22px; top: 222px; }
.v { right: 22px; top: 222px; }
.a { left: 198px; bottom: 16px; }
.arrow {
  position: absolute;
  height: 5px;
  background: #0f766e;
  border-radius: 99px;
}
.arrow.one { left: 174px; top: 248px; width: 210px; }
.arrow.two { left: 275px; top: 330px; width: 5px; height: 155px; }
.footer {
  position: absolute;
  left: 92px;
  bottom: 48px;
  font-size: 26px;
  font-weight: 680;
  color: #6b7280;
}
</style>
</head>
<body>
<main class="canvas">
  <div class="kicker">AGENTIC ENGINEERING</div>
  <div class="title">AI Agent 时代，工程师真正要拥有的是外循环</div>
  <div class="sub">当 agent 能自己调查、实现、验证并反复执行，人的核心工作变成质量证据、最终裁决和可追责解释。</div>
  <div class="chips">
    <div class="chip">Quality</div>
    <div class="chip">Verdict</div>
    <div class="chip">Answerability</div>
  </div>
  <section class="diagram" aria-label="outer loop diagram">
    <div class="box outer">外循环责任</div>
    <div class="box inner">内循环<br/>Agent 执行</div>
    <div class="box mini q">质量证据</div>
    <div class="box mini v">生产裁决</div>
    <div class="box mini a">可追责</div>
    <div class="arrow one"></div>
    <div class="arrow two"></div>
  </section>
  <div class="footer">Own the Outer Loop / Addy Osmani 文章解读</div>
</main>
</body>
</html>`;

const htmlPath = path.join(assets, "cover.html");
await fs.writeFile(htmlPath, html, "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 766 }, deviceScaleFactor: 1 });
await page.goto(`file://${htmlPath}`);
await page.screenshot({ path: path.join(assets, "公众号封面.png"), clip: { x: 0, y: 0, width: 1800, height: 766 } });
await browser.close();
