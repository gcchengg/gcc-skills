import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const outDir = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260618-企业级SaaS软件产业链";
const imageDir = path.join(outDir, "高清图片");
const pptxPath = path.join(outDir, "企业级SaaS软件产业链研究.pptx");
const W = 1920;
const H = 1080;
const bg = "#1B0D39";
const purple = "#A477FF";
const light = "#F9F6FF";
const lavender = "#D8C6FF";
const mid = "#6E48D7";
const muted = "#BDAAF2";
const font = "PingFang SC";

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

function addText(slide, value, x, y, w, h, opts = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    typeface: font,
    fontSize: opts.size ?? 34,
    bold: opts.bold ?? false,
    color: opts.color ?? light,
    italic: opts.italic ?? false,
  };
  return shape;
}

function footer(slide) {
  addText(slide, "企业级 SaaS 软件产业链研究", 40, 1010, 520, 30, { size: 20, color: muted });
}

function bgSlide(slide, color = bg) {
  slide.background.fill = color;
}

function blob(slide, x, y, w, h, color = purple, opacity = 1) {
  slide.shapes.add({
    geometry: "arc",
    position: { left: x, top: y, width: w, height: h },
    fill: color,
    line: { style: "solid", fill: "none", width: 0 },
    opacity,
  });
}

function card(slide, x, y, w, h, fill = "#241249", line = "#4D2EA0") {
  slide.shapes.add({
    geometry: "roundRect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: 1.5 },
    borderRadius: "rounded-lg",
  });
}

function pill(slide, value, x, y, w, color = purple) {
  slide.shapes.add({
    geometry: "roundRect",
    position: { left: x, top: y, width: w, height: 48 },
    fill: color,
    line: { style: "solid", fill: "none", width: 0 },
    borderRadius: "rounded-full",
  });
  addText(slide, value, x + 20, y + 11, w - 40, 24, { size: 20, bold: true, color: bg });
}

function sectionTitle(slide, title, subtitle = "") {
  addText(slide, title, 60, 70, 950, 92, { size: 56, bold: true, color: purple });
  if (subtitle) addText(slide, subtitle, 62, 160, 900, 42, { size: 25, color: muted });
}

function bullets(slide, items, x, y, w, gap = 58, size = 28, color = light) {
  items.forEach((item, i) => {
    slide.shapes.add({
      geometry: "ellipse",
      position: { left: x, top: y + i * gap + 10, width: 15, height: 15 },
      fill: purple,
      line: { style: "solid", fill: "none", width: 0 },
    });
    addText(slide, item, x + 34, y + i * gap, w - 34, 44, { size, color });
  });
}

function slide1(p) {
  const s = p.slides.add(); bgSlide(s);
  blob(s, -220, 90, 680, 680, "#6E48D7", 0.85);
  blob(s, 85, 190, 480, 480, "#A477FF", 0.75);
  card(s, 1120, 110, 640, 760, "#241249", "#3A1F75");
  addText(s, "SAAS CHAIN", 1220, 156, 360, 48, { size: 26, bold: true, color: lavender });
  addText(s, "企业级 SaaS 软件\n产业链研究", 1220, 300, 560, 240, { size: 68, bold: true, color: light });
  addText(s, "从云基础设施、软件工程到客户成功与订阅续约", 1220, 700, 520, 42, { size: 26, color: muted });
  addText(s, "2026-06-18", 1580, 970, 240, 28, { size: 22, color: muted });
}

function slide2(p) {
  const s = p.slides.add(); bgSlide(s, "#7B4BEE");
  addText(s, "Overview", 70, 430, 520, 100, { size: 66, bold: true, color: light });
  const items = ["一句话理解", "客户与需求", "挑战与方案", "SaaS 如何工作", "竞争与替代", "客户成功", "实施时间线", "价值与收费", "下一步"];
  items.forEach((item, i) => {
    addText(s, String(i + 1).padStart(2, "0"), 1110, 110 + i * 90, 70, 40, { size: 30, bold: true, color: bg });
    addText(s, item, 1210, 107 + i * 90, 560, 42, { size: 31, color: bg });
  });
}

function slide3(p) {
  const s = p.slides.add(); bgSlide(s);
  card(s, 80, 280, 720, 470, "#0E071F", "#3A1F75");
  addText(s, "SaaS ≠ 代码上云", 960, 300, 780, 80, { size: 56, bold: true, color: purple });
  addText(s, "企业级 SaaS 卖的是持续可用、可升级、可集成、可审计的业务系统。它把云资源、软件工程、业务流程、安全合规和客户成功封装为订阅服务。", 960, 450, 770, 160, { size: 30, color: light });
  pill(s, "云资源", 140, 360, 160);
  pill(s, "业务流程", 330, 450, 190);
  pill(s, "安全合规", 520, 540, 190);
  pill(s, "客户成功", 240, 625, 190);
  footer(s);
}

