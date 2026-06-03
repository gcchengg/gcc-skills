import fs from 'node:fs';
import path from 'node:path';

const root = '/Users/apple/Documents/skills/产业链拆解';
const progressPath = '/Users/apple/Documents/skills/tech-anatomy-topic-progress.json';
const batch = '20260524-2101';

const topics = [
  {
    name: 'SaaS商业模式',
    type: '公司商业模式',
    angle: '把软件产品、订阅收入、客户成功和续费飞轮拆开',
    layers: ['客户痛点', '核心产品', '交付体系', '获客渠道', '订阅计费', '客户成功', '续费扩张', '成本风险'],
    thesis: 'SaaS卖的不是一次性软件，而是持续交付、持续使用和持续续费的能力。',
    bottlenecks: ['获客成本', '留存率', '产品粘性', '服务成本', '现金流周期'],
    tags: '#SaaS #商业模式 #企业服务 #订阅制 #客户成功 #科技商业 #产品增长 #B端产品 #产业链拆解 #小红书科技',
  },
  {
    name: 'CRM',
    type: '产品架构',
    angle: '把线索、客户、销售流程、服务闭环和数据资产拆开',
    layers: ['线索入口', '客户主数据', '销售流程', '营销自动化', '服务工单', '数据分析', '生态集成', '续费增长'],
    thesis: 'CRM的核心不是通讯录，而是把客户关系变成可管理、可预测、可复盘的收入系统。',
    bottlenecks: ['数据质量', '一线录入', '流程适配', '系统集成', '组织执行'],
    tags: '#CRM #客户管理 #销售管理 #企业服务 #SaaS #数字化转型 #B端产品 #客户成功 #科技解剖 #商业分析',
  },
  {
    name: 'ERP',
    type: '产品架构',
    angle: '把财务、采购、库存、生产、供应链和经营数据拆开',
    layers: ['业务流程', '主数据', '财务核算', '采购库存', '生产计划', '供应链协同', '经营分析', '权限合规'],
    thesis: 'ERP不是一个软件模块集合，而是企业经营流程和财务事实的统一底座。',
    bottlenecks: ['实施周期', '流程重构', '主数据治理', '跨部门协同', '定制成本'],
    tags: '#ERP #企业管理 #企业服务 #数字化转型 #供应链 #财务系统 #SaaS #信息化 #科技解剖 #商业分析',
  },
  {
    name: 'HR SaaS',
    type: '产品架构',
    angle: '把招聘、组织、人事、薪酬、绩效和员工体验拆开',
    layers: ['组织架构', '招聘入口', '员工档案', '考勤薪酬', '绩效人才', '员工服务', '数据看板', '合规安全'],
    thesis: 'HR SaaS的价值不只是人事在线化，而是把组织运行变成可度量的管理系统。',
    bottlenecks: ['组织数据准确性', '薪税合规', '员工体验', '权限隐私', '系统集成'],
    tags: '#HRSaaS #人力资源 #组织管理 #企业服务 #SaaS #薪酬绩效 #数字化转型 #员工体验 #科技解剖 #B端产品',
  },
  {
    name: '财税SaaS',
    type: '应用生态',
    angle: '把票、账、税、报表、风控和合规申报拆开',
    layers: ['票据采集', '费用报销', '会计核算', '税务申报', '银企连接', '经营报表', '风控合规', '代账生态'],
    thesis: '财税SaaS真正处理的是企业资金流、发票流、业务流和合规责任的同步问题。',
    bottlenecks: ['政策变化', '数据准确性', '系统对接', '审计留痕', '客户信任'],
    tags: '#财税SaaS #财务数字化 #发票管理 #税务合规 #企业服务 #SaaS #经营分析 #代账 #科技解剖 #商业分析',
  },
  {
    name: '协同办公',
    type: '应用生态',
    angle: '把消息、文档、会议、项目、审批和知识流拆开',
    layers: ['身份组织', '即时沟通', '在线文档', '会议日程', '项目任务', '审批流程', '知识沉淀', '开放集成'],
    thesis: '协同办公不是把工具堆在一起，而是重塑企业内部信息流和决策流。',
    bottlenecks: ['信息过载', '权限边界', '迁移成本', '组织习惯', '跨工具割裂'],
    tags: '#协同办公 #办公软件 #企业微信 #飞书 #钉钉 #企业服务 #SaaS #知识管理 #数字化办公 #科技解剖',
  },
  {
    name: 'BI数据分析',
    type: '产品架构',
    angle: '把数据接入、建模、指标、可视化、权限和决策闭环拆开',
    layers: ['数据源', '数据清洗', '语义模型', '指标体系', '可视化看板', '权限治理', '自助分析', '决策闭环'],
    thesis: 'BI的难点不在画图，而在统一口径、治理数据，并让业务真的用它做决策。',
    bottlenecks: ['指标口径', '数据孤岛', '性能成本', '权限治理', '业务采纳'],
    tags: '#BI #数据分析 #数据可视化 #指标体系 #企业服务 #SaaS #数据治理 #商业智能 #科技解剖 #数字化转型',
  },
  {
    name: '低代码平台',
    type: '技术系统',
    angle: '把可视化建模、组件、流程、数据连接和治理边界拆开',
    layers: ['业务需求', '页面搭建', '数据模型', '流程引擎', '组件市场', 'API连接', '权限发布', '运维治理'],
    thesis: '低代码的本质是把一部分软件生产能力平台化，但复杂系统仍然需要工程治理。',
    bottlenecks: ['复杂度上限', '可维护性', '性能边界', '权限安全', '供应商锁定'],
    tags: '#低代码 #PaaS #企业服务 #软件开发 #数字化转型 #流程自动化 #SaaS #B端产品 #科技解剖 #应用开发',
  },
  {
    name: 'API经济',
    type: '应用生态',
    angle: '把能力封装、接口调用、开发者生态、计费和治理拆开',
    layers: ['核心能力', 'API网关', '认证鉴权', '开发者门户', '调用计量', '生态分发', '计费结算', '安全治理'],
    thesis: 'API经济把产品能力从界面里释放出来，让能力可以被调用、组合和按量商业化。',
    bottlenecks: ['稳定性', '安全风控', '文档体验', '计费模型', '生态冷启动'],
    tags: '#API经济 #开发者生态 #API网关 #企业服务 #PaaS #SaaS #开放平台 #数字化能力 #科技解剖 #商业模式',
  },
  {
    name: '企业微信生态',
    type: '应用生态',
    angle: '把组织通讯、客户连接、服务触点、应用集成和私域运营拆开',
    layers: ['组织通讯录', '员工协同', '客户连接', '社群运营', '应用市场', '数据接口', '服务商生态', '合规治理'],
    thesis: '企业微信生态的价值在于把内部组织和外部客户连接到同一个可信工作场景里。',
    bottlenecks: ['私域运营质量', '服务商能力', '数据边界', '员工执行', '客户打扰风险'],
    tags: '#企业微信 #私域运营 #企业服务 #SaaS生态 #客户连接 #协同办公 #服务商生态 #数字化转型 #科技解剖 #商业分析',
  },
  {
    name: 'PLG增长模式',
    type: '公司商业模式',
    angle: '把产品体验、免费入口、自助转化、协作传播和付费扩张拆开',
    layers: ['目标用户', '免费入口', '核心体验', '激活时刻', '协作传播', '自助购买', '团队扩张', '销售承接'],
    thesis: 'PLG不是不要销售，而是先让产品承担获客、激活和部分转化，再让销售接住高价值客户。',
    bottlenecks: ['激活门槛', '价值感知', '付费墙设计', '产品数据', '大客户转化'],
    tags: '#PLG #产品增长 #SaaS增长 #商业模式 #企业服务 #用户增长 #订阅制 #产品经理 #科技解剖 #B端增长',
  },
  {
    name: '私有化部署',
    type: '基础设施',
    angle: '把客户环境、部署交付、数据安全、运维升级和成本结构拆开',
    layers: ['客户内网', '基础资源', '应用部署', '数据隔离', '权限审计', '运维监控', '版本升级', '交付成本'],
    thesis: '私有化部署解决的是控制权和安全感，但代价是交付复杂度、升级成本和运维责任。',
    bottlenecks: ['交付周期', '环境差异', '升级困难', '运维责任', '毛利压力'],
    tags: '#私有化部署 #企业软件 #数据安全 #信创 #企业服务 #SaaS #本地化部署 #运维 #科技解剖 #B端产品',
  },
  {
    name: '客户成功体系',
    type: '公司商业模式',
    angle: '把交付、培训、使用率、健康度、续费和增购拆开',
    layers: ['客户分层', '上线交付', '培训启用', '使用监测', '健康评分', '问题响应', '续费管理', '增购扩张'],
    thesis: '客户成功不是售后客服，而是SaaS公司把收入留住并扩大的运营系统。',
    bottlenecks: ['服务成本', '客户分层', '数据监测', '价值证明', '续费风险'],
    tags: '#客户成功 #SaaS #续费 #企业服务 #客户运营 #B端增长 #商业模式 #数字化转型 #科技解剖 #订阅制',
  },
  {
    name: 'SaaS续费模型',
    type: '公司商业模式',
    angle: '把合同、使用深度、价值证明、流失风险和扩张收入拆开',
    layers: ['合同周期', '用户激活', '功能使用', '价值证明', '健康预警', '续费谈判', '增购扩张', '收入留存'],
    thesis: 'SaaS续费不是到期催款，而是整个周期里持续证明价值、降低流失和扩大账号收入。',
    bottlenecks: ['低使用率', '预算收缩', '替代竞争', '决策人变化', '价值不可见'],
    tags: '#SaaS续费 #订阅制 #客户成功 #NRR #企业服务 #商业模式 #B端增长 #续费率 #科技解剖 #收入模型',
  },
];

