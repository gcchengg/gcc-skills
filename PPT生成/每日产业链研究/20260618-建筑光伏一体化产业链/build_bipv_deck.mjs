import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, Presentation, PresentationFile } from "/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/@oai+artifact-tool@file+local-deps+-oai-artifact-tool-oai-artifact_tool-2.8.11.tgz/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const topic = "建筑光伏一体化产业链";
const outDir = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260618-建筑光伏一体化产业链";
const imgDir = path.join(outDir, "高清图片");
const finalPptx = path.join(outDir, `${topic}研究.pptx`);
const inspectPath = path.join(outDir, `${topic}研究.pptx.inspect.ndjson`);
const qaDir = "/private/tmp/codex-presentations/manual-20260618/bipv-think-green/tmp/qa";
const mediaDir = "/private/tmp/codex-presentations/manual-20260618/bipv-think-green/tmp/assets/ppt/media";

const W = 1920;
const H = 1080;
const green = "#7fb246";
const darkGreen = "#547d00";
const leaf = "#2b7a2e";
const pale = "#efefef";
const charcoal = "#1a1a1a";
const grey = "#4a5455";
const lime = "#9bd460";
const font = "DM Sans";
const heading = "DM Sans";
const black = "DM Sans";

await fs.mkdir(imgDir, { recursive: true });
await fs.mkdir(qaDir, { recursive: true });

async function writeBlob(file, blob) {
  await fs.writeFile(file, new Uint8Array(await blob.arrayBuffer()));
}

function addFrame(slide, opts = {}) {
  slide.background.fill = green;
  slide.shapes.add({
    geometry: "rect",
    position: { left: 110, top: 75, width: 1700, height: 930 },
    fill: pale,
    line: { fill: pale, width: 0 },
  });
  slide.shapes.add({
    geometry: "textbox",
    position: { left: 7, top: 890, width: 40, height: 150 },
    fill: "none",
    line: { fill: "none", width: 0 },
  }).text = "slidesmania.com";
  const brand = slide.shapes.items.at(-1);
  brand.text.style = { fontSize: 22, color: "#5e8350", typeface: font, rotation: 90 };
  if (opts.number) {
    const num = slide.shapes.add({
      geometry: "textbox",
      position: { left: 1660, top: 900, width: 110, height: 50 },
      fill: "none",
      line: { fill: "none", width: 0 },
    });
    num.text = String(opts.number).padStart(2, "0");
    num.text.style = { fontSize: 28, bold: true, color: darkGreen, typeface: black };
  }
}

async function addImage(slide, imageName, pos, opacity = 1) {
  const file = path.join(mediaDir, imageName);
  const bytes = await fs.readFile(file);
  const blob = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const contentType = imageName.toLowerCase().endsWith(".jpg") || imageName.toLowerCase().endsWith(".jpeg")
    ? "image/jpeg"
    : "image/png";
  const node = slide.images.add({
    blob,
    contentType,
    alt: "Think Green template plant asset",
    fit: "contain",
    position: pos,
  });
  if (opacity !== 1) node.opacity = opacity;
  return node;
}

function box(slide, pos, fill = "white", line = green, radius = "rounded-xl") {
  return slide.shapes.add({
    geometry: "roundRect",
    position: pos,
    fill,
    line: { fill: line, width: 2 },
    borderRadius: radius,
  });
}

