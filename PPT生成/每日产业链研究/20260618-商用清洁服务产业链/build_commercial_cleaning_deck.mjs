import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const templatePath = "/Users/apple/Documents/GitHub/gcc-skills/0615ppt/sales_templates_Commercial Cleaning Sales Pitch Slides (1).pptx";
const outDir = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260618-商用清洁服务产业链";
const imageDir = path.join(outDir, "高清图片");
const pptxPath = path.join(outDir, "商用清洁服务产业链研究.pptx");
const scratchDir = "/private/tmp/codex-presentations/manual-20260618/commercial-cleaning-chain/tmp";

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

function textShapes(slide) {
  return slide.shapes.items.filter((shape) => {
    const value = shape.text?.toString?.();
    return value !== undefined;
  });
}

function setShapeText(shape, value, opts = {}) {
  shape.text = value;
  if (opts.style) {
    shape.text.style = opts.style;
  }
}

function setByText(slide, oldText, newText, opts = {}) {
  for (const shape of textShapes(slide)) {
    if (shape.text?.toString?.() === oldText) {
      setShapeText(shape, newText, opts);
      return true;
    }
  }
  return false;
}

function setTextAt(slide, index, value, opts = {}) {
  const shapes = textShapes(slide);
  if (shapes[index]) setShapeText(shapes[index], value, opts);
}

function setSmallFooter(slide) {
  for (const shape of textShapes(slide)) {
    if (shape.text?.toString?.() === "Back to Contents") {
      setShapeText(shape, "产业链研究");
    }
  }
}

