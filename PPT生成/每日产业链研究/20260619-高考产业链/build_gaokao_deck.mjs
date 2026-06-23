import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile, FileBlob } from "/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/@oai+artifact-tool@file+local-deps+-oai-artifact-tool-oai-artifact_tool-2.8.11.tgz/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const topic = "高考产业链";
const outDir = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260619-高考产业链";
const imgDir = path.join(outDir, "高清图片");
const assetDir = path.join(outDir, "assets");
const finalPptx = path.join(outDir, `${topic}研究.pptx`);
const inspectPath = path.join(outDir, `${topic}研究.pptx.inspect.ndjson`);

await fs.mkdir(imgDir, { recursive: true });

const W = 1920;
const H = 1080;
const bg = "#f2f2f2";
const brown = "#32231f";
const blue = "#0b4ca3";
const mint = "#b9d5cf";
const mintLight = "#dbece7";
const textColor = "#332824";
const muted = "#6f6864";
const line = "#aaa5a0";
const font = "Arial";

async function writeBlob(file, blob) {
  await fs.writeFile(file, new Uint8Array(await blob.arrayBuffer()));
}

async function image(slide, file, position, opts = {}) {
  const bytes = await fs.readFile(path.join(assetDir, file));
  const blob = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return slide.images.add({
    blob,
    contentType: "image/png",
    alt: opts.alt ?? "高考主题图片",
    fit: opts.fit ?? "cover",
    position,
    geometry: opts.geometry ?? "rect",
    borderRadius: opts.borderRadius,
  });
}

function shape(slide, geometry, position, fill, extra = {}) {
  return slide.shapes.add({
    geometry,
    position,
    fill,
    line: { fill: extra.lineFill ?? fill, width: extra.lineWidth ?? 0 },
    ...extra,
  });
}

function text(slide, value, position, style = {}) {
  const s = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  s.text = value;
  s.text.style = {
    typeface: font,
    fontSize: 26,
    color: textColor,
    ...style,
  };
  return s;
}

function templateChrome(slide, type = 0) {
  slide.background.fill = bg;
  if (type === 0) {
    shape(slide, "ellipse", { left: -150, top: 740, width: 440, height: 440 }, brown);
    shape(slide, "ellipse", { left: 1540, top: -120, width: 390, height: 360 }, mint);
  } else if (type === 1) {
    shape(slide, "ellipse", { left: 1600, top: 700, width: 430, height: 430 }, brown);
    shape(slide, "ellipse", { left: -85, top: -120, width: 310, height: 300 }, mint);
  } else if (type === 2) {
    shape(slide, "ellipse", { left: -160, top: 365, width: 390, height: 390 }, brown);
    shape(slide, "ellipse", { left: 1665, top: 860, width: 320, height: 320 }, blue);
  } else {
    shape(slide, "ellipse", { left: 1610, top: -150, width: 395, height: 395 }, brown);
    shape(slide, "ellipse", { left: -130, top: 820, width: 330, height: 330 }, blue);
  }
}

function header(slide, title, subtitle = "", page = "") {
  text(slide, title, { left: 205, top: 105, width: 980, height: 80 }, {
    fontSize: 46,
    bold: true,
    color: textColor,
  });
  if (subtitle) {
    text(slide, subtitle, { left: 208, top: 198, width: 1120, height: 42 }, {
      fontSize: 23,
      color: muted,
    });
  }
  if (page) {
    text(slide, page, { left: 1618, top: 108, width: 120, height: 70 }, {
      fontSize: 54,
      bold: true,
      color: blue,
      align: "center",
    });
  }
}

function footer(slide, page, source = "资料：教育考试网 / 阳光高考 / 教育部，访问日期 2026-06-19") {
  text(slide, source, { left: 190, top: 1010, width: 1180, height: 28 }, {
    fontSize: 15,
    color: "#8a8582",
  });
  if (page) {
    text(slide, String(page).padStart(2, "0"), { left: 1715, top: 987, width: 80, height: 45 }, {
      fontSize: 32,
      bold: true,
      color: blue,
      align: "center",
    });
  }
}

function bullet(slide, items, x, y, w, opts = {}) {
  const size = opts.size ?? 25;
  const gap = opts.gap ?? 70;
  items.forEach((item, i) => {
    shape(slide, "ellipse", { left: x, top: y + i * gap + 13, width: 11, height: 11 }, blue);
    text(slide, item, { left: x + 30, top: y + i * gap, width: w - 30, height: gap - 5 }, {
      fontSize: size,
      color: textColor,
    });
  });
}