function text(slide, value, pos, style = {}) {
  const s = slide.shapes.add({
    geometry: "textbox",
    position: pos,
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  s.text = value;
  s.text.style = {
    typeface: font,
    fontSize: 28,
    color: charcoal,
    ...style,
  };
  return s;
}

function title(slide, t, sub = "", no = "") {
  text(slide, t, { left: 190, top: 130, width: 980, height: 95 }, {
    typeface: heading,
    fontSize: 52,
    bold: true,
    color: charcoal,
  });
  if (sub) {
    text(slide, sub, { left: 195, top: 220, width: 1100, height: 48 }, {
      fontSize: 24,
      color: grey,
    });
  }
  if (no) {
    text(slide, no, { left: 1470, top: 120, width: 180, height: 120 }, {
      typeface: black,
      fontSize: 96,
      bold: true,
      color: green,
      align: "center",
    });
  }
}

function bullets(slide, items, x, y, w, size = 26, gap = 74) {
  items.forEach((item, i) => {
    text(slide, "♻", { left: x, top: y + i * gap, width: 45, height: 42 }, {
      fontSize: size,
      color: "#0f9f31",
      bold: true,
    });
    text(slide, item, { left: x + 55, top: y + i * gap + 2, width: w - 55, height: gap - 10 }, {
      fontSize: size,
      color: charcoal,
    });
  });
}

function smallFooter(slide, source = "资料：DOE / IEA / IEA PVPS / NREL，访问日期 2026-06-18") {
  text(slide, source, { left: 190, top: 955, width: 1250, height: 30 }, {
    fontSize: 16,
    color: "#6a6a6a",
  });
}

const p = Presentation.create({ slideSize: { width: W, height: H } });

{
  const slide = p.slides.add();
  addFrame(slide);
  text(slide, "think", { left: 330, top: 330, width: 360, height: 105 }, {
    fontSize: 108,
    color: "#000000",
  });
  text(slide, "BIPV", { left: 330, top: 470, width: 560, height: 130 }, {
    fontSize: 112,
    bold: true,
    color: darkGreen,
  });
  text(slide, "♻ 建筑会发电  ♻ 绿色外壳  ♻ 分布式能源", { left: 330, top: 710, width: 760, height: 60 }, {
    fontSize: 34,
    color: grey,
  });
  text(slide, "建筑光伏一体化产业链研究", { left: 330, top: 630, width: 780, height: 50 }, {
    fontSize: 28,
    color: charcoal,
    bold: true,
  });
  await addImage(slide, "image2.png", { left: 1190, top: 495, width: 360, height: 250 });
  await addImage(slide, "image1.png", { left: 770, top: 350, width: 110, height: 120 });
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 2 });
  title(slide, "table of\ncontents", "这套 PPT 用绿色建筑视角拆解 BIPV 的价值链。");
  const items = ["最终产品与需求", "产业链全景", "上游核心投入", "中游集成壁垒", "下游场景与商业模式", "风险与结论"];
  items.forEach((it, i) => {
    const x = i % 2 === 0 ? 220 : 920;
    const y = 350 + Math.floor(i / 2) * 155;
    text(slide, String(i + 1), { left: x, top: y, width: 52, height: 52 }, {
      fontSize: 34,
      bold: true,
      color: darkGreen,
      align: "center",
    });
    text(slide, it, { left: x + 80, top: y + 6, width: 520, height: 52 }, {
      fontSize: 34,
      color: charcoal,
    });
  });
  await addImage(slide, "image20.png", { left: 1430, top: 520, width: 220, height: 330 });
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 3 });
  title(slide, "did you\nknow?", "BIPV 的重点不只是发电效率。");
  text(slide, "BIPV 是把太阳能直接集成进建筑材料：屋面、窗户、立面、采光顶或遮阳构件。", { left: 245, top: 360, width: 1030, height: 110 }, {
    fontSize: 42,
    bold: true,
    color: charcoal,
  });
  text(slide, "它必须同时满足建筑围护、安全验收、外观设计和发电运行要求，因此产业链横跨光伏、建材、建筑工程和能源运营。", { left: 245, top: 515, width: 980, height: 150 }, {
    fontSize: 30,
    color: grey,
  });
  box(slide, { left: 1290, top: 330, width: 300, height: 300 }, "#ffffff", green);
  text(slide, "建筑外壳\n+\n发电资产", { left: 1330, top: 400, width: 220, height: 160 }, {
    fontSize: 36,
    bold: true,
    color: darkGreen,
    align: "center",
  });
  smallFooter(slide, "定义参考：U.S. DOE Solar Photovoltaic System Design Basics");
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 4 });
  title(slide, "产业链\n全景", "一条链路，两套专业语言。");
  const chain = [
    ["材料", "硅料/玻璃/胶膜/金属/电气元件"],
    ["组件", "电池片、封装、BIPV 专用部品"],
    ["建筑", "设计、结构、防水、消防、施工"],
    ["能源", "逆变、并网、储能、能管、运维"],
  ];
  chain.forEach((c, i) => {
    const x = 205 + i * 360;
    box(slide, { left: x, top: 390, width: 295, height: 210 }, i % 2 ? "#ffffff" : "#f7ffe9", green);
    text(slide, c[0], { left: x + 28, top: 420, width: 230, height: 55 }, {
      fontSize: 42,
      bold: true,
      color: darkGreen,
      align: "center",
    });
    text(slide, c[1], { left: x + 30, top: 500, width: 230, height: 90 }, {
      fontSize: 24,
      color: charcoal,
      align: "center",
    });
    if (i < chain.length - 1) {
      text(slide, "→", { left: x + 300, top: 455, width: 60, height: 60 }, {
        fontSize: 52,
        bold: true,
        color: green,
      });
    }
  });
  text(slide, "真正的价值发生在“组件产品”变成“建筑系统”的那一刻。", { left: 245, top: 725, width: 1250, height: 58 }, {
    fontSize: 34,
    bold: true,
    color: charcoal,
    align: "center",
  });
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 5 });
  title(slide, "上游：\n核心投入", "光伏材料 + 建筑材料 + 电力电子。");
  bullets(slide, [
    "晶硅链条：多晶硅、硅片、电池片、组件封装",
    "建筑材料：夹胶玻璃、金属屋面、防水层、龙骨",
    "电力电子：逆变器、汇流、线缆、监控和安全关断",
    "价值来源：效率、寿命、外观、认证和项目适配",
    "主要风险：材料波动、消防防水、跨专业协同不足",
  ], 260, 360, 1250, 30, 90);
  await addImage(slide, "image5.png", { left: 1390, top: 590, width: 220, height: 300 });
  smallFooter(slide, "制造链参考：IEA Solar PV；系统构成参考：DOE");
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 6 });
  title(slide, "中游：\n集成壁垒", "BIPV 的难点在接口管理。");
  const cards = [
    ["组件制造", "尺寸、颜色、透光率、衰减和封装可靠性"],
    ["建筑设计", "立面、荷载、防水、消防和检修通道"],
    ["工程施工", "总包、幕墙、光伏 EPC 的责任边界"],
    ["并网运维", "逆变、计量、储能、能管和安全联动"],
  ];
  cards.forEach((c, i) => {
    const x = 250 + (i % 2) * 650;
    const y = 345 + Math.floor(i / 2) * 220;
    box(slide, { left: x, top: y, width: 570, height: 155 }, "#ffffff", green);
    text(slide, c[0], { left: x + 35, top: y + 24, width: 230, height: 45 }, {
      fontSize: 34,
      bold: true,
      color: darkGreen,
    });
    text(slide, c[1], { left: x + 35, top: y + 83, width: 490, height: 55 }, {
      fontSize: 25,
      color: grey,
    });
  });
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 7 });
  title(slide, "下游：\n应用场景", "谁更适合先用 BIPV？");
  const rows = [
    ["工业厂房/园区", "屋顶大、负荷稳定、经济性更容易测算"],
    ["公共建筑", "绿色建筑评级、形象展示、低碳示范"],
    ["商业综合体", "立面审美、运营能耗、品牌低碳叙事"],
    ["交通市政", "车站、机场、停车棚、公交场站"],
  ];
  rows.forEach((r, i) => {
    const y = 330 + i * 125;
    text(slide, "♻", { left: 245, top: y, width: 55, height: 55 }, {
      fontSize: 34,
      color: "#0f9f31",
      bold: true,
    });
    text(slide, r[0], { left: 310, top: y, width: 350, height: 50 }, {
      fontSize: 32,
      bold: true,
      color: charcoal,
    });
    text(slide, r[1], { left: 680, top: y + 4, width: 780, height: 50 }, {
      fontSize: 27,
      color: grey,
    });
  });
  await addImage(slide, "image21.png", { left: 1430, top: 660, width: 170, height: 230 });
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 8 });
  text(slide, "Clearly, BIPV is not just a solar product.", { left: 270, top: 335, width: 1210, height: 80 }, {
    fontSize: 54,
    bold: true,
    color: charcoal,
    align: "center",
  });
  text(slide, "它更像是一种会发电的建筑外壳：价值来自材料替代、长期电力、绿色认证和运营数据。", { left: 310, top: 470, width: 1120, height: 135 }, {
    fontSize: 34,
    color: grey,
    align: "center",
  });
  text(slide, "― 产业链判断", { left: 690, top: 650, width: 540, height: 50 }, {
    fontSize: 28,
    color: darkGreen,
    align: "center",
  });
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 9 });
  title(slide, "价值分配", "标准组件看规模，BIPV 看集成。");
  const headers = ["环节", "价值来源", "议价关键"];
  const rows = [
    ["组件/辅材", "效率、寿命、成本", "规模与质量"],
    ["建筑部品", "外观、结构、防水", "认证与定制"],
    ["设计施工", "跨专业协调", "项目经验"],
    ["能源运营", "发电数据、消纳", "长期服务"],
  ];
  const x0 = 220, y0 = 330, widths = [300, 540, 520], rowH = 88;
  headers.forEach((h, i) => {
    box(slide, { left: x0 + widths.slice(0, i).reduce((a, b) => a + b, 0), top: y0, width: widths[i], height: rowH }, green, green, "rounded-sm");
    text(slide, h, { left: x0 + widths.slice(0, i).reduce((a, b) => a + b, 0) + 25, top: y0 + 25, width: widths[i] - 50, height: 40 }, {
      fontSize: 27,
      bold: true,
      color: "#ffffff",
    });
  });
  rows.forEach((r, ri) => {
    r.forEach((v, ci) => {
      const left = x0 + widths.slice(0, ci).reduce((a, b) => a + b, 0);
      box(slide, { left, top: y0 + rowH * (ri + 1), width: widths[ci], height: rowH }, ri % 2 ? "#ffffff" : "#f8ffed", green, "rounded-sm");
      text(slide, v, { left: left + 24, top: y0 + rowH * (ri + 1) + 25, width: widths[ci] - 45, height: 38 }, {
        fontSize: 24,
        color: ci === 0 ? darkGreen : charcoal,
        bold: ci === 0,
      });
    });
  });
  smallFooter(slide, "分析归纳：基于 DOE / IEA / NREL 资料与产业链逻辑");
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 10 });
  title(slide, "成本结构", "组件降价，不代表项目同步便宜。");
  const items = [
    ["固定成本", "研发、认证、模具、设计团队、测试平台"],
    ["可变成本", "电池片、玻璃、胶膜、逆变器、施工安装"],
    ["波动成本", "组件、玻璃、铝材、电价、融资和人工"],
    ["隐性成本", "消防、防水、结构复核、清洗检修、长期质保"],
  ];
  items.forEach((it, i) => {
    const angle = (Math.PI * 2 * i) / items.length;
    const x = 820 + Math.cos(angle) * 430;
    const y = 500 + Math.sin(angle) * 210;
    box(slide, { left: x - 185, top: y - 70, width: 370, height: 135 }, "#ffffff", green);
    text(slide, it[0], { left: x - 150, top: y - 52, width: 300, height: 40 }, {
      fontSize: 30,
      bold: true,
      color: darkGreen,
      align: "center",
    });
    text(slide, it[1], { left: x - 155, top: y - 8, width: 310, height: 60 }, {
      fontSize: 20,
      color: grey,
      align: "center",
    });
  });
  text(slide, "BIPV", { left: 720, top: 470, width: 200, height: 80 }, {
    fontSize: 52,
    bold: true,
    color: darkGreen,
    align: "center",
  });
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 11 });
  title(slide, "瓶颈与风险", "技术、建筑和收益三类风险叠加。");
  bullets(slide, [
    "供应链：标准组件成熟，不等于定制建筑部品成熟",
    "技术：阴影、热斑、弱光、衰减、防火和防水",
    "需求：建筑决策链条长，项目周期慢于普通分布式光伏",
    "合规：消防、并网、绿色建筑评价口径存在地方差异",
    "替代：传统屋顶光伏、采购绿电、储能和能效改造",
  ], 260, 350, 1230, 28, 86);
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 12 });
  title(slide, "三个容易被\n忽略的事实", "发电只是 BIPV 的一部分。");
  const facts = [
    "难点不是能不能发电，而是能不能像建筑材料一样验收、维护和质保。",
    "越早进入建筑设计阶段，越容易兼顾外观、安全和收益。",
    "最高发电量和最好建筑效果，不总是同一个方案。",
  ];
  facts.forEach((f, i) => {
    text(slide, String(i + 1), { left: 270, top: 365 + i * 165, width: 75, height: 75 }, {
      fontSize: 48,
      bold: true,
      color: "#ffffff",
      fill: green,
      align: "center",
    });
    text(slide, f, { left: 380, top: 360 + i * 165, width: 1050, height: 88 }, {
      fontSize: 31,
      color: charcoal,
    });
  });
  await addImage(slide, "image1.png", { left: 1470, top: 725, width: 130, height: 140 });
}

