import playwright from "../../../tools/browser-publisher/node_modules/playwright/index.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = playwright;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const assets = path.join(root, "assets");

const cards = [
  {
    file: "小红书封面.png",
    kicker: "AI WORKFLOW",
    title: "AI Agent 的下一站",
    subtitle: "不是聊天框\n是组织成员",
    bullets: ["组织身份", "共享上下文", "异步执行", "主动提醒"],
    kind: "cover",
  },
  {
    file: "小红书_02_不是聊天机器人.png",
    kicker: "01",
    title: "不是“多一个机器人”",
    subtitle: "真正的变化是：AI 开始进入组织工作系统",
    bullets: ["有身份", "有权限", "有上下文", "有安全边界"],
    kind: "compare",
  },
  {
    file: "小红书_03_Agent_Harness.png",
    kicker: "02",
    title: "Agent Harness 是什么？",
    subtitle: "让 Agent 真正工作的运行环境",
    bullets: ["身份", "工具", "上下文", "权限", "安全", "记忆", "汇报"],
    kind: "hub",
  },
  {
    file: "小红书_04_个人到团队.png",
    kicker: "03",
    title: "从个人到团队",
    subtitle: "single-player → multi-player",
    bullets: ["事故排查", "讨论整理", "复盘生成", "行动项追踪"],
    kind: "flow",
  },
  {
    file: "小红书_05_同步到异步.png",
    kicker: "04",
    title: "从聊天到委托",
    subtitle: "你给目标，它后台执行、验证、纠偏",
    bullets: ["设定目标", "后台执行", "检查结果", "需要时回来找你"],
    kind: "loop",
  },
  {
    file: "小红书_06_异步安全底座.png",
    kicker: "05",
    title: "异步 Agent 需要安全底座",
    subtitle: "不是让 AI 在后台乱跑",
    bullets: ["长任务能力", "注入防护", "Action 审查", "权限模型", "Goal primitive"],
    kind: "stack",
  },
  {
    file: "小红书_07_被动到主动.png",
    kicker: "06",
    title: "Agent 不能只等你问",
    subtitle: "卡住、异常、触发条件时，要主动提醒",
    bullets: ["实验卡住", "指标异常", "频道出现关键信息"],
    kind: "alert",
  },
  {
    file: "小红书_08_三个场景.png",
    kicker: "07",
    title: "最适合这 3 类事",
    subtitle: "组织级 Agent 的高价值场景",
    bullets: ["实验监控", "主动搜索历史经验", "频道 watcher"],
    kind: "three",
  },
  {
    file: "小红书_09_Codex启发.png",
    kicker: "08",
    title: "对 Codex 的启发",
    subtitle: "不只是写代码，而是沉淀组织能力",
    bullets: ["skill", "connector", "workflow", "review gate", "dashboard"],
    kind: "network",
  },
  {
    file: "小红书_10_总结.png",
    kicker: "09",
    title: "AI Agent 的分水岭",
    subtitle: "从个人外挂，到组织基础设施",
    bullets: ["参与协作", "长期执行", "主动提醒"],
    kind: "final",
  },
];

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function cardHtml(card, size) {
  const isWechat = size === "wechat";
  const w = isWechat ? 1800 : 1080;
  const h = isWechat ? 766 : 1350;
  const visual = card.kind;
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<style>
* { box-sizing: border-box; }
body {
  margin: 0;
  width: ${w}px;
  height: ${h}px;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  color: #17202a;
  background: #f6f3ec;
}
.canvas {
  width: ${w}px;
  height: ${h}px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 18%, rgba(68, 132, 255, .18), transparent 24%),
    radial-gradient(circle at 82% 12%, rgba(16, 185, 129, .14), transparent 22%),
    linear-gradient(135deg, #fbfaf7 0%, #eef4f8 52%, #f8efe4 100%);
  padding: ${isWechat ? "72px 94px" : "82px 72px"};
}
.grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(23,32,42,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(23,32,42,.055) 1px, transparent 1px);
  background-size: 42px 42px;
}
.top {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
}
.kicker {
  font-size: ${isWechat ? "34px" : "34px"};
  letter-spacing: 0;
  font-weight: 800;
  color: #2f6fed;
}
.label {
  font-size: ${isWechat ? "26px" : "28px"};
  color: #56616d;
  font-weight: 650;
}
.title {
  position: relative;
  z-index: 2;
  margin-top: ${isWechat ? "72px" : "96px"};
  font-size: ${isWechat ? "84px" : "82px"};
  line-height: 1.08;
  font-weight: 900;
  letter-spacing: 0;
  max-width: ${isWechat ? "1120px" : "860px"};
}
.subtitle {
  position: relative;
  z-index: 2;
  white-space: pre-line;
  margin-top: 28px;
  font-size: ${isWechat ? "44px" : "46px"};
  line-height: 1.24;
  font-weight: 750;
  color: #344052;
  max-width: ${isWechat ? "950px" : "820px"};
}
.chips {
  position: relative;
  z-index: 2;
  margin-top: ${isWechat ? "56px" : "70px"};
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  max-width: ${isWechat ? "980px" : "850px"};
}
.chip {
  border: 2px solid rgba(23,32,42,.14);
  background: rgba(255,255,255,.72);
  border-radius: 999px;
  padding: 18px 24px;
  font-size: ${isWechat ? "30px" : "32px"};
  font-weight: 760;
  box-shadow: 0 12px 24px rgba(23,32,42,.07);
}
.visual {
  position: absolute;
  right: ${isWechat ? "92px" : "58px"};
  bottom: ${isWechat ? "62px" : "78px"};
  width: ${isWechat ? "560px" : "650px"};
  height: ${isWechat ? "430px" : "470px"};
  z-index: 1;
}
.node {
  position: absolute;
  display: grid;
  place-items: center;
  border: 3px solid rgba(23,32,42,.16);
  background: rgba(255,255,255,.82);
  box-shadow: 0 22px 50px rgba(39, 64, 90, .15);
  font-weight: 850;
  color: #17202a;
}
.core {
  left: 50%;
  top: 48%;
  transform: translate(-50%, -50%);
  width: 210px;
  height: 210px;
  border-radius: 36px;
  background: #17202a;
  color: white;
  font-size: 42px;
}
.small {
  width: 150px;
  height: 86px;
  border-radius: 22px;
  font-size: 26px;
}
.line {
  position: absolute;
  height: 4px;
  background: rgba(47,111,237,.36);
  transform-origin: left center;
}
.footer {
  position: absolute;
  left: ${isWechat ? "94px" : "72px"};
  bottom: ${isWechat ? "56px" : "54px"};
  z-index: 2;
  font-size: ${isWechat ? "26px" : "26px"};
  color: #687586;
  font-weight: 650;
}
</style>
</head>
<body>
<main class="canvas">
  <div class="grid"></div>
  <div class="top"><div class="kicker">${escapeHtml(card.kicker)}</div><div class="label">组织级 Agent Harness</div></div>
  <div class="title">${escapeHtml(card.title)}</div>
  <div class="subtitle">${escapeHtml(card.subtitle)}</div>
  <div class="chips">${card.bullets.map((b) => `<div class="chip">${escapeHtml(b)}</div>`).join("")}</div>
  <div class="visual">${visualHtml(visual)}</div>
  <div class="footer">从个人助手，到团队工作系统</div>