function slide4(p) {
  const s = p.slides.add(); bgSlide(s);
  sectionTitle(s, "客户与需求", "企业客户买的是流程落地、权限清楚、审计可查、系统可集成");
  const blocks = [
    ["核心用户", "业务部门、IT、安全、采购、法务、管理层"],
    ["需求来源", "流程线上化、远程协作、数据可视化、合规审计"],
    ["最终产品", "CRM、ERP、HRM、财务、协同、BI、安全、垂直 SaaS"],
  ];
  blocks.forEach(([h, b], i) => {
    card(s, 80 + i * 590, 345, 510, 330);
    addText(s, h, 120 + i * 590, 390, 430, 50, { size: 34, bold: true, color: purple });
    addText(s, b, 120 + i * 590, 475, 410, 120, { size: 28, color: light });
  });
  footer(s);
}

function slide5(p) {
  const s = p.slides.add(); bgSlide(s);
  sectionTitle(s, "挑战与方案");
  const left = ["云成本与供应商锁定", "开源依赖与供应链漏洞", "企业安全审查周期长"];
  const right = ["云成本治理与可观测性", "SBOM、扫描、发布治理", "权限、审计、加密、合规材料"];
  addText(s, "挑战", 250, 265, 200, 42, { size: 34, bold: true, color: purple });
  addText(s, "方案", 1270, 265, 200, 42, { size: 34, bold: true, color: purple });
  bullets(s, left, 170, 390, 620, 105, 28);
  bullets(s, right, 1080, 390, 650, 105, 28);
  s.shapes.add({ geometry: "line", position: { left: 960, top: 300, width: 0, height: 520 }, line: { style: "solid", fill: "#4D2EA0", width: 3 } });
  footer(s);
}

function slide6(p) {
  const s = p.slides.add(); bgSlide(s);
  sectionTitle(s, "SaaS 如何工作", "从产品研发到客户成功，是持续运营而不是一次性交付");
  const steps = [
    ["Step 1", "云基础设施与数据底座"],
    ["Step 2", "产品研发、多租户与权限模型"],
    ["Step 3", "实施集成、迁移与培训"],
    ["Step 4", "客户成功、续约与扩容"],
  ];
  steps.forEach(([n, t], i) => {
    card(s, 780, 240 + i * 180, 900, 105, "#211044", "#4D2EA0");
    addText(s, n, 815, 270 + i * 180, 150, 30, { size: 24, bold: true, color: purple });
    addText(s, t, 1010, 265 + i * 180, 600, 38, { size: 31, color: light });
  });
  blob(s, 80, 480, 360, 360, purple, 0.75);
  blob(s, 170, 565, 260, 260, mid, 0.85);
  footer(s);
}

function slide7(p) {
  const s = p.slides.add(); bgSlide(s);
  sectionTitle(s, "竞争与替代");
  const headers = ["关键维度", "传统软件/项目制", "企业级 SaaS"];
  const rows = [
    ["部署方式", "本地部署/项目交付", "在线订阅/持续升级"],
    ["成本结构", "前期投入高", "按席位/模块/用量"],
    ["迭代速度", "升级慢", "持续发布"],
    ["安全审计", "客户自管为主", "厂商与客户共同治理"],
    ["价值来源", "功能交付", "使用率、续约、生态"],
  ];
  const table = s.tables.add({ rows: 6, columns: 3, left: 90, top: 260, width: 1740, height: 520, values: [headers, ...rows] });
  table.styleOptions = { headerRow: true, bandedRows: true };
  table.cells.block({ row: 1, column: 0, rowCount: 5, columnCount: 3 }).assign({ fill: "#241249", textStyle: { color: light, typeface: font, fontSize: 18 } });
  table.cells.block({ row: 0, column: 0, rowCount: 1, columnCount: 3 }).assign({ fill: purple, textStyle: { bold: true, color: bg, typeface: font, fontSize: 19 } });
  footer(s);
}

function slide8(p) {
  const s = p.slides.add(); bgSlide(s);
  sectionTitle(s, "客户成功决定续约", "续约比新签更能反映产品真实价值");
  const cards = [
    ["业务部门", "看流程是否真的跑起来，报表是否可用。"],
    ["IT / 安全", "看权限、审计、集成、备份和风险响应。"],
    ["采购 / 财务", "看合同、用量、续费、扩容和 ROI 证据。"],
  ];
  cards.forEach(([h, b], i) => {
    card(s, 100 + i * 600, 350, 500, 360, "#25124D", "#4D2EA0");
    addText(s, h, 140 + i * 600, 405, 410, 44, { size: 33, bold: true, color: purple });
    addText(s, b, 140 + i * 600, 500, 390, 130, { size: 28, color: light });
  });
  footer(s);
}

