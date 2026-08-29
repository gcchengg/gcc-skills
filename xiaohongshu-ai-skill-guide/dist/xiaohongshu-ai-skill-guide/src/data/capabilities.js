// Capability records describe important unmet needs. They are deliberately
// recommendations for human process or specialist review, not repository links.
const CAPABILITY_SPECS = [
  ['specialist-clinical-judgment', '专科临床判断', '把症状、检查与病史置于专科诊疗语境中判断。', ['clinical_documentation', 'evidence_synthesis'], ['healthcare'], '医疗建议必须由具备资质的临床专业人员作出。'],
  ['jurisdiction-specific-legal-review', '辖区化法律审阅', '按适用法域、最新法规与事实材料完成法律审阅。', ['contract_review', 'legal_research'], ['legal', 'international_trade'], '不同地区的法律规则和执业资格不能由通用工具替代。'],
  ['physical-safety-validation', '物理安全验证', '在真实场地、设备和人员条件下验证安全风险。', ['safety_training', 'site_inspection'], ['manufacturing', 'hospitality', 'agriculture'], '文本建议无法证明现场操作安全。'],
  ['domain-specific-field-observation', '领域现场观察', '通过实地观察捕捉环境、流程与使用者的真实限制。', ['field_observation', 'site_inspection'], ['agriculture', 'real_estate', 'public_services'], '一手观察能避免用脱离现场的假设做决策。'],
  ['regulated-financial-signoff', '受监管财务签字', '对法定财报、税务与披露材料承担专业签字责任。', ['financial_reporting', 'budget_planning'], ['finance'], '关键财务结论需要持证人员复核和承担责任。'],
  ['medication-dispensing-check', '处方与配药核验', '核验处方、剂量、禁忌和配药流程。', ['medication_information', 'care_coordination'], ['healthcare'], '用药错误具有直接人身风险。'],
  ['emergency-incident-command', '紧急事件现场指挥', '在突发事件中完成分级、指挥和资源调度。', ['incident_response', 'service_operations'], ['public_services', 'healthcare', 'manufacturing'], '高压现场需要明确授权与实时态势判断。'],
  ['labor-relations-negotiation', '劳动关系谈判', '处理劳动争议、集体协商和敏感沟通。', ['case_management', 'policy_communications'], ['hr', 'legal'], '涉及权利义务与关系修复，应由合格人员主导。'],
  ['privacy-impact-assessment', '隐私影响评估', '评估个人信息处理目的、最小化与跨境风险。', ['security_review', 'process_documentation'], ['software', 'enterprise', 'healthcare'], '需要结合具体数据流、法域与组织控制措施。'],
  ['independent-audit-evidence', '独立审计取证', '取得、评价并保全可审计证据。', ['financial_reporting', 'process_documentation'], ['finance', 'enterprise'], '独立性和证据链是审计结论的前提。'],
  ['laboratory-method-validation', '实验室方法验证', '确认检验方法的准确度、精密度和适用范围。', ['quality_inspection', 'evidence_synthesis'], ['healthcare', 'manufacturing', 'agriculture'], '实验方法需要受控环境与可追溯记录。'],
  ['clinical-trial-oversight', '临床研究监督', '监督受试者保护、方案偏离和不良事件处理。', ['clinical_documentation', 'regulatory_monitoring'], ['healthcare'], '临床研究有严格伦理与监管要求。'],
  ['tax-jurisdiction-determination', '税务法域判定', '依据主体、交易和发生地确定税务处理。', ['financial_reporting', 'legal_research'], ['finance', 'international_trade'], '跨地区税务处理依赖持续变化的具体规则。'],
  ['investment-suitability-assessment', '投资适当性评估', '根据客户风险承受能力和产品特征作出适当性判断。', ['investment_screening', 'customer_support'], ['finance'], '面向个人的投资建议必须符合监管与适当性要求。'],
  ['food-safety-onsite-audit', '食品安全现场审核', '检查卫生、冷链、交叉污染和追溯记录。', ['food_traceability', 'site_inspection'], ['agriculture', 'hospitality'], '食品安全需要现场采样、检测和责任人确认。'],
  ['construction-structural-review', '建筑结构复核', '审查结构安全、荷载与施工条件。', ['site_inspection', 'document_authoring'], ['real_estate', 'manufacturing'], '结构判断必须由具备资质的工程专业人员负责。'],
  ['accessibility-usability-observation', '无障碍实测', '和真实用户一起测试无障碍与可用性。', ['usability_testing', 'field_observation'], ['software', 'public_services', 'education'], '模拟检查无法替代真实使用者的体验反馈。'],
  ['cultural-context-interviewing', '文化语境访谈', '在当地文化语境中进行深度访谈和解释。', ['interview_research', 'translation_localization'], ['research', 'international_trade', 'public_services'], '语言翻译不等于理解文化和权力关系。'],
  ['brand-approval-governance', '品牌审批治理', '对外发布前确认商标、表述和品牌边界。', ['brand_management', 'social_publishing'], ['marketing', 'media', 'ecommerce'], '组织声誉和商标使用需要明确责任人。'],
  ['rights-clearance', '版权与肖像授权清理', '确认素材、音乐、肖像和二次创作的授权范围。', ['asset_management', 'video_production'], ['media', 'design', 'marketing'], '生成或编辑素材不自动取得合法使用权。'],
  ['procurement-commercial-negotiation', '采购商务谈判', '评估供应商能力并谈判价格、交付与违约条款。', ['supplier_sourcing', 'vendor_management'], ['operations', 'international_trade', 'manufacturing'], '商业判断需要实时市场信息与授权边界。'],
  ['quality-sampling-plan', '质量抽样方案', '按风险与批次制定抽样、复检和放行规则。', ['quality_inspection', 'statistical_analysis'], ['manufacturing', 'agriculture'], '抽样计划影响产品放行和消费者安全。'],
  ['production-equipment-calibration', '生产设备校准', '校准、维护并记录关键生产与检测设备。', ['maintenance_planning', 'quality_inspection'], ['manufacturing'], '设备状态必须通过现场量测确认。'],
  ['supply-disruption-escalation', '供应中断升级处置', '处理断供、延误与替代供应风险。', ['supply_planning', 'logistics_tracking'], ['operations', 'manufacturing', 'ecommerce'], '中断处置依赖库存、合同和现场实际情况。'],
  ['customer-vulnerability-support', '脆弱客户支持', '识别并支持处于危机、疾病或弱势状态的服务对象。', ['customer_support', 'case_management'], ['public_services', 'healthcare', 'hospitality'], '需要训练有素的人员判断风险并转介。'],
  ['educational-assessment-moderation', '教育测评阅卷与调节', '确保评分标准、公平性和特殊需求支持。', ['assessment_design', 'education_assessment'], ['education'], '高影响评价需要人为复核与申诉机制。'],
  ['child-safeguarding-review', '未成年人保护审查', '评估内容、服务和活动对未成年人的风险。', ['risk_management', 'content_authoring'], ['education', 'media', 'public_services'], '儿童保护要求专业培训、报告机制和持续监督。'],
  ['real-estate-valuation-inspection', '房产估值与查验', '在现场、权属和区域交易证据基础上评估价值。', ['market_appraisal', 'site_inspection'], ['real_estate'], '房产价值依赖实物状况和当地市场证据。'],
  ['agronomic-diagnosis', '农艺诊断', '结合作物、生长阶段、气象和土壤进行诊断。', ['field_observation', 'crop_planning'], ['agriculture'], '远程图文不足以确认病虫害或种植方案。'],
  ['public-policy-stakeholder-deliberation', '公共政策利益相关方协商', '组织受影响群体参与、记录分歧并形成权衡。', ['public_policy_research', 'stakeholder_management'], ['public_services'], '公共决策需要正当程序与真实参与。'],
  ['translation-certified-review', '认证翻译复核', '对需要认证、宣誓或法律效力的翻译进行复核。', ['translation_localization', 'localization_review'], ['international_trade', 'legal'], '正式文件常要求具备特定资质的译者。'],
  ['information-security-penetration-test', '渗透测试与安全验证', '在授权范围内验证系统真实暴露面。', ['security_review', 'incident_response'], ['software', 'enterprise'], '安全结论需要受控测试和责任边界。'],
  ['human-factors-safety-review', '人因安全评审', '从真实操作、疲劳和误用角度评估风险。', ['field_observation', 'safety_training'], ['manufacturing', 'healthcare', 'hospitality'], '安全问题常来自真实使用条件而非文档描述。'],
  ['executive-accountability-decision', '管理层责任决策', '在目标冲突、资源约束和风险之间作最终取舍。', ['executive_reporting', 'risk_management'], ['enterprise', 'consulting', 'public_services'], '责任、授权与价值判断应由组织负责人承担。'],
  ['community-trust-building', '社区信任建立', '通过长期面对面互动建立社区关系与反馈闭环。', ['community_operations', 'public_communications'], ['public_services', 'operations', 'agriculture'], '信任来自持续关系，不能由自动化沟通替代。']
];

export const CAPABILITIES = Object.freeze(CAPABILITY_SPECS.map(([id, name, summary, taskTags, industryIds, whyItMatters]) => Object.freeze({
  id,
  name,
  summary,
  taskTags: Object.freeze(taskTags),
  industryIds: Object.freeze(industryIds),
  whyItMatters
})));
