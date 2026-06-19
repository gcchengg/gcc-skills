import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const outDir = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260617-手账文具产业链";
const imageDir = path.join(outDir, "高清图片");
const pptxPath = path.join(outDir, "手账文具产业链研究.pptx");
const assets = {
  flatlay: path.join(outDir, "assets/planner-flatlay.png"),
  print: path.join(outDir, "assets/print-binding.png"),
  retail: path.join(outDir, "assets/stationery-retail.png"),
};

const W = 1123;
const H = 793;
const blue = "#3C71B7";
const paleBlue = "#C6D3E5";
const yellow = "#FFEBA5";
const ink = "#203A5F";
const muted = "#6E7F9F";
const paper = "#F8FAFD";
const font = "PingFang SC";
let imageBytes = {};

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

function bg(slide, color = paper) {
  slide.background.fill = color;
}

function text(slide, value, x, y, w, h, opts = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = value;
  box.text.style = {
    typeface: font,
    fontSize: opts.size ?? 22,
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    color: opts.color ?? ink,
  };
  return box;
}

function label(slide, value, x, y, w, h, color = blue) {
  return text(slide, value, x, y, w, h, { size: 16, bold: true, color });
}

function card(slide, x, y, w, h, fill = "white", line = paleBlue) {
  return slide.shapes.add({
    geometry: "roundRect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: 1.3 },
    borderRadius: "rounded-lg",
  });
}

function grid(slide, x, y, cols, rows, cw, ch) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slide.shapes.add({
        geometry: "rect",
        position: { left: x + c * cw, top: y + r * ch, width: cw, height: ch },
        fill: "#FFFFFF",
        line: { style: "solid", fill: "#A0AFC3", width: 1.2 },
      });
    }
  }
}

function checklist(slide, items, x, y, gap = 40) {
  items.forEach((item, i) => {
    slide.shapes.add({
      geometry: "ellipse",
      position: { left: x, top: y + i * gap + 6, width: 13, height: 13 },
      fill: yellow,
      line: { style: "solid", fill: blue, width: 1 },
    });
    text(slide, item, x + 24, y + i * gap, 390, 32, { size: 19, color: ink });
  });
}

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function addImage(slide, imgKey, x, y, w, h, alt) {
  slide.images.add({
    blob: imageBytes[imgKey],
    contentType: "image/png",
    alt,
    fit: "cover",
    geometry: "roundRect",
    borderRadius: "rounded-lg",
    position: { left: x, top: y, width: w, height: h },
  });
}

function slide1(pres) {
  const slide = pres.slides.add();
  bg(slide);
  addImage(slide, "flatlay", 38, 88, 324, 560, "手账文具桌面平铺图");
  label(slide, "SUN", 420, 82, 55, 24);
  label(slide, "MON", 525, 82, 60, 24);
  label(slide, "TUE", 632, 82, 55, 24);
  label(slide, "WED", 735, 82, 60, 24);
  label(slide, "THU", 845, 82, 55, 24);
  label(slide, "FRI", 955, 82, 55, 24);
  label(slide, "SAT", 1050, 82, 55, 24);
  grid(slide, 400, 120, 7, 5, 95, 86);
  const notes = [
    ["01", "纸张"], ["03", "印刷"], ["08", "装订"], ["12", "IP"],
    ["17", "社群"], ["20", "渠道"], ["25", "库存"], ["28", "合规"],
  ];
  const cells = [[0,0],[2,0],[0,1],[4,1],[2,2],[5,2],[3,3],[6,3]];
  notes.forEach(([d, n], i) => {
    const [c, r] = cells[i];
    text(slide, d, 410 + c * 95, 130 + r * 86, 44, 18, { size: 13, color: blue });
    text(slide, n, 425 + c * 95, 166 + r * 86, 54, 24, { size: 16, bold: true, color: blue });
  });
  text(slide, "手账文具", 650, 575, 430, 72, { size: 54, bold: true, color: blue });
  text(slide, "产业链研究", 652, 650, 395, 58, { size: 38, bold: true, color: ink });
  text(slide, "纸张 · 印刷装订 · 设计/IP · 渠道社群", 650, 716, 420, 28, { size: 18, color: muted });
}

function slide2(pres) {
  const slide = pres.slides.add();
  bg(slide);
  text(slide, "2026 产业链", 45, 40, 190, 30, { size: 26, bold: true, color: blue });
  text(slide, "WEEK #1 PLANS", 410, 45, 230, 26, { size: 18, bold: true, color: blue });
  const blocks = [
    ["01 上游材料", "纸浆/特种纸/封面材料\n油墨/胶黏剂/线圈/贴纸膜材", 54, 112],
    ["02 中游制造", "版式策划/打样/印刷\n覆膜/烫金/模切/装订/组包", 346, 112],
    ["03 下游渠道", "文具店/书店/电商平台\n企业定制/手账社群/内容平台", 54, 324],
    ["04 提醒事项", "日期版 SKU 有硬季节性\n过季库存折价明显", 346, 324],
  ];
  blocks.forEach(([h, b, x, y]) => {
    card(slide, x, y, 245, 165);
    text(slide, h, x + 18, y + 18, 200, 28, { size: 21, bold: true, color: blue });
    text(slide, b, x + 18, y + 62, 205, 78, { size: 18, color: ink });
  });
  card(slide, 54, 550, 535, 130, yellow, "#EECF6B");
  text(slide, "核心判断", 78, 573, 120, 26, { size: 21, bold: true, color: ink });
  text(slide, "它不是卖纸，而是卖计划感、审美、书写体验和持续打卡。", 78, 610, 455, 48, { size: 20, bold: true, color: blue });
  addImage(slide, "flatlay", 665, 130, 160, 150, "手账材料");
  addImage(slide, "print", 890, 130, 160, 150, "印刷装订");
  addImage(slide, "retail", 735, 440, 230, 170, "文具零售与社群");
  text(slide, "HIGHLIGHTS", 735, 48, 270, 50, { size: 34, bold: true, color: blue });
  label(slide, "纸感与装订体验", 670, 304, 180, 24);
  label(slide, "设计/IP 溢价", 906, 304, 160, 24);
  label(slide, "内容社区生成需求", 750, 632, 230, 24);
}