function slide9(p) {
  const s = p.slides.add(); bgSlide(s);
  sectionTitle(s, "实施时间线");
  const steps = [["Week 1", "需求确认与数据盘点"], ["Week 2", "权限、流程与安全策略"], ["Week 3", "系统集成与培训"], ["Week 4", "上线、监控与优化"]];
  s.shapes.add({ geometry: "line", position: { left: 150, top: 630, width: 1600, height: 0 }, line: { style: "solid", fill: purple, width: 5 } });
  steps.forEach(([w, t], i) => {
    const x = 150 + i * 510;
    s.shapes.add({ geometry: "ellipse", position: { left: x, top: 607, width: 46, height: 46 }, fill: purple, line: { style: "solid", fill: "none", width: 0 } });
    addText(s, w, x - 5, 515, 180, 46, { size: 32, bold: true, color: light });
    addText(s, t, x - 5, 700, 330, 70, { size: 25, color: light });
  });
  footer(s);
}

function slide10(p) {
  const s = p.slides.add(); bgSlide(s, "#A477FF");
  addText(s, "价值与收费", 570, 95, 760, 80, { size: 58, bold: true, color: bg });
  const items = ["按席位订阅", "按模块收费", "按用量计费", "企业年约", "实施服务", "生态分成"];
  items.forEach((item, i) => {
    card(s, 210 + (i % 3) * 520, 310 + Math.floor(i / 3) * 230, 420, 130, "#F9F6FF", "#D8C6FF");
    addText(s, item, 255 + (i % 3) * 520, 352 + Math.floor(i / 3) * 230, 340, 44, { size: 32, bold: true, color: bg });
  });
}

function slide11(p) {
  const s = p.slides.add(); bgSlide(s);
  sectionTitle(s, "下一步");
  const steps = [["01", "确认业务场景"], ["02", "评估安全与集成"], ["03", "试点上线"], ["04", "续约扩容"]];
  steps.forEach(([n, t], i) => {
    card(s, 160 + i * 430, 420, 300, 220);
    addText(s, n, 205 + i * 430, 465, 120, 60, { size: 56, bold: true, color: purple });
    addText(s, t, 205 + i * 430, 560, 220, 42, { size: 28, color: light });
  });
  footer(s);
}

function slide12(p) {
  const s = p.slides.add(); bgSlide(s);
  blob(s, -80, -120, 760, 760, mid, 0.65);
  addText(s, "SaaS 的壁垒\n不是上线，\n而是持续被使用。", 880, 240, 780, 300, { size: 68, bold: true, color: light });
  addText(s, "产品复用 · 安全合规 · 数据沉淀 · 客户成功 · 生态集成", 885, 660, 760, 42, { size: 27, color: muted });
  footer(s);
}

function slide13(p) {
  const s = p.slides.add(); bgSlide(s, light);
  addText(s, "资料来源与合规索引", 90, 80, 900, 68, { size: 50, bold: true, color: bg });
  bullets(s, [
    "NIST SP 800-145：云计算与 SaaS 定义",
    "CISA Secure by Design：软件厂商安全责任",
    "OWASP SCVS：软件组件与供应链安全",
    "FASB Topic 606：订阅合同与收入确认框架",
    "Cloud Security Alliance：SaaS 安全治理参考",
  ], 120, 250, 1440, 88, 30, bg);
  addText(s, "重点关注：身份权限、审计日志、数据治理、开源依赖、云成本和客户续约。", 120, 830, 1420, 44, { size: 30, bold: true, color: bg });
}

function slide14(p) {
  const s = p.slides.add(); bgSlide(s);
  addText(s, "结论", 120, 150, 480, 90, { size: 66, bold: true, color: purple });
  addText(s, "企业级 SaaS 是云基础设施、软件工程、业务流程、安全合规和客户经营共同组成的产业链。", 120, 310, 1050, 110, { size: 40, color: light });
  addText(s, "可继续拆解：云基础设施、低代码、企业安全软件、CRM、BI、AI Agent、API 集成平台。", 120, 520, 1100, 80, { size: 30, color: muted });
  addText(s, "小红书标题：SaaS 软件背后的产业链", 120, 700, 860, 48, { size: 32, bold: true, color: purple });
  addText(s, "#SaaS产业链 #企业软件 #云计算 #软件商业模式 #客户成功", 120, 780, 1120, 44, { size: 28, color: light });
}

async function main() {
  await fs.mkdir(imageDir, { recursive: true });
  const p = Presentation.create({ slideSize: { width: W, height: H } });
  [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9, slide10, slide11, slide12, slide13, slide14].forEach((fn) => fn(p));
  for (const [index, slide] of p.slides.items.entries()) {
    const stem = `${String(index + 1).padStart(2, "0")}-企业级SaaS软件产业链研究`;
    await writeBlob(path.join(imageDir, `${stem}.png`), await p.export({ slide, format: "png", scale: 2 }));
  }
  await writeBlob(path.join(imageDir, "总览图.png"), await p.export({ format: "png", montage: true, scale: 1 }));
  const pptx = await PresentationFile.exportPptx(p);
  await pptx.save(pptxPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