function wrapText(text, max = 18) {
  const chunks = [];
  let line = '';
  for (const char of text) {
    const wide = /[\u4e00-\u9fa5]/.test(char) ? 1 : 0.55;
    const size = [...line].reduce((sum, c) => sum + (/[\u4e00-\u9fa5]/.test(c) ? 1 : 0.55), 0);
    if (size + wide > max) {
      chunks.push(line);
      line = char;
    } else {
      line += char;
    }
  }
  if (line) chunks.push(line);
  return chunks;
}

function esc(text) {
  return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function promptFor(topic) {
  return `生成一张“${topic.name}技术结构解剖信息图”，使用 gpt-image-2，3072x4096，3:4 竖版小红书海报比例，high quality，PNG 输出，4K ultra high resolution，高清锐利细节，信息图文字在放大后依然清晰可读且不模糊，优先大字号标题、清晰模块名、低文字密度标注、避免微小文字，要求高对比文字区域、锐利边缘渲染、干净的信息图分隔线，风格参考人体解剖图、工业剖面图、芯片架构图、系统架构图、工程教学挂图和博物馆科技图谱。

解剖类型：${topic.type}。对象边界：只拆解“${topic.name}”在企业服务市场中的产品结构、价值流、商业化路径、成本结构与风险瓶颈；不做具体公司排名、市场份额、投资建议或未经验证的财务数据判断。

将${topic.name}像复杂机械或生物系统一样一层一层拆开，做成清晰的爆炸分解图、架构剖面图、价值链流向图和局部放大图。核心视角：${topic.angle}。

画面中心展示${topic.name}从底层资源到上层应用的分层结构：${topic.layers.join(' -> ')}。每一层都要被单独分离出来，悬浮排列，层级清楚，像医学解剖图那样一寸一寸拆开。

每个模块旁边都要有细致但可读的引线标注区域，说明这部分是什么、负责什么功能、依赖哪些上游、如何产生价值、主要成本或瓶颈在哪里。重点突出：${topic.thesis} 主要瓶颈包括：${topic.bottlenecks.join('、')}。所有标注必须控制数量并放大字号，确保放大查看时仍清晰，不要使用拥挤小字。

整体要有强烈的科学展示感、工程感和商业洞察感，像顶级科技研究机构制作的企业服务商业模式教学海报。视觉风格精密、清楚、理性、有秩序，构图像学术信息图，强调“结构拆解 + 功能解释 + 依赖关系 + 价值流动 + 真实瓶颈”。

采用高级纸张或冷静科技图谱背景，细腻线描，真实工业材质，少量蓝灰、银白、黑色、绿色数据流作为辅助色。不要赛博朋克霓虹，不要空泛未来感，不要只画芯片和光线。

请让版面清晰分区，包括：整体结构、上游基础设施、中游核心技术、下游应用场景、商业化路径、成本结构、风险瓶颈、代表性参与角色。整体版式必须优先 3:4 竖版 3072x4096 小红书 4K 海报构图，适合手机端浏览和发布；可以在单张图内保留小红书风格，但不要为了排满画面牺牲文字可读性，放大查看时文字边缘必须清晰锐利、不发虚、不糊成色块。

不要人物肖像，不要夸张机器人，不要无关装饰，不要营销海报风。重点是“逐层解剖 + 依赖关系 + 价值流动 + 真实瓶颈”。`;
}

function copyFor(topic) {
  const titles = [
    `${topic.name}到底怎么赚钱？`,
    `一张图拆开${topic.name}`,
    `${topic.name}不是表面看到的那样`,
    `企业服务里的${topic.name}核心逻辑`,
    `看懂${topic.name}的价值流和瓶颈`,
  ];
  return `5个标题

${titles.map((title, index) => `${index + 1}. ${title}`).join('\n')}

正文

很多人看${topic.name}，只看到一个软件入口。

但它真正复杂的地方，在入口背后：产品能力、业务流程、客户数据、交付体系、计费方式和长期续费，都被压进同一套企业服务系统里。

第一层是需求。企业不是为了“买软件”而买软件，而是为了降低管理摩擦、提高流程效率、沉淀数据资产，或者把原本靠人盯人的工作变成系统化协作。

第二层是产品结构。${topic.name}通常要拆成：${topic.layers.slice(0, 5).join('、')}等关键模块。每个模块看似独立，实际都在服务同一个目标：让业务过程可记录、可追踪、可分析、可优化。

第三层是商业化。${topic.thesis}

第四层是成本和风险。真正难的不是把功能做出来，而是解决${topic.bottlenecks.join('、')}这些长期问题。B端产品一旦进入客户组织，就会遇到流程、权限、数据、预算和使用习惯的真实阻力。

所以${topic.name}的本质，不是一个简单工具，而是一套把企业工作流、数据流和收入流连接起来的商业系统。

看懂它，就能看懂企业服务为什么慢、重、难，但一旦跑通又很有粘性。

你觉得${topic.name}最大的壁垒是产品能力，还是客户关系？

10个小红书标签

${topic.tags}
`;
}

function svgFor(topic, index) {
  const W = 1080;
  const H = 1440;
  const OUT_W = 3072;
  const OUT_H = 4096;
  const layerY = 310;
  const layerGap = 88;
  const colors = ['#1f5f8b', '#267b72', '#4b6b8f', '#6f7d4f', '#2f766d', '#735f91', '#5c7483', '#8a6a3d'];
  const title = wrapText(topic.name, 10);
  const thesis = wrapText(topic.thesis, 23);
  const bottleneckText = wrapText(`真实瓶颈：${topic.bottlenecks.join(' / ')}`, 20);
  const layerBlocks = topic.layers.map((layer, i) => {
    const y = layerY + i * layerGap;
    return `<g>
      <rect x="318" y="${y}" width="444" height="56" rx="8" fill="${colors[i % colors.length]}" opacity="0.96"/>
      <text x="540" y="${y + 36}" text-anchor="middle" font-size="28" font-weight="700" fill="#fff">${esc(layer)}</text>
      ${i < topic.layers.length - 1 ? `<path d="M540 ${y + 62} L540 ${y + 82}" stroke="#35495e" stroke-width="3" marker-end="url(#arrow)"/>` : ''}
    </g>`;
  }).join('\n');

  const sideLeft = ['对象边界', topic.type, '只拆企业服务中的产品结构、价值流、成本与风险，不做公司排名。'];
  const sideRight = ['商业洞察', topic.angle, topic.thesis];

  const textLines = (lines, x, y, max, size = 24, fill = '#263238') => lines.flatMap((line) => wrapText(line, max)).map((line, i) => `<text x="${x}" y="${y + i * (size + 10)}" font-size="${size}" fill="${fill}">${esc(line)}</text>`).join('\n');
  const section = (x, y, w, h, head, lines) => `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#ffffff" stroke="#d6dedc" stroke-width="2"/>
    <rect x="${x}" y="${y}" width="${w}" height="48" rx="10" fill="#eef5f1"/>
    <text x="${x + 24}" y="${y + 32}" font-size="24" font-weight="800" fill="#1f3d3b">${esc(head)}</text>
    ${textLines(lines, x + 24, y + 88, Math.floor((w - 44) / 24), 22)}
  </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OUT_W}" height="${OUT_H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="8" refY="6" orient="auto">
      <path d="M2,2 L10,6 L2,10 Z" fill="#35495e"/>
    </marker>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f7f4ec"/>
      <stop offset="1" stop-color="#e9f0ed"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#paper)"/>
  <rect x="34" y="34" width="1012" height="1372" rx="18" fill="none" stroke="#283b42" stroke-width="3"/>
  <text x="72" y="92" font-size="28" font-weight="700" fill="#345">TECH BUSINESS ANATOMY ${String(index + 1).padStart(2, '0')}</text>
  ${title.map((line, i) => `<text x="72" y="${165 + i * 66}" font-size="60" font-weight="900" fill="#102a32">${esc(line)}</text>`).join('\n')}
  <text x="72" y="260" font-size="28" font-weight="700" fill="#287066">${esc(topic.type)} 解剖图</text>
  <g opacity="0.55">
    <path d="M282 282 H798" stroke="#233" stroke-width="2"/>
    <path d="M282 1248 H798" stroke="#233" stroke-width="2"/>
  </g>
  ${layerBlocks}
  ${section(66, 348, 218, 318, sideLeft[0], sideLeft.slice(1))}
  ${section(796, 348, 218, 396, sideRight[0], sideRight.slice(1))}
  ${section(66, 710, 218, 338, '价值流动', ['需求进入产品', '产品沉淀数据', '使用形成粘性', '续费带来收入'])}
  ${section(796, 790, 218, 300, '成本结构', ['研发投入', '云资源成本', '销售获客', '实施交付', '客户成功'])}
  <g>
    <rect x="108" y="1138" width="864" height="132" rx="12" fill="#102a32" opacity="0.94"/>
    <text x="144" y="1184" font-size="27" font-weight="800" fill="#e7fff8">一句话看懂</text>
    ${thesis.slice(0, 3).map((line, i) => `<text x="144" y="${1228 + i * 34}" font-size="25" fill="#ffffff">${esc(line)}</text>`).join('\n')}
  </g>
  <g>
    <rect x="108" y="1294" width="864" height="72" rx="10" fill="#ffffff" stroke="#b8c8c5" stroke-width="2"/>
    ${bottleneckText.slice(0, 2).map((line, i) => `<text x="140" y="${1338 + i * 30}" font-size="22" font-weight="700" fill="#5a2d2d">${esc(line)}</text>`).join('\n')}
  </g>
</svg>`;
}

fs.mkdirSync(root, { recursive: true });
const manifest = [];

topics.forEach((topic, index) => {
  const dir = path.join(root, `${batch}-${String(index + 1).padStart(2, '0')}-${topic.name}-结构解剖`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '提示词.txt'), promptFor(topic), 'utf8');
  fs.writeFileSync(path.join(dir, '小红书文案.txt'), copyFor(topic), 'utf8');
  fs.writeFileSync(path.join(dir, '图片.svg'), svgFor(topic, index), 'utf8');
  manifest.push({ topic: topic.name, dir, svg: path.join(dir, '图片.svg') });
});

if (fs.existsSync(progressPath)) {
  const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  progress.used_big_modules = Array.from(new Set([...(progress.used_big_modules || []), 'SaaS / 企业服务']));
  progress.used_submodules = Array.from(new Set([...(progress.used_submodules || []), ...topics.map((item) => item.name)]));
  fs.writeFileSync(progressPath, `${JSON.stringify(progress, null, 2)}\n`, 'utf8');
}

fs.writeFileSync('/private/tmp/saas_tech_anatomy_manifest.json', `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(manifest.map((item) => item.dir).join('\n'));
