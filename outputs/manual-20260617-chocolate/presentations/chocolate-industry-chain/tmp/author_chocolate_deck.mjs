import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const topicDir = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260617-巧克力产业链";
const workspace = "/Users/apple/Documents/GitHub/gcc-skills/outputs/manual-20260617-chocolate/presentations/chocolate-industry-chain/tmp";
const starterPptx = path.join(workspace, "template-starter.pptx");
const finalPptx = path.join(topicDir, "巧克力产业链研究.pptx");
const previewDir = path.join(workspace, "preview", "final");
const layoutDir = path.join(workspace, "layout", "final");
const assets = {
  cacao: path.join(workspace, "assets", "cacao-pods.png"),
  factory: path.join(workspace, "assets", "chocolate-factory.png"),
  products: path.join(workspace, "assets", "chocolate-products.png"),
};

const slideTexts = [
  [
    "巧克力产业链｜2026.06.17",
    "研究底稿",
    "每日产业链",
    "巧克力产业链\n研究",
  ],
  [
    "01.",
    "02.",
    "03.",
    "04.",
    "05.",
    "06.",
    "07.",
    "08.",
    "核心理解",
    "产业链全景",
    "上游：可可来源",
    "中游：加工制造",
    "下游：品牌与应用",
    "流动与定价权",
    "价值与壁垒",
    "目录",
    "风险与趋势",
  ],
  [
    "一块巧克力，\n是一条全球供应链",
    "巧克力产业链把热带地区的可可豆，通过发酵、干燥、贸易、研磨、压榨、精炼、调温和品牌化，转化为零食、礼品、烘焙原料、饮品配料和食品工业原料。\n\n真正的瓶颈不只在制造端，更在可可原料的气候、病害、农户收益、可追溯合规和价格波动。",
  ],
  [
    "产业链全景",
    "01.",
  ],
  [
    "从可可豆到消费场景",
    "可可种植与采收 → 发酵干燥与分级 → 合作社/贸易商 → 仓储运输 → 研磨压榨 → 可可液块/可可脂/可可粉 → 工业巧克力 → 品牌包装与渠道 → 零售、餐饮、烘焙和食品工业应用\n\n每个环节都在把“不稳定农产品”转化为“稳定可交付的风味、口感、配方和品牌体验”。",
  ],
  [
    "上游与中游：两类能力",
    "上游｜可可来源\n• 种植、采收、发酵、干燥决定风味基础\n• 价值来自产地风味、批次稳定和可追溯\n• 风险集中在天气、病害、农户收益与毁林合规",
    "中游｜加工制造\n• 研磨压榨形成液块、可可脂和可可粉\n• 工业巧克力提供配方、口感、融点和流变性\n• 壁垒来自规模、食品安全、套保和客户认证",
    "01",
    "02",
  ],
  [
    "流动与定价权",
    "02.",
  ],
  [
    "四种流动决定利润分配",
    "货物与服务流\n• 可可豆跨境进入加工厂，再转为原料和终端产品\n• B 端应用需要稳定交付、冷链和配方服务\n\n信息流\n• 终端口味、价格接受度和合规要求向上游传导\n• 产地质量、认证和可追溯数据向下游传导",
    "资金与定价流\n• 贸易、加工和品牌端使用合同、库存和套保管理价格风险\n• 短期价格受可可豆供需和期货价格影响更明显\n\n议价权\n• 品牌与渠道拥有消费者触达\n• 上游分散农户议价弱，但合规可追溯会提高优质产地价值",
    "01",
    "02",
  ],
  [
    "价值与壁垒",
    "03.",
  ],
  [
    "价值不是只在“做甜食”",
    "价值增加\n• 原料豆变成稳定可用的可可制品\n• 工业巧克力变成适配不同产品的配方\n• 品牌和渠道把口感包装成礼品、零食与情绪消费\n\n规模驱动\n• 研磨、工业巧克力、大众品牌与商超供应",
    "核心壁垒\n• 稳定产地网络和可追溯可可豆\n• 发酵、焙炒、精炼、调温与流变控制\n• 食品安全认证、EUDR 等合规能力\n• 终端品牌、节日场景和货架渠道\n\n弱势环节\n• 分散农户、小型收购商和同质化代工",
    "01",
    "02",
  ],
  [
    "风险与趋势",
    "04.",
  ],
  [
    "关键数据",
    "ICCO 2026.05｜2025/26 年度预测",
    "4.84 百万吨",
    "全球可可豆产量",
    "4.743 百万吨",
    "全球可可研磨量",
    "1.353 百万吨",
    "预计期末库存",
  ],
  [
    "四类风险需要持续跟踪",
    "• 供应链：西非主产区天气、病害、农户收益和港口/融资扰动会放大原料波动。\n• 需求与周期：高可可价格可能传导为涨价、缩小规格、可可含量调整或复合涂层替代。\n• 技术与质量：发酵干燥、焙炒曲线、流变性和食品安全决定客户能否稳定使用。\n• 政策合规：EUDR 将可可纳入无毁林尽调范围，抬高产地数据和供应商管理门槛。",
  ],
  [
    "三个容易被忽略的事实",
    "• 可可豆不是普通农产品，采后发酵直接决定风味上限。\n• 工业巧克力商不只卖原料，也卖稳定配方、应用研发和客户认证能力。\n• 巧克力涨价不一定只看标价，也可能体现为规格变小、可可含量调整或替代配方。\n\n可延展主题：可可种植服务、可可脂与可可粉、工业巧克力、bean-to-bar、烘焙原料、复合涂层、节日礼赠食品。",
  ],
  [
    "资料来源",
    "• International Cocoa Organization｜May 2026 Quarterly Bulletin of Cocoa Statistics\n• International Cocoa Organization｜Statistics\n• European Commission｜Deforestation Regulation implementation\n• World Cocoa Foundation｜cocoa sustainability context\n• Barry Callebaut｜industrial chocolate applications\n\n研究边界：从可可种植、贸易加工、工业巧克力制造，到品牌零售、烘焙餐饮和食品工业应用。\n完整底稿：产业链研究底稿.md",
  ],
  [
    "谢谢",
    "巧克力产业链研究\n生成日期：2026-06-17\n基于公开资料与产业链研究底稿整理\n\nCREDITS: This presentation template was created by Slidesgo, and includes icons, infographics & images by Freepik.\n\nPlease keep this slide for attribution",
    "保留此页用于模板署名",
  ],
];

