import fs from "node:fs";
import path from "node:path";

const outDir = path.dirname(new URL(import.meta.url).pathname);
const W = 1080;
const H = 1440;

const cards = [
  {
    file: "01-cover.svg",
    eyebrow: "CODEX MOBILE WORKFLOW",
    title: ["我发现 Codex", "可以用手机控制了"],
    subtitle: "电脑负责执行，手机随时接管",
    type: "cover",
    badge: "图文教程版",
  },
  {
    file: "02-concept.svg",
    eyebrow: "先搞懂它",
    title: ["不是手机写代码", "而是手机接管 Codex"],
    subtitle: "真正有用的是远程查看进度、补充判断、批准下一步",
    type: "concept",
  },
  {
    file: "03-prepare.svg",
    eyebrow: "使用前准备",
    title: ["先准备", "这 3 件事"],
    subtitle: "两端登录同一个账号，电脑端保持 Codex 正在运行",
    type: "steps",
    steps: [
      ["Mac 端", "打开 Codex 桌面 App，并开始一个任务"],
      ["手机端", "更新 ChatGPT App，进入 Codex 相关入口"],
      ["同账号", "两端登录同一个 OpenAI / ChatGPT 账号"],
    ],
  },
  {
    file: "04-start-on-pc.svg",
    eyebrow: "第 1 步",
    title: ["先在电脑端", "让 Codex 开始工作"],
    subtitle: "修 bug、读项目、跑测试、生成文档，都先交给电脑环境执行",
    type: "pc",
  },
  {
    file: "05-open-on-phone.svg",
    eyebrow: "第 2 步",
    title: ["手机端打开", "同一个 Codex 任务"],
    subtitle: "离开电脑后，也能继续看这个线程的状态",
    type: "phone",
  },
  {
    file: "06-what-can-see.svg",
    eyebrow: "手机端能看什么",
    title: ["不是简化版", "关键状态都能看"],
    subtitle: "终端输出、测试结果、截图、diff、审批，都适合在手机上快速判断",
    type: "features",
  },
  {
    file: "07-use-cases.svg",
    eyebrow: "最适合的场景",
    title: ["这 4 种情况", "特别实用"],
    subtitle: "它适合碎片时间接管，不适合在手机上硬写复杂代码",
    type: "usecases",
  },
  {
    file: "08-prompts.svg",
    eyebrow: "手机端指令模板",
    title: ["这样发指令", "Codex 更容易执行"],
    subtitle: "短、明确、有边界，比长篇描述更适合手机端",
    type: "prompts",
  },
  {
    file: "09-summary.svg",
    eyebrow: "一句话总结",
    title: ["电脑干重活", "手机管方向"],
    subtitle: "Codex 手机端的意义，不是把手机变成 IDE，而是把手机变成远程指挥台",
    type: "summary",
  },
];

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textLines(lines, x, y, size, weight = 700, color = "#111827", gap = 1.16, anchor = "start") {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="PingFang SC, Noto Sans CJK SC, Microsoft YaHei, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" letter-spacing="0">${lines.map((line, i) => `<tspan x="${x}" dy="${i ? size * gap : 0}">${esc(line)}</tspan>`).join("")}</text>`;
}

function wrap(text, maxChars) {
  const out = [];
  let buf = "";
  for (const ch of text) {
    const next = buf + ch;
    if ([...next].length > maxChars && buf) {
      out.push(buf);
      buf = ch;
    } else {
      buf = next;
    }
  }
  if (buf) out.push(buf);
  return out;
}

function bg() {
  return `
  <rect width="${W}" height="${H}" rx="0" fill="#f7f8f4"/>
  <circle cx="960" cy="132" r="110" fill="#dcefe4" opacity=".75"/>
  <circle cx="110" cy="1260" r="150" fill="#e9eee9" opacity=".9"/>
  <path d="M0 1120 C220 1040 360 1190 560 1110 C760 1030 880 1090 1080 1010 L1080 1440 L0 1440 Z" fill="#eef2ec" opacity=".8"/>
  `;
}

function top(card, n) {
  return `
  <rect x="70" y="64" width="178" height="38" rx="19" fill="#112018"/>
  <text x="159" y="89" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#e9fff0">${String(n).padStart(2, "0")}/09</text>
  <text x="70" y="148" font-family="Arial, PingFang SC, sans-serif" font-size="22" font-weight="800" fill="#188a54" letter-spacing="2">${esc(card.eyebrow)}</text>
  `;
}

function subtitle(s) {
  return textLines(wrap(s, 21), 74, 398, 34, 500, "#52605a", 1.42);
}

function phone(x, y, w, h, title = "Codex", lines = ["正在分析项目结构", "需要批准下一步", "查看测试输出"]) {
  const sw = w - 42;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.1}" fill="#101612"/>
  <rect x="${x + 15}" y="${y + 15}" width="${w - 30}" height="${h - 30}" rx="${w * 0.075}" fill="#fbfcf9"/>
  <rect x="${x + w * 0.35}" y="${y + 30}" width="${w * 0.3}" height="12" rx="6" fill="#101612"/>
  <text x="${x + 42}" y="${y + 88}" font-family="Arial, PingFang SC, sans-serif" font-size="30" font-weight="800" fill="#111827">${esc(title)}</text>
  <rect x="${x + 36}" y="${y + 124}" width="${sw}" height="88" rx="22" fill="#e9f5ed"/>
  <text x="${x + 62}" y="${y + 177}" font-family="PingFang SC, Arial, sans-serif" font-size="25" font-weight="700" fill="#176b43">${esc(lines[0])}</text>
  <rect x="${x + 36}" y="${y + 232}" width="${sw}" height="98" rx="22" fill="#111827"/>
  <text x="${x + 62}" y="${y + 291}" font-family="PingFang SC, Arial, sans-serif" font-size="25" font-weight="700" fill="#ffffff">${esc(lines[1])}</text>
  <rect x="${x + 36}" y="${y + 350}" width="${sw}" height="88" rx="22" fill="#f0f2ee"/>
  <text x="${x + 62}" y="${y + 403}" font-family="PingFang SC, Arial, sans-serif" font-size="25" font-weight="700" fill="#38413c">${esc(lines[2])}</text>
  <rect x="${x + 36}" y="${y + h - 98}" width="${sw}" height="54" rx="27" fill="#edf0ec"/>
  <text x="${x + 62}" y="${y + h - 63}" font-family="PingFang SC, Arial, sans-serif" font-size="21" fill="#68736d">给 Codex 补充一句指令...</text>
  `;
}

