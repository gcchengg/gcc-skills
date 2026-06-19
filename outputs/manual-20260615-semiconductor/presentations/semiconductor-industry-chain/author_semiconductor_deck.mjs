import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const workspace = "/Users/apple/Documents/GitHub/gcc-skills/outputs/manual-20260615-semiconductor/presentations/semiconductor-industry-chain";
const sourcePptx = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/Metal Materials Company Profile by Slidesgo.pptx";
const starterPptxPath = path.join(workspace, "template-starter.pptx");
const finalPptx = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260614-半导体产业链/半导体产业链研究.pptx";
const previewDir = path.join(workspace, "preview");
const layoutDir = path.join(workspace, "layout", "final");

const plan = [
  { source: 1, role: "opening thesis", text: ["从材料、设备到芯片与系统｜2026.06.14", "半导体产业链\n研究"] },
  { source: 9, role: "research agenda", text: ["研究框架", "上游核心投入", "材料、设备、EDA 与 IP", "中游制造集成", "设计、晶圆制造、封装与测试", "下游应用场景", "AI、消费、汽车、工业与能源", "产业链全景", "协作模式、环节与参与者", "价值与壁垒", "价值分配、商业模式与核心能力", "风险与趋势", "成本、周期、地缘风险和趋势判断"] },
  { source: 4, role: "one sentence understanding", text: ["一句话理解", "半导体产业链是一套把材料、精密设备、软件工具和电路设计，转化为可规模制造芯片的全球协作系统。\n\n真正的壁垒不仅是制程尺寸，还包括设计能力、工艺配方、设备材料、良率、先进封装、供应协同和客户认证。"] },
  { source: 5, role: "section panorama", text: ["产业链全景", "01"] },
  { source: 9, role: "industry chain panorama", text: ["六大核心环节", "芯片设计", "将功能、性能、功耗、面积和成本目标转化为可制造电路", "晶圆制造", "通过沉积、光刻、刻蚀、掺杂和量测形成晶体管及互连", "封装测试", "连接、保护、散热并测试芯片；先进封装推动系统级创新", "材料与设备", "高纯材料和精密设备是制造能力、缺陷控制与良率的基础", "EDA 与 IP", "降低设计复杂度，缩短开发周期，提高一次流片成功率", "模组与应用", "芯片经分销和模组进入数据中心、汽车、消费电子和工业系统"] },
  { source: 8, role: "organization models", text: ["产业组织模式", "Fabless", "专注芯片设计，将制造和封测外包", "Foundry", "晶圆代工厂为不同设计企业提供制造服务", "IDM", "企业内部覆盖设计、制造和部分封测", "OSAT", "提供外包封装与测试服务"] },
  { source: 5, role: "section upstream", text: ["上游：核心投入", "02"] },
  { source: 7, role: "upstream analysis", text: ["上游三类核心能力", "半导体材料", "硅片、光刻胶、气体、化学品、靶材与光掩模；纯度、均匀性和批次稳定性决定良率", "制造设备", "光刻、刻蚀、沉积、注入、清洗和量测；壁垒来自跨学科研发、精密零部件与客户验证", "EDA 与 IP", "支撑架构、电路、仿真和物理设计；依赖算法、工具链、工艺适配、生态兼容与客户信任"] },
  { source: 5, role: "section midstream", text: ["中游：制造与集成", "03"] },
  { source: 8, role: "midstream analysis", text: ["中游四大环节", "晶圆制造", "核心是工艺配方、良率学习、设备调校、厂务系统与规模管理", "存储制造", "DRAM、NAND 等更受产能、库存和价格周期影响", "芯片设计", "人才、架构、软硬件协同、IP、验证能力与客户生态构成壁垒", "封装与测试", "先进封装通过芯粒、堆叠和高密度互连组合更高性能系统"] },
  { source: 5, role: "section downstream", text: ["下游：应用场景", "04"] },
  { source: 8, role: "downstream applications", text: ["四大需求场景", "消费与通信", "关注成本、功耗、尺寸、集成度、快速迭代与大规模供货", "汽车与工业", "重视可靠性、功能安全、严格认证与长期稳定供货", "数据中心与 AI", "需要高性能计算、HBM、网络、光通信、电源管理和软件生态", "能源与电力", "功率器件与模块提升电力转换效率，降低能耗和散热压力"] },
  { source: 8, role: "four flows", text: ["四种流动关系", "资金流", "设计公司支付 EDA、IP、流片、晶圆与封测费用；制造端持续资本投入", "信息流", "终端需求向设计端传导，工艺规则与制造数据持续反馈改善良率", "货物与服务流", "材料设备进入晶圆厂，设计文件经制造、封测、模组进入整机", "定价权传导", "稀缺产能、关键工具、差异化设计与完整生态增强议价能力"] },
  { source: 8, role: "value and business models", text: ["价值分配与商业模式", "制造与封测", "晶圆厂按晶圆和工艺收费，封测厂按封装测试服务收费", "设计与方案", "设计公司销售芯片或系统方案，依赖产品差异化和生态", "EDA 与 IP", "通过软件和 IP 授权收费，价值来自工具链、复用与客户信任", "设备与材料", "销售产品并提供持续服务，需长期配合客户优化工艺与良率"] },
  { source: 9, role: "core barriers", text: ["六类核心壁垒", "资本与规模", "先进制造、关键设备和长期研发需要持续高额投入", "工艺与良率", "知识嵌入设备参数、材料配方、操作经验与生产数据", "生态与兼容", "EDA、IP、制造、封装、操作系统和开发工具必须协同", "研发与人才", "融合物理、材料、化学、光学、机械、电子和软件能力", "客户认证", "汽车、工业、医疗等场景认证周期长，替换成本高", "供应链协同", "单一关键材料、设备或零部件受限可能阻断完整流程"] },
  { source: 8, role: "cost structure", text: ["成本结构", "可变成本", "晶圆、化学品、气体、电力、水、耗材、基板、物流和测试", "波动成本", "设备交付、能源、关键材料、汇率和外包制造价格", "固定成本", "研发、晶圆厂、洁净室、制造设备、厂务系统、软件和折旧", "隐性成本", "验证、试产、良率爬坡、掩模、停机、返工、库存与认证"] },
  { source: 8, role: "risk map", text: ["瓶颈与风险", "周期风险", "扩产周期长、需求变化快，容易出现短缺与过剩交替", "地缘与政策", "出口管制、关税、补贴、投资审查和地区冲突影响决策", "技术与生产", "复杂度上升要求设计、制造、封装、测试与散热紧密协同", "资源与运营", "稳定电力、超纯水、气体、化学品、维护和工程人才不可缺少"] },
  { source: 9, role: "participant map", text: ["典型参与角色", "设计", "Fabless 设计企业与 IDM 设计部门", "制造", "晶圆代工厂、IDM、特色工艺厂与存储制造商", "封测", "OSAT 以及晶圆厂或 IDM 内部封装测试部门", "工具与投入", "EDA、IP、材料、设备与精密零部件供应商", "渠道与集成", "分销商、方案商、模组商和电子制造服务商", "最终需求", "云服务商、整机厂、汽车、工业、通信和能源企业"] },
  { source: 7, role: "overlooked facts", text: ["三个容易被忽略的事实", "芯片制造不是单台设备完成", "一块芯片经历大量重复加工和检测步骤，设备、材料与工艺参数必须长期协同", "先进封装承担系统级创新", "芯粒、堆叠与高密度互连可组合不同工艺制造的芯片", "成熟制程并不等于落后", "汽车、工业、模拟、功率和控制芯片更看重可靠性、成本与长期供货"] },
  { source: 6, role: "outlook", text: ["产业竞争系统化", "AI 与供应链韧性", "竞争正从单一制程节点扩展到架构、工艺、封装、存储、互连、软件生态和供应能力。", "AI 提升先进逻辑、先进封装、HBM、网络和电源管理的重要性；地缘风险推动区域扩产与供应链多元化。", "趋势判断"] },
  { source: 22, role: "research sources", text: ["资料来源", "Semiconductor Industry Association｜行业销售与趋势\nWorld Semiconductor Trade Statistics｜市场统计与预测\nNIST CHIPS for America｜制造、研发、封装与供应链韧性\nASML Lithography Principles｜光刻制造原理\nU.S. BIS｜供应链与出口管制信息", "研究边界：从材料、设备、EDA 与 IP，覆盖芯片设计、晶圆制造、封装测试、模组与终端应用。\n\n访问日期：2026-06-14\n完整底稿：产业链研究底稿.md"] },
  { source: 20, role: "closing and attribution", text: ["谢谢", "Please keep this slide for attribution", "半导体产业链研究\n生成日期：2026-06-14\n基于公开资料与产业链研究底稿整理"] }
];