</main>
</body>
</html>`;
}

function visualHtml(kind) {
  const nodes = [
    ["代码库", 18, 14], ["知识库", 66, 10], ["Slack", 6, 58],
    ["任务", 70, 62], ["监控", 38, 78]
  ];
  if (kind === "stack") {
    return `<div class="node" style="left:110px;top:20px;width:420px;height:70px;border-radius:18px;">长任务能力</div>
    <div class="node" style="left:90px;top:105px;width:460px;height:70px;border-radius:18px;">注入防护</div>
    <div class="node" style="left:70px;top:190px;width:500px;height:70px;border-radius:18px;">Action 审查</div>
    <div class="node" style="left:50px;top:275px;width:540px;height:70px;border-radius:18px;">权限模型</div>
    <div class="node" style="left:30px;top:360px;width:580px;height:70px;border-radius:18px;background:#17202a;color:#fff;">Goal primitive</div>`;
  }
  if (kind === "loop") {
    return `<div class="node core">目标</div>
    <div class="node small" style="left:38px;top:40px;">执行</div>
    <div class="node small" style="right:34px;top:42px;">验证</div>
    <div class="node small" style="left:42px;bottom:40px;">纠偏</div>
    <div class="node small" style="right:30px;bottom:42px;">汇报</div>`;
  }
  if (kind === "three") {
    return `<div class="node" style="left:0;top:40px;width:200px;height:330px;border-radius:28px;">实验<br/>监控</div>
    <div class="node" style="left:225px;top:40px;width:200px;height:330px;border-radius:28px;">主动<br/>搜索</div>
    <div class="node" style="left:450px;top:40px;width:200px;height:330px;border-radius:28px;">频道<br/>Watcher</div>`;
  }
  if (kind === "final" || kind === "flow") {
    return `<div class="node" style="left:10px;top:150px;width:230px;height:110px;border-radius:28px;">个人助手</div>
    <div class="line" style="left:250px;top:204px;width:150px;"></div>
    <div class="node" style="right:10px;top:128px;width:250px;height:156px;border-radius:32px;background:#17202a;color:#fff;">组织<br/>基础设施</div>`;
  }
  if (kind === "alert") {
    return `<div class="node core">条件</div>
    <div class="node small" style="left:20px;top:58px;">卡住</div>
    <div class="node small" style="right:10px;top:58px;">异常</div>
    <div class="node" style="left:130px;bottom:28px;width:380px;height:120px;border-radius:32px;background:#2f6fed;color:white;">主动提醒</div>`;
  }
  return `<div class="node core">Agent</div>
  ${nodes.map(([t, x, y]) => `<div class="node small" style="left:${x}%;top:${y}%;">${t}</div>`).join("")}`;
}

await fs.mkdir(assets, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });

for (const card of cards) {
  await page.setViewportSize({ width: 1080, height: 1350 });
  await page.setContent(cardHtml(card, "xhs"), { waitUntil: "load" });
  await page.screenshot({ path: path.join(assets, card.file), fullPage: false });
}

await page.setViewportSize({ width: 1800, height: 766 });
await page.setContent(cardHtml({
  kicker: "ORG-LEVEL AGENT HARNESS",
  title: "AI Agent 真正进入组织",
  subtitle: "不是多一个聊天机器人\n而是一套团队共享的工作系统",
  bullets: ["多人协作", "异步委托", "主动提醒", "安全边界"],
  kind: "network",
}, "wechat"), { waitUntil: "load" });
await page.screenshot({ path: path.join(assets, "公众号封面.png"), fullPage: false });

await browser.close();