function smallLabel(slide, label, x, y, color = blue) {
  shape(slide, "roundRect", { left: x, top: y, width: 170, height: 38 }, color, { borderRadius: "rounded-xl" });
  text(slide, label, { left: x + 14, top: y + 8, width: 142, height: 22 }, {
    fontSize: 18,
    bold: true,
    color: "#ffffff",
    align: "center",
  });
}

function card(slide, x, y, w, h, title, body, fill = "#ffffff") {
  shape(slide, "roundRect", { left: x, top: y, width: w, height: h }, fill, {
    lineFill: "#d4cfca",
    lineWidth: 1,
    borderRadius: "rounded-xl",
  });
  text(slide, title, { left: x + 28, top: y + 24, width: w - 56, height: 38 }, {
    fontSize: 28,
    bold: true,
    color: blue,
  });
  text(slide, body, { left: x + 28, top: y + 75, width: w - 56, height: h - 88 }, {
    fontSize: 21,
    color: muted,
  });
}

const p = Presentation.create({ slideSize: { width: W, height: H } });

// 01 Cover, very close to source slide 1.
{
  const slide = p.slides.add();
  templateChrome(slide, 0);
  smallLabel(slide, "高考专题", 1530, 80);
  text(slide, "高考产业链", { left: 210, top: 255, width: 690, height: 145 }, {
    fontSize: 70,
    bold: true,
  });
  text(slide, "从备考、考务、志愿填报到高校录取", { left: 215, top: 425, width: 780, height: 45 }, {
    fontSize: 27,
    color: muted,
  });
  text(slide, "规则可信 · 信息匹配 · 家庭决策", { left: 215, top: 520, width: 720, height: 45 }, {
    fontSize: 30,
    bold: true,
    color: blue,
  });
  await image(slide, "gaokao-exam-room.png", { left: 1160, top: 420, width: 480, height: 300 }, {
    geometry: "roundRect",
    borderRadius: "rounded-3xl",
  });
}

// 02 Contents.
{
  const slide = p.slides.add();
  templateChrome(slide, 1);
  header(slide, "Table of contents", "按原模板目录页的五点布局，压缩高考产业链叙事。", "02");
  const items = [
    ["01", "产业链全景", "看清从学习到录取的主链路"],
    ["02", "上游资源", "课程、规则、数据和安全系统"],
    ["03", "中游交付", "备考、考务、志愿服务"],
    ["04", "价值分配", "学习效率与信息匹配"],
    ["05", "风险边界", "焦虑营销与录取承诺"],
  ];
  items.forEach((it, i) => {
    const x = [360, 760, 1160, 560, 960][i];
    const y = i < 3 ? 355 : 610;
    text(slide, it[0], { left: x, top: y, width: 100, height: 52 }, { fontSize: 40, bold: true, color: blue, align: "center" });
    text(slide, it[1], { left: x - 90, top: y + 68, width: 280, height: 35 }, { fontSize: 25, bold: true, align: "center" });
    text(slide, it[2], { left: x - 120, top: y + 110, width: 340, height: 45 }, { fontSize: 17, color: muted, align: "center" });
  });
  footer(slide, 2);
}

// 03 Section divider matching source slide 5.
{
  const slide = p.slides.add();
  templateChrome(slide, 1);
  text(slide, "01", { left: 1120, top: 360, width: 170, height: 90 }, { fontSize: 62, bold: true, color: blue, align: "center" });
  text(slide, "产业链全景", { left: 730, top: 455, width: 600, height: 80 }, { fontSize: 50, bold: true, align: "right" });
  text(slide, "高考不是两天考试，而是一套长周期选拔与信息匹配系统。", { left: 720, top: 555, width: 620, height: 48 }, { fontSize: 22, color: muted, align: "right" });
}

// 04 Two-column definition, matching source slide 6.
{
  const slide = p.slides.add();
  templateChrome(slide, 3);
  header(slide, "高考产业链定义", "围绕规则、评价、信息和升学结果展开。", "04");
  text(slide, "高考产业链不是只有“考生考试”这一天，而是从高中学习、报名资格、命题考务、评卷成绩、志愿填报，到高校录取和入学衔接的连续系统。", { left: 250, top: 385, width: 610, height: 230 }, { fontSize: 26, color: textColor });
  text(slide, "它的核心价值来自规则可信、评价标准、信息匹配和升学结果。越靠近录取，越需要清晰的服务边界：提供辅助决策，但不能承诺录取结果。", { left: 1000, top: 385, width: 610, height: 230 }, { fontSize: 26, color: textColor });
  footer(slide, 4);
}