function laptop(x, y, w, h, title = "Codex on Mac") {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="#202722"/>
  <rect x="${x + 20}" y="${y + 20}" width="${w - 40}" height="${h - 40}" rx="20" fill="#fcfdf9"/>
  <rect x="${x + 52}" y="${y + 58}" width="${w - 104}" height="72" rx="18" fill="#111827"/>
  <text x="${x + 82}" y="${y + 105}" font-family="Arial, PingFang SC, sans-serif" font-size="30" font-weight="800" fill="#e9fff0">${esc(title)}</text>
  <rect x="${x + 52}" y="${y + 160}" width="${w - 104}" height="92" rx="20" fill="#e9f5ed"/>
  <text x="${x + 82}" y="${y + 214}" font-family="PingFang SC, Arial, sans-serif" font-size="26" font-weight="700" fill="#176b43">正在读取项目、修改文件、运行测试</text>
  <rect x="${x + 52}" y="${y + 282}" width="${w - 104}" height="170" rx="20" fill="#101612"/>
  <text x="${x + 82}" y="${y + 330}" font-family="Menlo, Monaco, monospace" font-size="22" fill="#92f0b0">$ npm test</text>
  <text x="${x + 82}" y="${y + 372}" font-family="Menlo, Monaco, monospace" font-size="22" fill="#d8f8df">✓ 24 tests passed</text>
  <text x="${x + 82}" y="${y + 414}" font-family="Menlo, Monaco, monospace" font-size="22" fill="#f8e3a2">review diff before commit</text>
  <rect x="${x + w * 0.22}" y="${y + h + 8}" width="${w * 0.56}" height="22" rx="11" fill="#202722"/>
  `;
}

function arrow(x1, y1, x2, y2, color = "#188a54") {
  return `
  <path d="M${x1} ${y1} C${(x1 + x2) / 2} ${y1 - 80}, ${(x1 + x2) / 2} ${y2 + 80}, ${x2} ${y2}" stroke="${color}" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M${x2 - 28} ${y2 - 10} L${x2} ${y2} L${x2 - 18} ${y2 + 24}" stroke="${color}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

function pill(x, y, text, fill = "#e9f5ed", color = "#176b43") {
  return `<rect x="${x}" y="${y}" width="${[...text].length * 30 + 44}" height="58" rx="29" fill="${fill}"/><text x="${x + 22}" y="${y + 38}" font-family="PingFang SC, Arial, sans-serif" font-size="25" font-weight="800" fill="${color}">${esc(text)}</text>`;
}

function bulletBlock(items, x, y) {
  return items.map((it, i) => {
    const yy = y + i * 152;
    return `
    <rect x="${x}" y="${yy}" width="920" height="118" rx="30" fill="#ffffff" stroke="#dde5dc" stroke-width="2"/>
    <circle cx="${x + 58}" cy="${yy + 59}" r="28" fill="#188a54"/>
    <text x="${x + 58}" y="${yy + 69}" text-anchor="middle" font-family="Arial" font-size="28" font-weight="800" fill="#ffffff">${i + 1}</text>
    <text x="${x + 108}" y="${yy + 49}" font-family="PingFang SC, Arial, sans-serif" font-size="30" font-weight="800" fill="#111827">${esc(it[0])}</text>
    <text x="${x + 108}" y="${yy + 86}" font-family="PingFang SC, Arial, sans-serif" font-size="24" font-weight="500" fill="#5b665f">${esc(it[1])}</text>
    `;
  }).join("");
}

function miniCard(x, y, title, body) {
  return `
  <rect x="${x}" y="${y}" width="430" height="178" rx="30" fill="#ffffff" stroke="#dde5dc" stroke-width="2"/>
  <text x="${x + 34}" y="${y + 58}" font-family="PingFang SC, Arial, sans-serif" font-size="31" font-weight="800" fill="#111827">${esc(title)}</text>
  ${textLines(wrap(body, 13), x + 34, y + 100, 24, 500, "#5d6762", 1.28)}
  `;
}

function promptBubble(x, y, txt, accent = false) {
  const lines = wrap(txt, 18);
  const height = 52 + lines.length * 34;
  return `
  <rect x="${x}" y="${y}" width="900" height="${height}" rx="28" fill="${accent ? "#111827" : "#ffffff"}" stroke="${accent ? "#111827" : "#dde5dc"}" stroke-width="2"/>
  ${textLines(lines, x + 34, y + 58, 27, 700, accent ? "#ffffff" : "#1c2420", 1.24)}
  `;
}

function replaceHint(x, y, w) {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="62" rx="31" fill="#fff7df" stroke="#f0d98b" stroke-width="2"/>
  <text x="${x + 28}" y="${y + 40}" font-family="PingFang SC, Arial, sans-serif" font-size="23" font-weight="800" fill="#8a6a11">这里可替换为你的真实截图</text>
  `;
}

function render(card, index) {
  let body = "";
  if (card.type === "cover") {
    body = `
    ${textLines(card.title, 74, 242, 78, 900, "#111827", 1.13)}
    ${subtitle(card.subtitle)}
    ${laptop(74, 560, 570, 420, "Codex on Mac")}
    ${phone(682, 495, 282, 590, "ChatGPT", ["查看 Codex 进度", "批准下一步", "继续补充指令"])}
    ${arrow(620, 780, 682, 760)}
    ${pill(74, 1162, "真实截图教程")}
    ${pill(340, 1162, "9 张收藏版", "#111827", "#ffffff")}
    <text x="74" y="1285" font-family="PingFang SC, Arial, sans-serif" font-size="30" font-weight="700" fill="#52605a">不用守在电脑前，也能远程调度正在工作的 Codex</text>
    `;
  } else if (card.type === "concept") {
    body = `
    ${textLines(card.title, 74, 242, 70, 900, "#111827", 1.14)}
    ${subtitle(card.subtitle)}
    ${laptop(76, 570, 460, 360, "电脑端")}
    ${phone(625, 520, 300, 580, "手机端", ["看进度", "补需求", "做确认"])}
    ${arrow(526, 725, 625, 720)}
    ${miniCard(74, 1058, "电脑端", "负责读文件、跑命令、改代码、测结果")}
    ${miniCard(576, 1058, "手机端", "负责看状态、补判断、批准或暂停")}
    `;
  } else if (card.type === "steps") {
    body = `
    ${textLines(card.title, 74, 242, 72, 900, "#111827", 1.13)}
    ${subtitle(card.subtitle)}
    ${bulletBlock(card.steps, 80, 558)}
    <rect x="80" y="1100" width="920" height="152" rx="34" fill="#111827"/>
    <text x="124" y="1160" font-family="PingFang SC, Arial, sans-serif" font-size="32" font-weight="900" fill="#ffffff">重点提醒</text>
    <text x="124" y="1210" font-family="PingFang SC, Arial, sans-serif" font-size="26" font-weight="600" fill="#d8f8df">目前官方说明是手机端连接 macOS 上运行的 Codex。</text>
    `;
  } else if (card.type === "pc") {
    body = `
    ${textLines(card.title, 74, 242, 72, 900, "#111827", 1.13)}
    ${subtitle(card.subtitle)}
    ${laptop(82, 540, 916, 560, "Codex 桌面端")}
    ${replaceHint(126, 1158, 430)}
    ${pill(594, 1160, "任务先从这里开始")}
    `;
  } else if (card.type === "phone") {
    body = `
    ${textLines(card.title, 74, 242, 72, 900, "#111827", 1.13)}
    ${subtitle(card.subtitle)}
    ${phone(190, 510, 700, 780, "ChatGPT / Codex", ["继续查看当前线程", "需要审批：运行命令", "输入：先总结进度"])}
    ${replaceHint(320, 1230, 440)}
    `;
  } else if (card.type === "features") {
    body = `
    ${textLines(card.title, 74, 242, 72, 900, "#111827", 1.13)}
    ${subtitle(card.subtitle)}
    ${miniCard(76, 530, "终端输出", "$ npm test 的结果")}
    ${miniCard(576, 530, "测试结果", "通过、失败、错误位置")}
    ${miniCard(76, 760, "代码 diff", "看它具体改了什么")}
    ${miniCard(576, 760, "截图预览", "确认 UI 是否正常")}
    ${miniCard(76, 990, "审批操作", "批准命令或暂停任务")}
    ${miniCard(576, 990, "继续对话", "补充需求和边界")}
    <text x="80" y="1285" font-family="PingFang SC, Arial, sans-serif" font-size="28" font-weight="700" fill="#52605a">适合快速判断，不适合在手机上逐行审复杂代码。</text>
    `;
  } else if (card.type === "usecases") {
    body = `
    ${textLines(card.title, 74, 242, 72, 900, "#111827", 1.13)}
    ${subtitle(card.subtitle)}
    ${miniCard(76, 540, "通勤路上", "确认 Codex 的执行方向")}
    ${miniCard(576, 540, "开会间隙", "查看任务是否卡住")}
    ${miniCard(76, 780, "离开电脑", "远程批准下一步")}
    ${miniCard(576, 780, "突然有想法", "马上补充新要求")}
    ${phone(360, 1030, 360, 300, "Codex", ["状态同步", "等待确认", "继续执行"])}
    `;
  } else if (card.type === "prompts") {
    body = `
    ${textLines(card.title, 74, 242, 72, 900, "#111827", 1.13)}
    ${subtitle(card.subtitle)}
    ${promptBubble(88, 540, "先总结你现在发现的问题。", true)}
    ${promptBubble(88, 670, "继续修，但不要扩大改动范围。")}
    ${promptBubble(88, 800, "测试失败的话，先定位原因。")}
    ${promptBubble(88, 930, "这个方案不对，换成更保守的实现。")}
    ${promptBubble(88, 1060, "把当前进度整理成 5 条，我稍后回电脑看。")}
    `;
  } else if (card.type === "summary") {
    body = `
    ${textLines(card.title, 74, 242, 78, 900, "#111827", 1.13)}
    ${subtitle(card.subtitle)}
    <rect x="92" y="555" width="896" height="430" rx="44" fill="#111827"/>
    <text x="540" y="675" text-anchor="middle" font-family="PingFang SC, Arial, sans-serif" font-size="48" font-weight="900" fill="#ffffff">手机不是 IDE</text>
    <text x="540" y="760" text-anchor="middle" font-family="PingFang SC, Arial, sans-serif" font-size="48" font-weight="900" fill="#d8f8df">手机是指挥台</text>
    <text x="540" y="865" text-anchor="middle" font-family="PingFang SC, Arial, sans-serif" font-size="30" font-weight="600" fill="#b9c9bf">电脑继续执行，手机随时接管方向</text>
    ${pill(110, 1082, "你会用它修 bug 吗？")}
    ${pill(110, 1168, "写文档？跑测试？")}
    <text x="110" y="1290" font-family="PingFang SC, Arial, sans-serif" font-size="26" font-weight="700" fill="#52605a">评论区可以直接分享你的 Codex 手机端用法。</text>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <title>${esc(card.title.join(" "))}</title>
  ${bg()}
  ${top(card, index + 1)}
  ${body}
</svg>`;
}

for (const [i, card] of cards.entries()) {
  fs.writeFileSync(path.join(outDir, card.file), render(card, i), "utf8");
}

const indexHtml = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Codex 手机端控制小红书教程卡片</title>
  <style>
    body { margin: 0; background: #e9ece7; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif; }
    main { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 24px; padding: 32px; }
    img { width: 100%; display: block; border-radius: 18px; box-shadow: 0 14px 40px rgba(0,0,0,.12); background: #f7f8f4; }
  </style>
</head>
<body>
  <main>
    ${cards.map(card => `<img src="./${card.file}" alt="${esc(card.title.join(" "))}" />`).join("\n    ")}
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "index.html"), indexHtml, "utf8");
console.log(`Generated ${cards.length} SVG cards in ${outDir}`);
