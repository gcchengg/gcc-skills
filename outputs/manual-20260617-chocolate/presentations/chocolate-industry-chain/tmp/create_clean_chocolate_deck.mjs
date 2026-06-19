import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const topicDir = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260617-巧克力产业链";
const workspace = "/Users/apple/Documents/GitHub/gcc-skills/outputs/manual-20260617-chocolate/presentations/chocolate-industry-chain/tmp";
const finalPptx = path.join(topicDir, "巧克力产业链研究.pptx");
const previewDir = path.join(workspace, "preview", "clean");
const layoutDir = path.join(workspace, "layout", "clean");
const orange = "#b63a19";
const cream = "#f4eee4";
const white = "#ffffff";
const brown = "#4b2416";
const assets = {
  cacao: path.join(workspace, "assets", "cacao-pods.png"),
  factory: path.join(workspace, "assets", "chocolate-factory.png"),
  products: path.join(workspace, "assets", "chocolate-products.png"),
};

function addText(slide, text, position, opts = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = text;
  box.text.style = {
    typeface: opts.typeface || "Arial",
    fontSize: opts.fontSize || 24,
    color: opts.color || white,
    bold: opts.bold || false,
    italic: opts.italic || false,
  };
  return box;
}

function bg(slide, fill = orange) {
  slide.background.fill = fill;
  addText(slide, "每日产业链", { left: 24, top: 682, width: 160, height: 24 }, { fontSize: 14, color: white });
  addText(slide, "巧克力产业链研究", { left: 1040, top: 22, width: 210, height: 44 }, { fontSize: 18, color: white, bold: true });
}

async function addImage(slide, file, position) {
  slide.images.add({
    blob: await fs.readFile(file),
    contentType: "image/png",
    alt: "Chocolate industry visual",
    position,
    fit: "cover",
    geometry: "roundRect",
    borderRadius: "rounded-3xl",
  });
}

function card(slide, title, body, x, y, w = 360, h = 150) {
  slide.shapes.add({
    geometry: "roundRect",
    position: { left: x, top: y, width: w, height: h },
    fill: "#ffffff20",
    line: { style: "solid", fill: "#ffffff50", width: 1 },
    borderRadius: "rounded-2xl",
  });
  addText(slide, title, { left: x + 24, top: y + 20, width: w - 48, height: 32 }, { fontSize: 24, bold: true });
  addText(slide, body, { left: x + 24, top: y + 62, width: w - 48, height: h - 80 }, { fontSize: 18 });
}

function divider(p, n, title) {
  const s = p.slides.add();
  bg(s, cream);
  addText(s, n, { left: 70, top: 70, width: 200, height: 90 }, { fontSize: 72, color: orange, italic: true });
  addText(s, title, { left: 430, top: 450, width: 780, height: 90 }, { fontSize: 46, color: orange });
}

const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });

let s = p.slides.add();
bg(s);
await addImage(s, assets.cacao, { left: 28, top: 28, width: 390, height: 455 });
addText(s, "巧克力产业链｜\n2026.06.17", { left: 515, top: 382, width: 700, height: 190 }, { fontSize: 64, bold: true });
addText(s, "从可可种植、贸易加工到品牌零售与食品工业应用", { left: 515, top: 585, width: 610, height: 36 }, { fontSize: 22 });

s = p.slides.add();
bg(s);
addText(s, "目录", { left: 72, top: 54, width: 220, height: 70 }, { fontSize: 48, bold: true });
["01 核心理解", "02 产业链全景", "03 上游：可可来源", "04 中游：加工制造", "05 下游：品牌与应用", "06 流动与定价权", "07 价值与壁垒", "08 风险与趋势"].forEach((item, i) => {
  addText(s, item, { left: 110 + (i % 2) * 520, top: 155 + Math.floor(i / 2) * 96, width: 430, height: 42 }, { fontSize: 30 });
});