// 05 Chain overview with stronger template-style spacing.
{
  const slide = p.slides.add();
  templateChrome(slide, 0);
  header(slide, "产业链全景", "从学习资源到录取结果，信息在每个节点被重新加工。", "05");
  const steps = ["高中教学\n备考资源", "报名资格\n考试组织", "命题制卷\n考务安保", "阅卷成绩\n分数位次", "志愿填报\n招生匹配", "高校录取\n入学衔接"];
  steps.forEach((s, i) => {
    const x = 138 + i * 282;
    shape(slide, "roundRect", { left: x, top: 420, width: 225, height: 145 }, i % 2 ? "#ffffff" : mintLight, {
      lineFill: "#d1cdca",
      lineWidth: 1,
      borderRadius: "rounded-xl",
    });
    text(slide, s, { left: x + 18, top: 455, width: 190, height: 78 }, { fontSize: 25, bold: true, align: "center" });
    if (i < steps.length - 1) text(slide, "→", { left: x + 232, top: 455, width: 55, height: 60 }, { fontSize: 42, bold: true, color: blue });
  });
  text(slide, "底层支撑：政策规则、考试安全、招生计划、院校专业数据、技术系统、家庭决策", { left: 265, top: 700, width: 1290, height: 50 }, { fontSize: 27, bold: true, align: "center" });
  footer(slide, 5);
}

// 06 Big photo slide, matching source slide 17.
{
  const slide = p.slides.add();
  slide.background.fill = bg;
  await image(slide, "gaokao-exam-room.png", { left: 0, top: 0, width: 1920, height: 1080 });
  shape(slide, "ellipse", { left: 520, top: -250, width: 460, height: 460 }, brown);
  shape(slide, "ellipse", { left: 1730, top: 625, width: 430, height: 430 }, blue);
  shape(slide, "roundRect", { left: 545, top: 742, width: 520, height: 155 }, "#ffffff", { borderRadius: "rounded-md" });
  text(slide, "考试组织是高考链条的制度核心", { left: 585, top: 777, width: 445, height: 72 }, { fontSize: 34, bold: true, align: "center" });
  footer(slide, 6, "图片：AI 生成的高考考场示意图；不含真实考生身份信息");
}

// 07 Upstream resource cards.
{
  const slide = p.slides.add();
  templateChrome(slide, 1);
  header(slide, "上游：资源与规则", "教材、题库、招生规则和数据入口构成供给基础。", "07");
  card(slide, 195, 330, 360, 220, "课程与教辅", "高中课程、教材、模拟题、真题解析、校内评价。");
  card(slide, 610, 330, 360, 220, "招生规则", "报名资格、招生章程、专业限制、特殊类型招生。", mintLight);
  card(slide, 1025, 330, 360, 220, "数据资源", "招生计划、专业目录、历年分数、位次、选科要求。");
  card(slide, 1440, 330, 300, 220, "技术安全", "报名、考务、评卷、成绩和志愿系统。", mintLight);
  text(slide, "上游的关键不是“资料多”，而是准确、及时、可解释。", { left: 360, top: 690, width: 1200, height: 55 }, { fontSize: 34, bold: true, align: "center" });
  footer(slide, 7);
}

// 08 Image-left text-right, matching source slide 18.
{
  const slide = p.slides.add();
  templateChrome(slide, 2);
  await image(slide, "gaokao-volunteer-consulting.png", { left: 270, top: 255, width: 500, height: 550 }, {
    geometry: "roundRect",
    borderRadius: "rounded-3xl",
  });
  shape(slide, "ellipse", { left: 760, top: 300, width: 34, height: 34 }, blue);
  text(slide, "志愿填报：\n信息匹配环节", { left: 920, top: 320, width: 600, height: 120 }, { fontSize: 44, bold: true, align: "center" });
  text(slide, "分数、位次、专业、城市、选科限制、体检要求和家庭偏好共同决定填报策略。这里的信息密度最高，也最容易出现夸大承诺。", { left: 890, top: 505, width: 660, height: 140 }, { fontSize: 25, color: muted, align: "center" });
  footer(slide, 8, "图片：AI 生成的志愿填报咨询示意图");
}