function getSlides(presentation) {
  return Array.isArray(presentation.slides?.items)
    ? presentation.slides.items
    : Array.from({ length: presentation.slides.count }, (_, i) => presentation.slides.getItem(i));
}
function textShapes(slide) {
  return (slide.shapes?.items || []).filter((shape) => String(shape.text || "").trim().length > 0);
}
async function saveBlob(blob, output) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, Buffer.from(await blob.arrayBuffer()));
}
async function savePptx(presentation, output) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const blob = await PresentationFile.exportPptx(presentation);
  await blob.save(output);
}

const source = await PresentationFile.importPptx(await FileBlob.load(sourcePptx));
const originals = [...getSlides(source)];
const duplicates = plan.map(({ source: sourceNumber }) => originals[sourceNumber - 1].duplicate());
for (const slide of originals) slide.delete();
duplicates.forEach((slide, index) => slide.moveTo(index));
await savePptx(source, starterPptxPath);

const presentation = await PresentationFile.importPptx(await FileBlob.load(starterPptxPath));
const outputSlides = getSlides(presentation);
for (let index = 0; index < plan.length; index += 1) {
  const shapes = textShapes(outputSlides[index]);
  const replacements = plan[index].text;
  if (shapes.length !== replacements.length) {
    throw new Error(`Slide ${index + 1}: expected ${replacements.length} text shapes, found ${shapes.length}`);
  }
  replacements.forEach((text, shapeIndex) => { shapes[shapeIndex].text = text; });
}