async function main() {
  await fs.mkdir(imageDir, { recursive: true });
  await fs.mkdir(scratchDir, { recursive: true });
  await fs.writeFile(
    path.join(scratchDir, "source-notes.txt"),
    [
      "Content source: 产业链研究底稿.md and 小红书发布文案.md.",
      "Template source: sales_templates_Commercial Cleaning Sales Pitch Slides (1).pptx.",
      "External references: BLS OOH Janitors and Building Cleaners; EPA Safer Choice; EPA List N; OSHA Chemical Hazards; CDC Cleaning guidance.",
      "Assets: inherited template photography and graphic elements; no unverified third-party logos added.",
    ].join("\n"),
  );
  await fs.writeFile(
    path.join(scratchDir, "edit-plan.txt"),
    [
      "Mode: targeted template edit of the full 14-slide commercial cleaning sales deck.",
      "Preserve: dark green/cream palette, photographic treatment, section rhythm, tables, cards, and existing image frames.",
      "Rewrite: all visible sample sales copy into commercial-cleaning industry-chain research content.",
      "Repurpose: resource and credits slides as sources and conclusion slides.",
    ].join("\n"),
  );

  const pres = await PresentationFile.importPptx(await FileBlob.load(templatePath));

  const s1 = pres.slides.getItem(0);
  setByText(s1, "TRUE CLEAN SERVICES", "INDUSTRY CHAIN RESEARCH");
  setByText(s1, "Reliable cleaning for offices, buildings,\nand shared spaces", "从药剂、设备、劳动力到现场交付与续约");
  setByText(s1, "Commercial Cleaning\nSales Pitch Slides", "商用清洁服务\n产业链研究");

  const s2 = pres.slides.getItem(1);
  setByText(s2, "Contents", "目录");
  const table = s2.tables.items[0];
  const rows = [
    ["问题与需求", "03"],
    ["产业链全景", "04"],
    ["成本与风险", "05"],
    ["价值主张", "06"],
    ["交付流程", "07"],
    ["客户视角", "08"],
    ["服务场景", "09"],
  ];
  rows.forEach((row, r) => row.forEach((v, c) => table.setCellValue(r, c, v)));

  const s3 = pres.slides.getItem(2);
  setByText(s3, "The problem", "问题与需求");
  setByText(
    s3,
    "Keeping commercial spaces clean sounds simple—but many businesses struggle with:",
    "商用清洁不是简单“找人打扫”。客户真正购买的是稳定空间体验、低投诉、安全记录和可追责的服务交付。",
  );

  const s4 = pres.slides.getItem(3);
  setByText(s4, "Meet True Clean Services", "产业链全景");
  setByText(
    s4,
    "True Clean Services offers reliable, hassle-free commercial cleaning for businesses seeking clean spaces without the stress.",
    "主要链路：药剂/设备/耗材 → 劳动力与培训 → 服务商/设施管理商 → 现场交付与质检 → 物业和企业客户。",
  );
  setByText(s4, "We focus on: ", "三条主线：");
  setByText(s4, "Consistency", "投入端");
  setByText(s4, "Clear communication", "运营端");
  setByText(s4, "Getting the job done right, every time", "客户场景");
  setSmallFooter(s4);

  const s5 = pres.slides.getItem(4);
  setTextAt(s5, 0, "成本结构与风险");
  setTextAt(s5, 1, "当服务失控时：");
  setTextAt(s5, 2, "产业链研究");
  setTextAt(s5, 3, "成本结构与风险");
  setTextAt(s5, 4, "人工、耗材、设备和管理成本共同决定利润质量。");
  setTextAt(s5, 5, "产业链研究");
  setSmallFooter(s5);

  const s6 = pres.slides.getItem(5);
  setByText(s6, "Our mission:", "价值主张：");
  setByText(s6, "We believe clean spaces help\npeople do their best work.", "把清洁从低价劳务，升级为稳定、可审计、可追责的设施服务。");
  setByText(s6, "Our goal:", "核心目标：");
  setByText(s6, "Make workplaces cleaner,\nhealthier, and easier to manage.", "降低投诉、稳定出勤、减少耗材浪费，并提升客户续约概率。");
  setSmallFooter(s6);

  const s7 = pres.slides.getItem(6);
  setByText(s7, "How we work", "交付流程");
  setByText(
    s7,
    "Our process is simple, reliable, and built around your space.",
    "现场勘查 → 方案与报价 → 人员培训 → 日常交付 → 巡检复盘 → 客户续约。关键不是一次性打扫，而是每天稳定。",
  );
  setSmallFooter(s7);

  const s8 = pres.slides.getItem(7);
  setByText(s8, "What our clients say", "客户如何评价价值");
  setByText(s8, "“True Clean made our office feel fresh again—without us needing to manage anything.”", "“清洁服务的价值，是投诉少、响应快、责任清楚。”");
  setByText(s8, "“Our staff noticed the difference within the\nfirst week.”", "“不是只看地面亮不亮，而是空间体验能否稳定。”");
  setByText(s8, "“Reliable, friendly, and consistent. That’s all\nwe wanted.”", "“数据化巡检和替班机制，比低价更能支撑续约。”");
  setByText(s8, "Lila", "物业方");
  setByText(s8, "Office Manager, Stellar Studio", "关注投诉率与公共区形象");
  setByText(s8, "Serena", "企业行政");
  setByText(s8, "Operations Lead, Streamline Soft", "关注员工体验与预算稳定");
  setByText(s8, "Jude", "服务商");
  setByText(s8, "Owner,\nOpen Horizon", "关注人效、耗材与项目密度");
  setSmallFooter(s8);

  const s9 = pres.slides.getItem(8);
  setByText(s9, "Services\nwe offer", "服务\n场景");
  const cardShapes = s9.shapes.items.filter((shape) => {
    const left = shape.data?.position?.left ?? shape.frame?.left ?? 0;
    return !shape.text?.toString?.() && left > 500;
  });
  const labels = ["日常保洁", "地面养护", "卫生间与高频接触面", "专项深度清洁", "耗材补给", "消毒相关服务"];
  cardShapes.slice(0, 6).forEach((shape, i) => {
    setShapeText(shape, labels[i], { style: { fontSize: 24, bold: true, color: "#074B04" } });
  });
  setSmallFooter(s9);

  const s10 = pres.slides.getItem(9);
  setByText(s10, "Common areas", "公共区域");
  setByText(s10, "Office and workspace", "办公与共享空间");
  setByText(s10, "Restrooms and\nhigh-touch areas", "卫生间与\n高频接触面");

  const s11 = pres.slides.getItem(10);
  setByText(s11, "Ready for a cleaner space?", "从服务商视角看三步增长");
  setByText(s11, "Book a site visit", "做准现场方案");
  setByText(s11, "We’ll review your space and needs.", "面积、材质、客流和时间窗决定交付模型。");
  setByText(s11, "Get a clear quote", "管住成本结构");
  setByText(s11, "No hidden fees. No surprises.", "人工、耗材、设备、替班和巡检都要进入报价。");
  setByText(s11, "Start cleaning", "形成续约证据");
  setByText(s11, "Reliable service from day one.", "用工单、照片、投诉闭环和安全记录支撑续约。");
  setSmallFooter(s11);

  const s12 = pres.slides.getItem(11);
  setByText(s12, "Clean doesn’t have to be complicated.", "商用清洁的竞争力，不只是低价。");
  setByText(s12, "We’re happy to help.", "真正的差异来自标准化、人员管理、设备效率、绿色合规和客户信任。");
  setByText(s12, "TRUE CLEAN SERVICES", "COMMERCIAL CLEANING CHAIN");

  const s13 = pres.slides.getItem(12);
  setByText(s13, "Resource Page", "资料来源与合规索引");
  setByText(s13, "This presentation template\nuses the following free fonts:", "已验证来源：\nBLS / EPA / OSHA / CDC");
  setByText(s13, "Use these in your presentation. Delete or hide this page before presenting. ", "本页已由模板资源页改为资料来源页。");
  setByText(s13, "You can find these fonts online too.", "重点合规：化学品安全、消毒产品声明、绿色清洁、员工防护。");
  setByText(s13, "TITLES:", "劳动供给");
  setByText(s13, "BODY TEXT:", "绿色与安全");
  setByText(s13, "Inter", "BLS 职业信息");
  setByText(s13, "Lora", "EPA / OSHA / CDC");

  const s14 = pres.slides.getItem(13);
  setByText(s14, "Credits", "结论");
  setByText(s14, "This presentation template is free for everyone to use, thanks to the following:", "商用清洁服务产业链，是把劳动、化学品、设备、耗材、流程和客户体验整合成可复制交付能力。");
  setByText(s14, "Pexels, Pixabay, Sketchify", "核心壁垒：稳定招人、班组长、培训 SOP、巡检数据、耗材管理和客户续约。");
  setByText(s14, "for the photos, graphics, and elements", "适合继续拆解：清洁机器人、商用洗地机、清洁剂与消毒剂、设施管理、商用纸品耗材。");
  setByText(s14, "for this presentation template", "资料来源见第 13 页");
  setByText(s14, "Happy designing!", "产业链研究 / 2026-06-18");

  for (const [index, slide] of pres.slides.items.entries()) {
    const stem = `${String(index + 1).padStart(2, "0")}-商用清洁服务产业链研究`;
    const png = await pres.export({ slide, format: "png", scale: 2 });
    await writeBlob(path.join(imageDir, `${stem}.png`), png);
  }
  const montage = await pres.export({ format: "png", montage: true, scale: 1 });
  await writeBlob(path.join(imageDir, "总览图.png"), montage);
  const pptx = await PresentationFile.exportPptx(pres);
  await pptx.save(pptxPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
