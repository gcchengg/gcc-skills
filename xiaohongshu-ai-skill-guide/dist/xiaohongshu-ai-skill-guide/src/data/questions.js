import { ROLES } from './roles.js';

const ROLE_BY_ID = new Map(ROLES.map((role) => [role.id, role]));

function option(id, label, taskDeltas) {
  return Object.freeze({ id, label, delta: 1, taskDeltas: Object.freeze(taskDeltas) });
}

const TEMPLATES = Object.freeze([
  Object.freeze({
    id: 'frequent-work',
    prompt: '你最常重复处理哪些工作？',
    helpText: '最多选 2 项，优先选择每周都会出现的具体工作。',
    options: Object.freeze([
      option('build-digital-experience', '搭建或修改网页、接口和交互流程', { frontend_development: 3, api_development: 2, interactive_prototyping: 2 }),
      option('write-and-package-content', '写选题、脚本、文章或短视频内容', { content_authoring: 3, script_writing: 2, short_video_editing: 2 }),
      option('analyze-business-signals', '整理表格、指标并解释业务变化', { data_analysis: 3, spreadsheet_analysis: 2, data_visualization: 2 }),
      option('plan-campaign-or-growth', '策划活动、投放或增长动作', { campaign_planning: 3, campaign_measurement: 2, audience_research: 2 }),
      option('serve-customers-and-community', '回复客户、维护社群或处理服务问题', { customer_support: 3, community_operations: 2, crm_management: 2 }),
      option('coordinate-delivery', '排期、协调多人并推进交付', { project_management: 3, process_documentation: 2, stakeholder_management: 2 }),
      option('produce-visual-media', '制作图片、演示、音频或视频素材', { visual_design: 3, video_production: 2, image_generation: 2 }),
      option('research-and-summarize', '检索资料、访谈调研并形成结论', { content_research: 3, interview_research: 2, insight_synthesis: 2 }),
      option('run-field-operations', '处理现场、门店、生产或服务运营', { service_operations: 3, field_observation: 2, production_scheduling: 2 }),
      option('prepare-regulated-materials', '准备合同、财务、医疗或合规材料', { document_authoring: 2, contract_review: 3, financial_reporting: 3, clinical_documentation: 3 })
    ])
  }),
  Object.freeze({
    id: 'desired-improvement',
    prompt: '你最希望把哪类工作提升得更快或更稳？',
    helpText: '最多选 2 项，选择你愿意马上改变工作方式的环节。',
    options: Object.freeze([
      option('turn-brief-into-draft', '把零散需求更快变成可修改的初稿', { document_authoring: 3, copywriting: 2, presentation_design: 2 }),
      option('turn-data-into-decision', '把数据更快变成可解释的判断和汇报', { data_analysis: 3, insight_synthesis: 3, executive_reporting: 2 }),
      option('make-content-consistent', '让内容在不同渠道保持统一表达', { content_authoring: 3, brand_management: 2, social_publishing: 2 }),
      option('reduce-repetitive-coordination', '减少反复同步、催办和状态整理', { project_management: 3, process_documentation: 2, internal_communications: 2 }),
      option('improve-discovery-and-design', '更快验证用户需求、方案或设计取舍', { ux_research: 3, wireframing: 2, usability_testing: 2 }),
      option('improve-customer-response', '更快给出一致、可追溯的客户回复', { customer_support: 3, knowledge_management: 2, crm_management: 2 }),
      option('improve-production-quality', '提升素材、视频或产品输出的一致性', { visual_design: 2, video_production: 2, quality_inspection: 3 }),
      option('organize-domain-knowledge', '把专业资料沉淀成可复用的知识库', { knowledge_management: 3, content_research: 2, process_documentation: 2 }),
      option('forecast-and-plan', '更早发现需求、库存、预算或排期风险', { demand_forecasting: 3, budget_planning: 2, supply_planning: 2 }),
      option('improve-public-or-field-service', '把现场观察转成更清晰的服务方案', { field_observation: 3, service_design: 2, public_communications: 2 })
    ])
  }),
  Object.freeze({
    id: 'largest-pain',
    prompt: '现在最拖慢你的痛点是什么？',
    helpText: '最多选 2 项，选择最常导致返工、等待或出错的原因。',
    options: Object.freeze([
      option('sources-are-scattered', '信息来源分散，难以检索、核对和引用', { content_research: 3, knowledge_management: 2, data_extraction: 2 }),
      option('feedback-loops-are-slow', '反馈来得慢，改稿或改方案轮次太多', { collaboration_feedback: 3, project_management: 2, usability_testing: 2 }),
      option('numbers-are-hard-to-explain', '数字很多，但难以说清原因和下一步', { data_analysis: 3, data_visualization: 2, insight_synthesis: 2 }),
      option('content-is-hard-to-produce', '内容或素材生产慢，风格也不稳定', { content_authoring: 3, visual_design: 2, image_generation: 2 }),
      option('handoffs-are-unclear', '多人交接不清楚，状态和责任容易丢失', { process_documentation: 3, stakeholder_management: 2, project_management: 2 }),
      option('customer-context-is-missing', '服务时看不到客户背景和历史问题', { crm_management: 3, customer_support: 2, knowledge_management: 2 }),
      option('quality-is-hard-to-check', '交付前难以及时发现质量、安全或合规问题', { quality_inspection: 3, security_review: 2, regulatory_monitoring: 2 }),
      option('planning-is-reactive', '需求、排期或资源变化后才被动处理', { demand_forecasting: 3, production_scheduling: 2, project_management: 2 }),
      option('field-reality-is-missed', '资料与现场情况脱节，无法确认真实限制', { field_observation: 3, site_inspection: 2, care_coordination: 2 }),
      option('professional-review-is-required', '需要专业判断或审批，不能只靠通用建议', { evidence_synthesis: 2, legal_research: 2, financial_reporting: 2, clinical_documentation: 2 })
    ])
  })
]);

function aggregateWeights(roleIds) {
  const weights = new Map();
  for (const roleId of roleIds) {
    const role = ROLE_BY_ID.get(roleId);
    if (!role) continue;
    for (const [taskId, weight] of Object.entries(role.taskWeights)) {
      weights.set(taskId, (weights.get(taskId) ?? 0) + weight);
    }
  }
  return weights;
}

function optionScore(optionRecord, weights) {
  return Object.entries(optionRecord.taskDeltas).reduce(
    (score, [taskId, delta]) => score + ((weights.get(taskId) ?? 0) * Math.abs(delta)),
    0
  );
}

function renderQuestion(template, weights) {
  const ranked = template.options
    .map((choice, index) => ({ choice, index, score: optionScore(choice, weights) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 5)
    .map(({ choice }) => choice);
  return Object.freeze({
    id: template.id,
    prompt: template.prompt,
    helpText: template.helpText,
    maxSelections: 2,
    options: Object.freeze(ranked)
  });
}

/** Render the three concise, role-sensitive onboarding questions. */
export function getQuestions(roleIds = []) {
  const weights = aggregateWeights(Array.isArray(roleIds) ? roleIds : []);
  return Object.freeze(TEMPLATES.map((template) => renderQuestion(template, weights)));
}