function getSlides(presentation) {
  return Array.isArray(presentation.slides?.items)
    ? presentation.slides.items
    : Array.from({ length: presentation.slides.count }, (_, index) => presentation.slides.getItem(index));
}

function textShapes(slide) {
  return (slide.shapes?.items || []).filter((shape) => String(shape.text || "").trim().length > 0);
}

async function saveBlob(blob, output) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, Buffer.from(await blob.arrayBuffer()));
}

const presentation = await PresentationFile.importPptx(await FileBlob.load(starterPptx));
const slides = getSlides(presentation);
if (slides.length !== slideTexts.length) {
  throw new Error(`Expected ${slideTexts.length} slides, got ${slides.length}`);
}

for (let index = 0; index < slides.length; index += 1) {
  const shapes = textShapes(slides[index]);
  const replacements = slideTexts[index];
  if (shapes.length !== replacements.length) {
    throw new Error(`Slide ${index + 1}: expected ${replacements.length} text shapes, found ${shapes.length}`);
  }
  replacements.forEach((text, shapeIndex) => {
    shapes[shapeIndex].text = text;
  });
}

async function swapImage(slide, imagePath, alt) {
  const inherited = slide.images?.items?.[0];
  if (!inherited) return;
  const position = { ...inherited.position };
  const geometry = inherited.geometry;
  const borderRadius = inherited.borderRadius;
  inherited.delete();
  const image = slide.images.add({
    blob: await fs.readFile(imagePath),
    contentType: "image/png",
    alt,
    position,
    fit: "cover",
    geometry: geometry || "roundRect",
    borderRadius: borderRadius || "rounded-3xl",
  });
  if (geometry) image.geometry = geometry;
  if (borderRadius) image.borderRadius = borderRadius;
}

await swapImage(slides[0], assets.cacao, "Cacao pods and beans");
await swapImage(slides[2], assets.factory, "Chocolate production line");
await swapImage(slides[11], assets.products, "Chocolate products and cocoa ingredients");

await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(layoutDir, { recursive: true });
for (let index = 0; index < slides.length; index += 1) {
  const number = String(index + 1).padStart(2, "0");
  await saveBlob(await presentation.export({ slide: slides[index], format: "png", scale: 1.5 }), path.join(previewDir, `slide-${number}.png`));
  await saveBlob(await slides[index].export({ format: "layout" }), path.join(layoutDir, `slide-${number}.layout.json`));
}

const montage = await presentation.export({ format: "png", montage: true, scale: 1 });
await saveBlob(montage, path.join(workspace, "final-contact-sheet.png"));

await fs.mkdir(topicDir, { recursive: true });
const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(finalPptx);
console.log(JSON.stringify({ finalPptx, slideCount: slides.length }, null, 2));
