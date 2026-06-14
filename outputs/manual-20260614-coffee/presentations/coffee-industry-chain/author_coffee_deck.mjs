import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const workspace = "/Users/apple/Documents/GitHub/gcc-skills/outputs/manual-20260614-coffee/presentations/coffee-industry-chain";
const sourcePptx = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/Architecture Studio by Slidesgo.pptx";
const starterPptxPath = path.join(workspace, "template-starter.pptx");
const finalPptx = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260614-咖啡产业链/咖啡产业链研究.pptx";
const previewDir = path.join(workspace, "preview");
const layoutDir = path.join(workspace, "layout", "final");

const slides = [
  { source: 1, text: ["咖啡产业链研究｜2026.06.14", "咖啡产业链\n研究"] },
  { source: 3, text: ["研究框架", "加工、贸易、烘焙与制造", "上游生产", "种苗、种植与采收", "01", "中游集成", "02", "核心判断", "03", "下游消费", "04", "价值、壁垒、成本与风险", "渠道、门店与消费者"] },
  { source: 4, text: ["一句话理解", "咖啡产业链把热带农业原料转化为标准化商品、风味产品与消费体验。上游承担漫长种植周期和自然风险，中游负责质量分级、全球贸易与风味塑造，下游通过品牌、渠道、门店和便利性放大最终价值。"] },
  { source: 10, text: ["产业链全景", "种植与采收", "土地、品种、气候与劳动决定供应量和品质上限", "种质与种苗", "育种、苗圃与农技服务决定长期生产能力", "鲜果初加工", "日晒、水洗、蜜处理控制发酵、干燥与稳定性", "生豆与贸易", "脱壳、分级、仓储、出口、进口与风险管理", "烘焙与制造", "烘焙、拼配、速溶、冻干、即饮与胶囊制造", "渠道与消费", "门店、餐饮、便利店、零售、电商与家庭消费"] },
  { source: 7, text: ["最终产品与需求", "核心用户", "家庭、办公室、现制咖啡消费者，以及餐饮、酒店与零售采购方", "提神习惯、风味体验、社交空间、便捷消费与生活方式表达", "产品形态", "烘焙豆、咖啡粉、速溶、即饮、胶囊与门店现制咖啡", "需求来源"] },
  { source: 13, text: ["上游：资源与生产", "种植与采收", "特定海拔、温度、降雨和劳动力共同形成产区壁垒", "种质与种苗", "选种决定多年产量、杯测潜力、成熟周期与抗病能力", "农资与服务", "肥料、植保、灌溉、信贷、保险与农技服务稳定单产", "核心风险", "霜冻、干旱、高温、暴雨、叶锈病及采收劳动力短缺"] },
  { source: 10, text: ["中游：加工与集成", "生豆分级仓储", "尺寸、密度、瑕疵与杯测分级降低交易不确定性", "鲜果初加工", "快速去果肉、控制发酵与干燥，决定干净度和风味稳定", "出口与贸易", "聚合产量，处理融资、外汇、合同、海运、保险与交付", "烘焙与拼配", "通过热加工、配方和质量控制塑造并稳定风味", "深加工制造", "速溶、冻干、浓缩液、即饮与胶囊提升便利性", "支撑服务", "检测、认证、追溯、金融、物流、设备和数字化系统"] },
  { source: 10, text: ["下游：渠道与场景", "餐饮与便利店", "嵌入既有场景，依靠便利性、流量复用和标准化交付", "现制咖啡门店", "将咖啡豆、设备、人员与空间转化为产品和体验", "零售与电商", "依靠货架流量、品牌、包装、复购、订阅和内容教育", "办公室咖啡", "以稳定供应、设备运维和快速交付服务组织客户", "精品咖啡", "通过产地、品种、处理法、烘焙与冲煮建立质量分层", "大众包装产品", "价格、稳定和便利驱动规模化消费"] },
  { source: 17, text: ["四种流动关系", "货物流", "01", "02", "03", "04", "鲜果产地加工，生豆跨境运输，烘焙后进入各类渠道", "资金流", "消费者付款逐层回流；农业端需要在收获前持续投入", "信息流", "消费趋势向上游传导，产地与追溯信息向下游传递", "定价权", "标准生豆受全球价格影响，稀缺性、品牌与渠道增强议价"] },
  { source: 13, text: ["价值如何增加", "贸易与标准化", "分级、仓储、融资和履约降低不确定性并提升可交易性", "产地与处理", "从鲜果到可储运生豆，增加稳定性、质量辨识和追溯能力", "加工与产品", "烘焙、配方、包装和深加工增加风味、保鲜与便利性", "渠道与体验", "品牌、门店、服务与消费场景放大终端价值，也增加成本"] },
  { source: 17, text: ["典型商业模式", "原料交易", "01", "02", "03", "04", "生豆按重量、等级与质量交易，价格受基准市场影响", "贸易服务", "贸易商通过集货、融资、风险管理、质量匹配与价差获利", "产品销售", "烘焙商和制造商通过配方、包装、批发与零售获得收入", "门店与品牌", "按杯销售，并通过空间、会员、订阅、授权和渠道变现"] },
  { source: 13, text: ["核心壁垒", "资本与规模", "多年种植、库存融资、国际贸易、深加工设备与门店网络", "资源壁垒", "适宜土地、气候、水资源、稳定劳动力与长期供应关系", "技术与工艺", "育种、农艺、采后处理、检测、烘焙复现和食品制造", "品牌与渠道", "消费心智、产品稳定、门店位置、会员、货架与平台流量"] },
  { source: 17, text: ["成本结构", "固定成本", "01", "02", "03", "04", "土地与种植投入、处理站、仓库、加工设备和门店设备", "可变成本", "人工、肥料、能源、水、包装、物流、平台费用与佣金", "波动成本", "生豆采购、人工、肥料、能源、海运、汇率与门店租金", "隐性成本", "品质损耗、库存老化、检测追溯、资金占用与新品失败"] },
  { source: 13, text: ["瓶颈与风险", "技术风险", "品种、农艺或处理不匹配，以及仓储失误会损害多年投入", "供应链风险", "产区天气异常、种植更新周期长、海运与仓储中断", "需求与周期", "生豆价格、汇率、消费景气和价格竞争共同影响利润", "政策与合规", "欧盟无毁林规则提升地块定位、追溯、数据与尽调要求"] },
  { source: 10, text: ["典型参与角色", "初加工与集货", "处理站、合作社、收购商、脱壳厂、检测与仓储商", "上游生产", "育种机构、苗圃、农资商、农技机构、种植户与庄园", "贸易与物流", "出口商、进口商、国际贸易商、物流、保险与金融机构", "加工制造", "烘焙商、速溶冻干厂、即饮企业、胶囊与代工企业", "下游渠道", "咖啡馆、餐饮酒店、便利店、商超、电商和办公室服务商", "治理与支撑", "政府、国际组织、认证、协会、研究与追溯技术服务商"] },
  { source: 18, text: ["三个容易被忽略的事实", "咖啡树通常拥有约 20–30 年寿命，选种是会锁定多年经营结果的长期资产决策。", "成熟度、采收选择、发酵、干燥与仓储，在烘焙之前就决定了大量品质上限。", "长期资产", "风味前置", "终端售价包含空间、人工、设备、配送、营销和损耗，不能直接代表原料或门店利润。", "售价 ≠ 利润"] },
  { source: 19, text: ["趋势与研究重点", "气候与合规", "气候风险与无毁林追溯要求，正在提升育种、农艺服务、供应链数据和长期采购关系的重要性。", "模式与验证", "评估国家、城市或企业时，应补充消费结构、门店密度、进口来源、价格带和项目级成本数据。"] },
  { source: 24, text: ["ICO｜World Coffee Statistics\nWCR｜Coffee Varieties Catalog\nEU｜Deforestation-free Products\nWorld Bank｜Commodity Markets\n访问日期｜2026-06-14", "资料来源", "研究边界：种苗、种植、采收、生豆加工、跨境贸易、烘焙、产品制造与终端消费。\n\n不深入拆解：咖啡机制造、门店装修、乳制品、糖等外围产业。\n\n完整底稿：产业链研究底稿.md"] },
  { source: 21, text: ["谢谢", "咖啡产业链研究\n生成日期：2026-06-14\n基于公开资料与产业链研究底稿整理", "Please keep this slide for attribution."] }
];