s = p.slides.add();
bg(s);
addText(s, "一块巧克力，是一条全球供应链", { left: 54, top: 52, width: 760, height: 74 }, { fontSize: 44, bold: true });
addText(s, "它把热带地区的可可豆，通过发酵、干燥、贸易、研磨、压榨、精炼、调温和品牌化，转化为零食、礼品、烘焙原料、饮品配料和食品工业原料。", { left: 60, top: 440, width: 740, height: 120 }, { fontSize: 26 });
await addImage(s, assets.products, { left: 850, top: 130, width: 350, height: 420 });

divider(p, "01.", "产业链全景");

s = p.slides.add();
bg(s, cream);
addText(s, "从可可豆到消费场景", { left: 60, top: 60, width: 760, height: 60 }, { fontSize: 40, color: orange, bold: true });
addText(s, "可可种植与采收 → 发酵干燥与分级 → 合作社/贸易商 → 仓储运输 → 研磨压榨 → 可可液块/可可脂/可可粉 → 工业巧克力 → 品牌包装与渠道 → 零售、餐饮、烘焙和食品工业应用", { left: 70, top: 190, width: 1120, height: 190 }, { fontSize: 28, color: brown });
card(s, "关键判断", "每个环节都在把“不稳定农产品”转化为“稳定可交付的风味、口感、配方和品牌体验”。", 70, 450, 1040, 130);

divider(p, "02.", "上游与中游");

s = p.slides.add();
bg(s);
addText(s, "两类核心能力", { left: 56, top: 54, width: 520, height: 60 }, { fontSize: 42, bold: true });
card(s, "上游｜可可来源", "种植、采收、发酵、干燥决定风味基础；价值来自产地风味、批次稳定和可追溯。", 80, 180, 500, 190);
card(s, "中游｜加工制造", "研磨压榨形成液块、可可脂和可可粉；工业巧克力提供配方、融点和流变性。", 700, 180, 500, 190);
addText(s, "共同风险：天气、病害、农户收益、食品安全、套保能力和客户认证。", { left: 120, top: 500, width: 960, height: 42 }, { fontSize: 28 });

divider(p, "03.", "流动与定价权");

s = p.slides.add();
bg(s);
addText(s, "四种流动决定利润分配", { left: 58, top: 54, width: 720, height: 60 }, { fontSize: 42, bold: true });
card(s, "货物与服务流", "可可豆跨境进入加工厂，再转为原料和终端产品。", 70, 150);
card(s, "信息流", "终端口味、价格接受度和合规要求向上游传导。", 460, 150);
card(s, "资金流", "合同、库存和套保贯穿贸易与加工环节。", 850, 150);
card(s, "定价权", "短期受可可豆供需和期货价格影响，品牌端再选择提价、缩规格或调配方。", 265, 390, 750, 160);

divider(p, "04.", "价值与壁垒");

s = p.slides.add();
bg(s);
addText(s, "价值不是只在“做甜食”", { left: 60, top: 54, width: 760, height: 60 }, { fontSize: 42, bold: true });
card(s, "价值增加", "原料豆变成稳定可用的可可制品；工业巧克力变成适配不同产品的配方。", 70, 150, 540, 180);
card(s, "核心壁垒", "稳定产地网络、可追溯可可豆、发酵焙炒工艺、食品安全认证和品牌渠道。", 670, 150, 540, 180);
card(s, "弱势环节", "分散农户、小型收购商和同质化代工，通常缺少议价能力和风控能力。", 370, 410, 540, 160);

s = p.slides.add();
bg(s);
addText(s, "关键数据", { left: 60, top: 58, width: 300, height: 60 }, { fontSize: 44, bold: true });
addText(s, "ICCO 2026.05｜2025/26 年度预测", { left: 60, top: 130, width: 540, height: 34 }, { fontSize: 22 });
card(s, "4.84 百万吨", "预计全球可可豆产量", 80, 250, 330, 150);
card(s, "4.743 百万吨", "预计全球可可研磨量", 475, 250, 330, 150);
card(s, "1.353 百万吨", "预计期末库存", 870, 250, 330, 150);
addText(s, "注：数据来自 International Cocoa Organization 2026 年 5 月季度公报。", { left: 90, top: 520, width: 980, height: 36 }, { fontSize: 22 });