await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(layoutDir, { recursive: true });
for (let index = 0; index < outputSlides.length; index += 1) {
  const number = String(index + 1).padStart(2, "0");
  await saveBlob(await presentation.export({ slide: outputSlides[index], format: "png", scale: 1.5 }), path.join(previewDir, `slide-${number}.png`));
  await saveBlob(await presentation.export({ slide: outputSlides[index], format: "layout" }), path.join(layoutDir, `slide-${number}.layout.json`));
}
await savePptx(presentation, finalPptx);

const inspectLines = (await fs.readFile(path.join(workspace, "template-inspect", "template-inspect.ndjson"), "utf8")).trim().split(/\r?\n/);
const sourceTextIds = new Map();
for (const line of inspectLines) {
  const record = JSON.parse(line);
  if (record.kind !== "textbox") continue;
  if (!sourceTextIds.has(record.slide)) sourceTextIds.set(record.slide, []);
  sourceTextIds.get(record.slide).push(record.id);
}
await fs.writeFile(path.join(workspace, "template-frame-map.json"), JSON.stringify({
  outputSlides: plan.map((item, index) => ({
    outputSlide: index + 1,
    sourceSlide: item.source,
    narrativeRole: item.role,
    reuseMode: "duplicate-slide",
    editTargets: [{ action: "rewrite", shapeIds: sourceTextIds.get(item.source) || [] }]
  })),
  omittedSourceSlides: []
}, null, 2));
console.log(finalPptx);