{
  const slide = p.slides.add();
  addFrame(slide, { number: 13 });
  title(slide, "资料来源", "用于支撑定义、系统构成和行业判断。");
  bullets(slide, [
    "U.S. DOE：BIPV 定义、系统构成、逆变和储能",
    "IEA Solar PV：光伏制造链、分布式光伏和电网挑战",
    "IEA Buildings：建筑能耗与零碳建筑背景",
    "IEA PVPS Task 15：BIPV 专项研究、消防与数字化议题",
    "NREL：光伏系统成本模型与项目经济性分析工具",
  ], 260, 350, 1240, 28, 88);
}

{
  const slide = p.slides.add();
  addFrame(slide);
  text(slide, "thank", { left: 330, top: 340, width: 430, height: 105 }, {
    fontSize: 104,
    color: "#000000",
  });
  text(slide, "you!", { left: 330, top: 465, width: 430, height: 120 }, {
    fontSize: 104,
    bold: true,
    color: darkGreen,
  });
  text(slide, "Do you have any questions?", { left: 335, top: 640, width: 670, height: 50 }, {
    fontSize: 34,
    color: grey,
  });
  text(slide, "下一条产业链：光伏玻璃 / 储能 / 零碳园区？", { left: 335, top: 730, width: 820, height: 55 }, {
    fontSize: 30,
    color: charcoal,
  });
  await addImage(slide, "image2.png", { left: 1190, top: 470, width: 360, height: 250 });
}