function slide3(pres) {
  const slide = pres.slides.add();
  bg(slide);
  text(slide, "价值来源", 250, 570, 430, 62, { size: 50, bold: true, color: blue });
  grid(slide, 35, 120, 7, 5, 95, 86);
  text(slide, "DESIGN WEEK!", 250, 385, 340, 48, { size: 34, bold: true, italic: true, color: blue });
  const values = [
    ["纸感", "洇墨控制、翻页手感、厚度与书写阻尼"],
    ["装订", "能否平摊书写，是体验与复购的关键"],
    ["IP 联名", "插画师、节日主题、限定款形成审美溢价"],
    ["社群复购", "晒图、打卡、教程带动贴纸胶带追加消费"],
  ];
  values.forEach(([h, b], i) => {
    const x = i % 2 === 0 ? 760 : 900;
    const y = i < 2 ? 105 : 405;
    addImage(slide, i < 2 ? "flatlay" : i === 2 ? "print" : "retail", x, y, 138, 130, h);
    text(slide, h, x - 12, y + 142, 160, 24, { size: 18, bold: true, color: blue });
    text(slide, b, x - 18, y + 170, 170, 58, { size: 15, color: ink });
  });
  text(slide, "一本文具手账的价值，不在纸价本身，而在“材料体验 + 版式设计 + IP 审美 + 社群内容”的叠加。", 60, 672, 610, 42, { size: 21, bold: true, color: ink });
}

function slide4(pres) {
  const slide = pres.slides.add();
  bg(slide, yellow);
  text(slide, "风险与合规", 365, 70, 390, 56, { size: 40, bold: true, color: ink });
  text(slide, "纸品、文具和儿童使用场景需要提前准备认证、材料与授权文件。", 285, 130, 560, 24, { size: 18, color: ink });
  card(slide, 80, 210, 455, 405, "#FFF7CC", "#E7C96C");
  card(slide, 590, 210, 455, 405, "#FFF7CC", "#E7C96C");
  text(slide, "SUPPLY RISKS", 115, 240, 260, 28, { size: 24, bold: true, color: blue });
  checklist(slide, [
    "原纸与包装材料价格波动",
    "日期版库存过季折价",
    "平台低价款压缩品牌溢价",
    "小批量补货不及时会错过热度",
  ], 115, 300, 58);
  text(slide, "COMPLIANCE", 625, 240, 260, 28, { size: 24, bold: true, color: blue });
  checklist(slide, [
    "FSC / PEFC 产销监管链",
    "REACH 化学品限制",
    "儿童文具安全要求",
    "字体、插画、IP 授权",
  ], 625, 300, 58);
  text(slide, "SOURCE: FSC / PEFC / ECHA / NRF", 420, 700, 300, 18, { size: 13, bold: true, color: blue });
}

function slide5(pres) {
  const slide = pres.slides.add();
  bg(slide, yellow);
  text(slide, "发版摘要", 385, 150, 360, 58, { size: 44, bold: true, color: blue });
  text(slide, "一本文具手账，背后是纸张、印刷装订、设计/IP、渠道和内容社区共同驱动的轻制造消费链。", 185, 230, 760, 50, { size: 24, bold: true, color: ink });
  card(slide, 180, 325, 760, 86, "#FFFFFF", "#E7C96C");
  text(slide, "小红书标题：一本文具手账，背后竟然是一条完整产业链", 220, 352, 690, 30, { size: 22, bold: true, color: blue });
  text(slide, "#产业链拆解 #手账 #文具控 #效率工具 #纸品设计 #供应链", 215, 450, 720, 28, { size: 22, color: ink });
  text(slide, "评论引导：你买手账本最看重纸感、版式、封面、IP，还是能不能平摊书写？", 190, 510, 760, 34, { size: 21, color: ink });
  text(slide, "纸感 + 版式 + IP + 社群", 355, 610, 420, 36, { size: 26, bold: true, italic: true, color: blue });
}

async function main() {
  await fs.mkdir(imageDir, { recursive: true });
  imageBytes = {
    flatlay: await readImageBlob(assets.flatlay),
    print: await readImageBlob(assets.print),
    retail: await readImageBlob(assets.retail),
  };
  const pres = Presentation.create({ slideSize: { width: W, height: H } });
  slide1(pres);
  slide2(pres);
  slide3(pres);
  slide4(pres);
  slide5(pres);

  for (const [index, slide] of pres.slides.items.entries()) {
    const stem = `${String(index + 1).padStart(2, "0")}-手账文具产业链`;
    const png = await pres.export({ slide, format: "png", scale: 4 });
    await writeBlob(path.join(imageDir, `${stem}.png`), png);
  }
  const montage = await pres.export({ format: "png", montage: true, scale: 2 });
  await writeBlob(path.join(imageDir, "总览图.png"), montage);
  const pptx = await PresentationFile.exportPptx(pres);
  await pptx.save(pptxPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
