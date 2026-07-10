import playwright from "../../../tools/browser-publisher/node_modules/playwright/index.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = playwright;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const assets = path.join(root, "assets");

const cards = [
  ["小红书封面.png", "OPENAI WORK", "Codex 进入 ChatGPT", "聊天框要变工作台了", ["Codex", "Work 模式", "GPT-5.6", "桌面 App"]],
  ["小红书_02_不是普通更新.png", "01", "不是普通产品更新", "真正变化：ChatGPT 从问答工具变成工作入口", ["聊天框", "工作台", "任务执行"]],
  ["小红书_03_Codex入口变了.png", "02", "Codex 的入口变了", "不只待在代码里，而是连接文档、需求和文件", ["代码", "文件", "需求", "上下文"]],
  ["小红书_04_从问答到执行.png", "03", "从问答到执行", "Work 模式的心智不是聊天，而是把任务交给 AI", ["目标", "材料", "步骤", "结果"]],
  ["小红书_05_模型分层.png", "04", "GPT-5.6 系列说明什么？", "模型开始分层：强模型、mini、nano 各司其职", ["复杂推理", "高频任务", "低延迟"]],
  ["小红书_06_程序员影响.png", "05", "AI 编程变成工作流", "从需求理解、代码修改，到测试验证和 PR 说明", ["读需求", "改代码", "跑测试", "写说明"]],
  ["小红书_07_办公用户影响.png", "06", "ChatGPT 更像工作容器", "市场、运营、产品、管理者都能把材料变成结果", ["整理", "拆解", "生成", "交付"]],
  ["小红书_08_入口之争.png", "07", "AI 办公入口之争", "OpenAI、Microsoft、Google、Anthropic 都在争夺工作入口", ["Office", "ChatGPT", "Workspace", "Claude"]],
  ["小红书_09_总结.png", "08", "别只看模型名", "真正重要的是：从聊天体验，转向工作流体验", ["聊天体验", "工作流体验"]],
];

function esc(s) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function html({ kicker, title, subtitle, bullets, wechat = false }) {
  const w = wechat ? 1800 : 1080;
  const h = wechat ? 766 : 1350;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box} body{margin:0;width:${w}px;height:${h}px;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color:#111827;background:#f7fafc}
.canvas{position:relative;width:${w}px;height:${h}px;overflow:hidden;padding:${wechat ? "74px 92px" : "84px 72px"};background:
linear-gradient(135deg,#f8fbff 0%,#eef7f4 45%,#fff7ed 100%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(17,24,39,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(17,24,39,.06) 1px,transparent 1px);background-size:44px 44px}
.top{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center}
.kicker{font-size:${wechat ? "34px" : "34px"};font-weight:900;color:#10a37f;letter-spacing:0}.tag{font-size:${wechat ? "27px" : "30px"};font-weight:760;color:#5b677a}
.title{position:relative;z-index:2;margin-top:${wechat ? "68px" : "96px"};font-size:${wechat ? "86px" : "84px"};line-height:1.08;font-weight:950;letter-spacing:0;max-width:${wechat ? "1120px" : "850px"}}
.subtitle{position:relative;z-index:2;margin-top:28px;font-size:${wechat ? "44px" : "46px"};line-height:1.25;font-weight:800;color:#334155;max-width:${wechat ? "1040px" : "840px"}}
.chips{position:relative;z-index:2;margin-top:${wechat ? "54px" : "72px"};display:flex;flex-wrap:wrap;gap:18px;max-width:${wechat ? "1050px" : "860px"}}
.chip{padding:18px 25px;border-radius:999px;background:rgba(255,255,255,.78);border:2px solid rgba(15,23,42,.13);box-shadow:0 16px 30px rgba(15,23,42,.08);font-size:${wechat ? "30px" : "32px"};font-weight:820}
.visual{position:absolute;right:${wechat ? "90px" : "58px"};bottom:${wechat ? "58px" : "80px"};width:${wechat ? "560px" : "650px"};height:${wechat ? "420px" : "480px"};z-index:1}
.panel{position:absolute;border:3px solid rgba(15,23,42,.14);background:rgba(255,255,255,.82);box-shadow:0 22px 60px rgba(15,23,42,.14);display:grid;place-items:center;font-weight:900}
.core{left:50%;top:48%;transform:translate(-50%,-50%);width:235px;height:235px;border-radius:42px;background:#111827;color:white;font-size:44px}
.mini{width:170px;height:92px;border-radius:24px;font-size:28px}.footer{position:absolute;left:${wechat ? "92px" : "72px"};bottom:${wechat ? "56px" : "56px"};font-size:26px;color:#64748b;font-weight:760}
</style></head><body><main class="canvas"><div class="grid"></div><div class="top"><div class="kicker">${esc(kicker)}</div><div class="tag">Codex × ChatGPT Work</div></div><div class="title">${esc(title)}</div><div class="subtitle">${esc(subtitle)}</div><div class="chips">${bullets.map(b=>`<div class="chip">${esc(b)}</div>`).join("")}</div><div class="visual">
<div class="panel core">ChatGPT</div><div class="panel mini" style="left:15px;top:35px">Codex</div><div class="panel mini" style="right:12px;top:38px">文件</div><div class="panel mini" style="left:35px;bottom:35px">模型</div><div class="panel mini" style="right:30px;bottom:35px">任务</div>
</div><div class="footer">从聊天体验，到工作流体验</div></main></body></html>`;
}

await fs.mkdir(assets, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });

for (const [file, kicker, title, subtitle, bullets] of cards) {
  await page.setViewportSize({ width: 1080, height: 1350 });
  await page.setContent(html({ kicker, title, subtitle, bullets }), { waitUntil: "load" });
  await page.screenshot({ path: path.join(assets, file), fullPage: false });
}

await page.setViewportSize({ width: 1800, height: 766 });
await page.setContent(html({
  kicker: "OPENAI WORK",
  title: "Codex 进入 ChatGPT App",
  subtitle: "OpenAI 想把聊天框变成工作台",
  bullets: ["Codex", "Work 模式", "GPT-5.6", "AI 工作流"],
  wechat: true,
}), { waitUntil: "load" });
await page.screenshot({ path: path.join(assets, "公众号封面.png"), fullPage: false });

await browser.close();