const exported = await PresentationFile.exportPptx(p);
await exported.save(finalPptx);

const finalImported = await PresentationFile.importPptx(await FileBlob.load(finalPptx));
const snapshot = await finalImported.inspect({
  kind: "slide,textbox,shape,image,table,chart,layout",
  maxChars: 60000,
});
await fs.writeFile(inspectPath, snapshot.ndjson);

for (const [i, slide] of p.slides.items.entries()) {
  const png = await p.export({ slide, format: "png", scale: 2 });
  await writeBlob(path.join(imgDir, `${String(i + 1).padStart(2, "0")}-${topic}研究.png`), png);
}

const montage = await p.export({ format: "png", montage: true, scale: 1 });
await writeBlob(path.join(imgDir, "总览图.png"), montage);

await fs.writeFile(path.join(qaDir, "visual-qa.txt"), [
  "Think Green template-style rebuild QA",
  "Source template render failed after slide 2 due unsupported image/canvas object, so final deck uses editable object rebuild with source palette, frame, typography hierarchy and extracted plant assets.",
  "Generated 14 slides.",
  "Per-slide PNG export scale=2, expected 3840x2160.",
].join("\n"));

console.log(JSON.stringify({ finalPptx, imgDir, slides: p.slides.items.length }, null, 2));