// 09 Table page.
{
  const slide = p.slides.add();
  templateChrome(slide, 2);
  header(slide, "价值分配", "越靠近录取，信息匹配越重要，服务边界也越重要。", "09");
  const headers = ["环节", "价值来源", "商业模式"];
  const rows = [
    ["备考", "学习效率、反馈、师资", "课程、教辅、题库、硬件"],
    ["考务", "公平、公信力、安全", "公共服务与系统建设"],
    ["志愿", "数据清洗、规则理解", "工具订阅、咨询服务"],
    ["录取", "计划匹配、流程执行", "高校招生与入学服务"],
  ];
  const x0 = 250, y0 = 320, widths = [280, 560, 560], rowH = 88;
  headers.forEach((h, i) => {
    const x = x0 + widths.slice(0, i).reduce((a, b) => a + b, 0);
    shape(slide, "rect", { left: x, top: y0, width: widths[i], height: rowH }, blue, { lineFill: blue });
    text(slide, h, { left: x + 24, top: y0 + 27, width: widths[i] - 48, height: 34 }, { fontSize: 24, bold: true, color: "#ffffff" });
  });
  rows.forEach((r, ri) => r.forEach((v, ci) => {
    const x = x0 + widths.slice(0, ci).reduce((a, b) => a + b, 0);
    shape(slide, "rect", { left: x, top: y0 + rowH * (ri + 1), width: widths[ci], height: rowH }, ri % 2 ? "#ffffff" : mintLight, { lineFill: line, lineWidth: 1 });
    text(slide, v, { left: x + 24, top: y0 + rowH * (ri + 1) + 27, width: widths[ci] - 48, height: 34 }, { fontSize: 24, bold: ci === 0, color: ci === 0 ? blue : textColor });
  }));
  footer(slide, 9);
}

// 10 Stress/scenario page, matching source slide 12.
{
  const slide = p.slides.add();
  templateChrome(slide, 2);
  header(slide, "出分后的关键选择", "选择最适合的服务，而不是最焦虑的服务。", "10");
  const scenarios = [
    ["场景 1", "分数出来后，家庭不知道如何比较专业、城市和院校层次。", ["A 只看去年分数", "B 做位次与专业匹配", "C 等别人推荐"]],
    ["场景 2", "学生目标专业受选科或体检限制影响，需要快速排除风险。", ["A 忽略限制", "B 查章程和选科要求", "C 只看学校名气"]],
  ];
  scenarios.forEach((s, i) => {
    const x = 360 + i * 650;
    text(slide, s[0], { left: x, top: 320, width: 420, height: 40 }, { fontSize: 30, bold: true, align: "center" });
    text(slide, s[1], { left: x - 45, top: 380, width: 510, height: 92 }, { fontSize: 22, color: muted, align: "center" });
    s[2].forEach((opt, j) => text(slide, opt, { left: x - 10, top: 520 + j * 65, width: 450, height: 35 }, { fontSize: 24, bold: j === 1, color: j === 1 ? blue : textColor, align: "center" }));
  });
  footer(slide, 10);
}

// 11 Balance diagram, matching source slide 16.
{
  const slide = p.slides.add();
  templateChrome(slide, 2);
  header(slide, "志愿填报的平衡", "不是押一个答案，而是在约束里做匹配。", "11");
  const pairs = [
    ["专业兴趣", "城市偏好"],
    ["院校层次", "录取风险"],
    ["家庭预算", "就业预期"],
    ["选科限制", "体检要求"],
  ];
  pairs.forEach((p, i) => {
    const x = i % 2 === 0 ? 365 : 1120;
    const y = 340 + Math.floor(i / 2) * 225;
    text(slide, p[0], { left: x, top: y, width: 260, height: 40 }, { fontSize: 29, bold: true, align: "center" });
    shape(slide, "line", { left: x + 130, top: y + 70, width: 0, height: 92 }, "none", { lineFill: line, lineWidth: 2 });
    text(slide, p[1], { left: x, top: y + 160, width: 260, height: 40 }, { fontSize: 25, color: muted, align: "center" });
  });
  shape(slide, "line", { left: 700, top: 585, width: 510, height: 0 }, "none", { lineFill: line, lineWidth: 2 });
  text(slide, "匹配质量", { left: 780, top: 520, width: 360, height: 58 }, { fontSize: 42, bold: true, color: blue, align: "center" });
  footer(slide, 11);
}