divider(p, "05.", "风险与趋势");

s = p.slides.add();
bg(s);
addText(s, "四类风险需要持续跟踪", { left: 58, top: 54, width: 720, height: 60 }, { fontSize: 42, bold: true });
card(s, "供应链", "西非主产区天气、病害、农户收益和港口/融资扰动。", 70, 150);
card(s, "需求与周期", "高价格可能传导为涨价、缩小规格、可可含量调整或替代。", 460, 150);
card(s, "技术与质量", "发酵干燥、焙炒曲线、流变性和食品安全影响客户使用。", 850, 150);
card(s, "政策合规", "EUDR 将可可纳入无毁林尽调范围，抬高产地数据和供应商管理门槛。", 265, 390, 750, 160);

s = p.slides.add();
bg(s, cream);
addText(s, "三个容易被忽略的事实", { left: 60, top: 58, width: 760, height: 60 }, { fontSize: 42, color: orange, bold: true });
["可可豆不是普通农产品，采后发酵直接决定风味上限。", "工业巧克力商不只卖原料，也卖稳定配方、应用研发和客户认证能力。", "巧克力涨价不一定只看标价，也可能体现为规格变小、可可含量调整或替代配方。"].forEach((t, i) => {
  addText(s, `${i + 1}. ${t}`, { left: 90, top: 180 + i * 115, width: 980, height: 70 }, { fontSize: 28, color: brown });
});

s = p.slides.add();
bg(s, cream);
addText(s, "资料来源", { left: 60, top: 58, width: 420, height: 60 }, { fontSize: 42, color: orange, bold: true });
addText(s, "International Cocoa Organization｜May 2026 Quarterly Bulletin of Cocoa Statistics\nEuropean Commission｜Deforestation Regulation implementation\nWorld Cocoa Foundation｜cocoa sustainability context\nBarry Callebaut｜industrial chocolate applications\n\n完整底稿：产业链研究底稿.md", { left: 80, top: 160, width: 1030, height: 360 }, { fontSize: 24, color: brown });

s = p.slides.add();
bg(s, cream);
addText(s, "谢谢", { left: 60, top: 60, width: 420, height: 88 }, { fontSize: 70, color: orange, bold: true });
addText(s, "巧克力产业链研究\n生成日期：2026-06-17\n基于公开资料与产业链研究底稿整理", { left: 70, top: 230, width: 540, height: 140 }, { fontSize: 26, color: orange, bold: true });
addText(s, "CREDITS: Template visual direction follows Slidesgo Work-Life Integration style. Original Slidesgo template credits should be retained when reusing template assets.", { left: 70, top: 510, width: 900, height: 60 }, { fontSize: 16, color: orange });

await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(layoutDir, { recursive: true });
for (const [index, slide] of p.slides.items.entries()) {
  const num = String(index + 1).padStart(2, "0");
  await fs.writeFile(path.join(previewDir, `slide-${num}.png`), Buffer.from(await (await p.export({ slide, format: "png", scale: 1.5 })).arrayBuffer()));
  await fs.writeFile(path.join(layoutDir, `slide-${num}.layout.json`), await (await slide.export({ format: "layout" })).text());
}
await fs.writeFile(path.join(workspace, "clean-contact-sheet.png"), Buffer.from(await (await p.export({ format: "png", montage: true, scale: 1 })).arrayBuffer()));
await fs.mkdir(topicDir, { recursive: true });
await (await PresentationFile.exportPptx(p)).save(finalPptx);
console.log(JSON.stringify({ finalPptx, slideCount: p.slides.items.length }, null, 2));