function getSlides(presentation) {
  if (Array.isArray(presentation.slides?.items)) return presentation.slides.items;
  return Array.from({ length: presentation.slides.count }, (_, i) => presentation.slides.getItem(i));
}

function textShapes(slide) {
  return (slide.shapes?.items || []).filter((shape) => String(shape.text || "").trim().length > 0);
}

async function savePptx(presentation, output) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const blob = await PresentationFile.exportPptx(presentation);
  await blob.save(output);
}

async function saveBlob(blob, output) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, Buffer.from(await blob.arrayBuffer()));
}

const source = await PresentationFile.importPptx(await FileBlob.load(sourcePptx));
const originals = [...getSlides(source)];
const duplicates = slides.map(({ source: sourceNumber }) => originals[sourceNumber - 1].duplicate());
for (const slide of originals) slide.delete();
duplicates.forEach((slide, index) => slide.moveTo(index));
await savePptx(source, starterPptxPath);

const presentation = await PresentationFile.importPptx(await FileBlob.load(starterPptxPath));
const outputSlides = getSlides(presentation);
for (let index = 0; index < slides.length; index += 1) {
  const shapes = textShapes(outputSlides[index]);
  const replacements = slides[index].text;
  if (shapes.length !== replacements.length) {
    throw new Error(`Slide ${index + 1}: expected ${replacements.length} text shapes, found ${shapes.length}`);
  }
  for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex += 1) {
    shapes[shapeIndex].text = replacements[shapeIndex];
  }
}

await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(layoutDir, { recursive: true });
for (let index = 0; index < outputSlides.length; index += 1) {
  const number = String(index + 1).padStart(2, "0");
  const png = await presentation.export({ slide: outputSlides[index], format: "png", scale: 1.5 });
  await saveBlob(png, path.join(previewDir, `slide-${number}.png`));
  const layout = await presentation.export({ slide: outputSlides[index], format: "layout" });
  await saveBlob(layout, path.join(layoutDir, `slide-${number}.layout.json`));
}

await savePptx(presentation, finalPptx);
console.log(finalPptx);