// 12 Number/stat slide, matching source slide 20/21.
{
  const slide = p.slides.add();
  templateChrome(slide, 1);
  text(slide, "3", { left: 650, top: 300, width: 140, height: 90 }, { fontSize: 78, bold: true, color: blue, align: "right" });
  text(slide, "个容易被忽略的事实", { left: 790, top: 310, width: 580, height: 75 }, { fontSize: 44, bold: true });
  bullet(slide, [
    "核心不是卖课，而是规则、评价和录取匹配形成的信任体系。",
    "志愿填报不是看分数表，而是多个约束的综合匹配。",
    "越接近录取环节，越要强调服务边界：辅助决策，不承诺结果。"
  ], 500, 500, 950, { size: 28, gap: 95 });
  footer(slide, 12);
}

// 13 Technology/bars, matching source slide 22.
{
  const slide = p.slides.add();
  templateChrome(slide, 1);
  header(slide, "服务成本结构", "内容、技术、师资、获客和合规共同决定成本。", "13");
  const bars = [
    ["内容教研", 72, mint],
    ["技术系统", 64, blue],
    ["师资交付", 78, mint],
    ["获客服务", 58, blue],
    ["合规更新", 45, mint],
  ];
  bars.forEach((b, i) => {
    const y = 335 + i * 105;
    text(slide, b[0], { left: 330, top: y, width: 220, height: 35 }, { fontSize: 27, bold: true });
    shape(slide, "rect", { left: 590, top: y + 8, width: 620, height: 28 }, "#ffffff", { lineFill: line, lineWidth: 1 });
    shape(slide, "rect", { left: 590, top: y + 8, width: 620 * b[1] / 100, height: 28 }, b[2], { lineFill: b[2] });
    text(slide, `${b[1]}%`, { left: 1240, top: y - 2, width: 90, height: 38 }, { fontSize: 26, bold: true, color: blue });
    text(slide, ["课程更新与题库维护", "系统稳定与数据安全", "教师/顾问交付", "短窗口集中获客", "政策校验与投诉处理"][i], { left: 1370, top: y - 3, width: 340, height: 42 }, { fontSize: 21, color: muted });
  });
  text(slide, "注：百分比为结构示意，不代表行业统计口径。", { left: 370, top: 905, width: 860, height: 34 }, { fontSize: 20, color: muted });
  footer(slide, 13);
}

// 14 Admission photo ending, close to source photo/mockup pages.
{
  const slide = p.slides.add();
  templateChrome(slide, 0);
  await image(slide, "gaokao-admission-letter.png", { left: 260, top: 220, width: 620, height: 620 }, {
    geometry: "roundRect",
    borderRadius: "rounded-3xl",
  });
  shape(slide, "ellipse", { left: 850, top: 250, width: 42, height: 42 }, blue);
  text(slide, "Thank you", { left: 1025, top: 340, width: 560, height: 75 }, { fontSize: 62, bold: true, align: "center" });
  text(slide, "你觉得高考服务里，最值得花钱的是补课、志愿填报，还是心理支持？", { left: 945, top: 470, width: 720, height: 95 }, { fontSize: 30, color: muted, align: "center" });
  text(slide, "下一个可拆：志愿填报产业链 / 教辅出版产业链 / AI 学习硬件产业链", { left: 925, top: 640, width: 760, height: 60 }, { fontSize: 24, bold: true, color: blue, align: "center" });
  footer(slide, 14, "图片：AI 生成的录取通知书场景示意图");
}

const pptx = await PresentationFile.exportPptx(p);
await pptx.save(finalPptx);

const imported = await PresentationFile.importPptx(await FileBlob.load(finalPptx));
const snap = await imported.inspect({ kind: "slide,textbox,shape,image,table,chart,layout", maxChars: 70000 });
await fs.writeFile(inspectPath, snap.ndjson);

for (const [i, slide] of p.slides.items.entries()) {
  const png = await p.export({ slide, format: "png", scale: 2 });
  await writeBlob(path.join(imgDir, `${String(i + 1).padStart(2, "0")}-${topic}研究.png`), png);
}

const montage = await p.export({ format: "png", montage: true, scale: 1 });
await writeBlob(path.join(imgDir, "总览图.png"), montage);

console.log(JSON.stringify({ finalPptx, imgDir, slides: p.slides.items.length }, null, 2));
