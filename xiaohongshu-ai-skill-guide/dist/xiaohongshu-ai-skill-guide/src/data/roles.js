// Roles are search-oriented personas, not a formal HR classification. The
// separate primary/secondary fields keep composite and cross-industry work
// understandable while industryIds remains convenient for catalog matching.
const WEIGHTS = [5, 4, 3, 3, 2, 2, 1, 1, 1, 1, 1, 1];

function taskWeights(taskIds) {
  return Object.freeze(Object.fromEntries(taskIds.map((taskId, index) => [taskId, WEIGHTS[index]])));
}

function role(id, name, primaryIndustryId, aliases, tasks, riskDomain = 'none', secondaryIndustryIds = [], extra = {}) {
  return Object.freeze({
    id,
    name,
    primaryIndustryId,
    secondaryIndustryIds: Object.freeze(secondaryIndustryIds),
    industryIds: Object.freeze([primaryIndustryId, ...secondaryIndustryIds]),
    aliases: Object.freeze(aliases),
    riskDomain,
    taskWeights: taskWeights(tasks),
    ...extra
  });
}

const ROLE_SPECS = [
  // 软件与互联网
  ['frontend-engineer', '前端工程师', 'software', ['前端', 'Web 开发'], ['frontend_development', 'web_design', 'interactive_prototyping', 'browser_testing', 'code_quality', 'security_review']],
  ['developer', '软件开发工程师', 'software', ['开发', '程序员'], ['backend_development', 'api_development', 'database_design', 'development_planning', 'code_quality', 'incident_response']],
  ['tester', '测试工程师', 'software', ['QA', '质量测试'], ['browser_testing', 'code_quality', 'usability_testing', 'security_review', 'incident_response', 'process_documentation']],
  ['product_manager', '产品经理', 'software', ['PM', '产品策划'], ['product_planning', 'audience_research', 'ux_research', 'wireframing', 'project_management', 'data_analysis']],
  // 电商与零售
  ['ecommerce-operator', '电商运营', 'ecommerce', ['店铺运营', '电商运营'], ['marketplace_operations', 'product_listing', 'merchandising', 'inventory_management', 'campaign_planning', 'data_analysis']],
  ['merchandiser', '商品运营', 'ecommerce', ['商品企划', '选品'], ['merchandising', 'demand_forecasting', 'price_optimization', 'inventory_management', 'product_listing', 'spreadsheet_analysis']],
  ['livestream-operator', '直播运营', 'ecommerce', ['直播', '直播间运营'], ['livestream_operations', 'script_writing', 'campaign_planning', 'community_operations', 'data_analysis', 'social_publishing']],
  ['customer-service-specialist', '客户服务专员', 'ecommerce', ['客服', '售后'], ['customer_support', 'crm_management', 'return_management', 'knowledge_management', 'data_analysis', 'internal_communications']],
  // 市场营销与广告
  ['marketer', '市场营销专员', 'marketing', ['市场', '营销'], ['campaign_planning', 'brand_positioning', 'copywriting', 'campaign_measurement', 'audience_research', 'presentation_design']],
  ['brand_manager', '品牌经理', 'marketing', ['品牌', '品牌管理'], ['brand_management', 'brand_positioning', 'visual_identity', 'campaign_planning', 'stakeholder_management', 'customer_support']],
  ['creative_director', '创意总监', 'marketing', ['创意', '创意策划'], ['campaign_planning', 'visual_design', 'copywriting', 'script_writing', 'brand_management', 'presentation_design']],
  ['advertising-planner', '广告策划', 'marketing', ['广告', '整合营销'], ['campaign_planning', 'media_buying', 'influencer_collaboration', 'copywriting', 'campaign_measurement', 'audience_research']],
  // 媒体、自媒体与内容
  ['content-creator', '内容创作者', 'media', ['内容博主', '自媒体'], ['content_authoring', 'content_research', 'script_writing', 'image_generation', 'short_video_editing', 'social_publishing']],
  ['creator', '自媒体创作者', 'media', ['博主', 'UP 主'], ['content_authoring', 'video_production', 'community_operations', 'brand_management', 'social_publishing', 'data_analysis']],
  ['editor', '内容编辑', 'media', ['编辑', '主编'], ['editorial_planning', 'content_authoring', 'content_research', 'copywriting', 'newsletter_authoring', 'web_publishing']],
  ['video_editor', '视频剪辑师', 'media', ['剪辑', '后期'], ['short_video_editing', 'video_production', 'audio_production', 'image_processing', 'script_writing', 'social_publishing']],
  // 教育与培训
  ['teacher', '教师与讲师', 'education', ['老师', '讲师'], ['lesson_planning', 'course_design', 'teaching_materials', 'assessment_design', 'learner_support', 'presentation_design']],
  ['learner', '学习者', 'education', ['学生', '自学者'], ['content_research', 'knowledge_management', 'course_design', 'document_authoring', 'presentation_design', 'translation_localization']],
  ['instructional-designer', '课程设计师', 'education', ['教学设计', '课程研发'], ['curriculum_development', 'course_design', 'learning_analytics', 'assessment_design', 'teaching_materials', 'ux_research']],
  ['course-operator', '课程运营', 'education', ['教培运营', '学习运营'], ['learner_support', 'community_operations', 'crm_management', 'course_design', 'data_analysis', 'social_publishing']],
  // 设计与创意
  ['designer', '视觉与产品设计师', 'design', ['设计师', 'UI 设计'], ['visual_design', 'design_systems', 'wireframing', 'image_generation', 'usability_testing', 'presentation_design']],
  ['artist', '插画与艺术创作者', 'design', ['插画师', '艺术家'], ['illustration', 'image_generation', 'visual_identity', 'content_authoring', 'social_publishing', 'brand_management']],
  ['motion_designer', '动效设计师', 'design', ['动效', '动画设计'], ['animation_design', 'video_production', 'visual_design', 'audio_production', 'script_writing', 'image_processing']],
  ['audio_editor', '音频编辑师', 'design', ['音频后期', '播客剪辑'], ['audio_production', 'podcast_editing', 'script_writing', 'content_authoring', 'video_production', 'knowledge_management']],
  // 咨询与专业服务
  ['consultant', '咨询顾问', 'consulting', ['顾问', '咨询'], ['market_sizing', 'competitive_analysis', 'recommendation_design', 'client_reporting', 'workshop_facilitation', 'presentation_design']],
  ['analyst', '业务分析师', 'consulting', ['商业分析', '分析师'], ['data_analysis', 'market_sizing', 'competitive_analysis', 'spreadsheet_analysis', 'diagramming', 'client_reporting']],
  ['strategy-consultant', '战略咨询顾问', 'consulting', ['战略', '战略咨询'], ['market_sizing', 'competitive_analysis', 'stakeholder_management', 'recommendation_design', 'executive_reporting', 'workshop_facilitation']],
  ['presentation-specialist', '演示设计顾问', 'consulting', ['PPT', '汇报材料'], ['presentation_design', 'diagramming', 'data_visualization', 'executive_reporting', 'document_authoring', 'visual_design']],
  // 企业服务与管理
  ['administrator', '行政专员', 'enterprise', ['行政', '综合管理'], ['meeting_facilitation', 'document_authoring', 'process_documentation', 'internal_communications', 'project_management', 'knowledge_management']],
  ['manager', '业务经理', 'enterprise', ['管理者', '负责人'], ['project_management', 'stakeholder_management', 'executive_reporting', 'process_documentation', 'change_management', 'data_analysis']],
  ['communicator', '内部沟通专员', 'enterprise', ['企业传播', '员工沟通'], ['internal_communications', 'copywriting', 'newsletter_authoring', 'meeting_facilitation', 'change_management', 'presentation_design']],
  ['project-manager', '项目经理', 'enterprise', ['项目管理', 'PMO'], ['project_management', 'stakeholder_management', 'process_documentation', 'risk_management', 'meeting_facilitation', 'executive_reporting']],
  // 金融与财务
  ['accountant', '会计', 'finance', ['财务会计', '核算'], ['financial_reporting', 'spreadsheet_analysis', 'variance_analysis', 'budget_planning', 'document_authoring', 'process_documentation'], 'financial'],
  ['financial-analyst', '金融分析师', 'finance', ['财务分析', '投研'], ['financial_modeling', 'investment_screening', 'financial_reporting', 'data_analysis', 'data_visualization', 'market_sizing'], 'financial'],
  ['investment-researcher', '投资研究员', 'finance', ['投研', '证券研究'], ['investment_screening', 'financial_modeling', 'content_research', 'data_analysis', 'financial_reporting', 'presentation_design'], 'financial'],
  ['finance-operations', '财务运营专员', 'finance', ['财务运营', '资金运营'], ['budget_planning', 'variance_analysis', 'crm_management', 'spreadsheet_analysis', 'process_documentation', 'customer_support'], 'financial'],
  // 人力资源
  ['hr_manager', '人力资源经理', 'hr', ['HR', '人事'], ['workforce_planning', 'performance_management', 'policy_communications', 'training_materials', 'stakeholder_management', 'data_analysis']],
  ['recruiter', '招聘专员', 'hr', ['招聘', '猎头'], ['candidate_sourcing', 'interview_coordination', 'crm_management', 'copywriting', 'data_analysis', 'candidate_assessment']],
  ['training-specialist', '培训专员', 'hr', ['企业培训', '学习发展'], ['course_design', 'lesson_planning', 'teaching_materials', 'learning_analytics', 'internal_communications', 'assessment_design']],
  ['employee-relations-specialist', '员工关系专员', 'hr', ['员工关系', '劳动关系'], ['policy_communications', 'internal_communications', 'case_management', 'process_documentation', 'knowledge_management', 'meeting_facilitation']],
  // 国际贸易与跨境
  ['foreign-trade-specialist', '外贸专员', 'international_trade', ['外贸', '进出口'], ['customs_documentation', 'export_sales', 'trade_compliance', 'translation_localization', 'supplier_sourcing', 'crm_management']],
  ['export-sales', '出口销售', 'international_trade', ['海外销售', '跨境销售'], ['export_sales', 'sales_enablement', 'crm_management', 'translation_localization', 'customer_support', 'campaign_planning']],
  ['procurement-specialist', '采购专员', 'international_trade', ['采购', '寻源'], ['supplier_sourcing', 'vendor_management', 'price_optimization', 'contract_review', 'supply_planning', 'spreadsheet_analysis']],
  ['translator', '跨境翻译与本地化专员', 'international_trade', ['翻译', '本地化'], ['translation_localization', 'localization_review', 'document_authoring', 'content_research', 'trade_compliance', 'customer_support']],
  // 法律与合规
  ['legal-counsel', '法务顾问', 'legal', ['法务', '律师'], ['contract_review', 'legal_research', 'regulatory_monitoring', 'policy_drafting', 'case_management', 'document_authoring'], 'legal'],
  ['contract-manager', '合同管理专员', 'legal', ['合同', '合同管理'], ['contract_review', 'case_management', 'process_documentation', 'policy_drafting', 'vendor_management', 'document_authoring'], 'legal'],
  ['compliance-specialist', '合规专员', 'legal', ['合规', '内控'], ['regulatory_monitoring', 'policy_drafting', 'risk_management', 'process_documentation', 'training_materials', 'internal_communications'], 'legal'],
  ['legal-researcher', '法律研究员', 'legal', ['法律研究', '法规研究'], ['legal_research', 'content_research', 'regulatory_monitoring', 'document_authoring', 'evidence_synthesis', 'presentation_design'], 'legal'],
  // 运营与供应链
  ['operator', '运营专员', 'operations', ['运营', '业务运营'], ['service_operations', 'data_analysis', 'process_documentation', 'customer_support', 'project_management', 'community_operations']],
  ['operations_manager', '运营经理', 'operations', ['运营管理', '运营负责人'], ['service_operations', 'supply_planning', 'vendor_management', 'process_optimization', 'data_analysis', 'executive_reporting']],
  ['community_manager', '社群运营', 'operations', ['社群', '用户运营'], ['community_operations', 'community_moderation', 'content_authoring', 'customer_support', 'event_operations', 'data_analysis']],
  ['supply-chain-coordinator', '供应链协调员', 'operations', ['供应链', '物流协调'], ['supply_planning', 'logistics_tracking', 'vendor_management', 'inventory_management', 'demand_forecasting', 'process_documentation']],
  // 研究与数据服务
  ['researcher', '研究员', 'research', ['研究', '调研'], ['content_research', 'survey_design', 'qualitative_coding', 'insight_synthesis', 'document_authoring', 'presentation_design']],
  ['data-analyst', '数据分析师', 'research', ['数据分析', '数据'], ['data_analysis', 'statistical_analysis', 'data_visualization', 'spreadsheet_analysis', 'insight_synthesis', 'survey_design']],
  ['user-researcher', '用户研究员', 'research', ['用户研究', 'UX 研究'], ['ux_research', 'interview_research', 'survey_design', 'qualitative_coding', 'usability_testing', 'insight_synthesis']],
  ['policy-researcher', '政策研究员', 'research', ['政策研究', '公共研究'], ['public_policy_research', 'content_research', 'data_analysis', 'evidence_synthesis', 'document_authoring', 'presentation_design']],
  // 医疗健康
  ['physician', '医师', 'healthcare', ['医生', '临床'], ['clinical_documentation', 'evidence_synthesis', 'patient_education', 'care_coordination', 'medication_information', 'content_research'], 'medical'],
  ['nurse', '护士', 'healthcare', ['护理', '护士'], ['care_coordination', 'patient_education', 'clinical_documentation', 'knowledge_management', 'process_documentation', 'internal_communications'], 'medical'],
  ['pharmacist', '药师', 'healthcare', ['药学', '药师'], ['medication_information', 'evidence_synthesis', 'patient_education', 'clinical_documentation', 'content_research', 'document_authoring'], 'medical'],
  ['health-educator', '健康教育工作者', 'healthcare', ['健康科普', '健康教育'], ['patient_education', 'content_authoring', 'content_research', 'visual_design', 'social_publishing', 'evidence_synthesis'], 'medical'],
  // 制造与工业
  ['product-engineer', '产品工程师', 'manufacturing', ['工程师', '产品工程'], ['process_optimization', 'quality_inspection', 'production_scheduling', 'document_authoring', 'data_analysis', 'project_management']],
  ['quality-engineer', '质量工程师', 'manufacturing', ['质量', '品控'], ['quality_inspection', 'process_optimization', 'statistical_analysis', 'process_documentation', 'incident_response', 'safety_training']],
  ['production-planner', '生产计划员', 'manufacturing', ['生产计划', '排产'], ['production_scheduling', 'demand_forecasting', 'inventory_management', 'supply_planning', 'spreadsheet_analysis', 'vendor_management']],
  ['industrial-designer', '工业设计师', 'manufacturing', ['工业设计', '产品设计'], ['visual_design', 'wireframing', 'usability_testing', 'process_documentation', 'presentation_design', 'photo_retouching']],
  // 房产与家居
  ['real-estate-agent', '房产经纪人', 'real_estate', ['房产销售', '经纪'], ['property_listing', 'customer_support', 'crm_management', 'market_appraisal', 'copywriting', 'image_processing']],
  ['property-manager', '物业管理师', 'real_estate', ['物业', '物业管理'], ['tenant_communications', 'service_operations', 'case_management', 'vendor_management', 'process_documentation', 'public_communications']],
  ['interior-consultant', '家居设计顾问', 'real_estate', ['家居', '室内设计'], ['interior_planning', 'visual_design', 'image_generation', 'customer_support', 'presentation_design', 'vendor_management']],
  ['real-estate-analyst', '房产分析师', 'real_estate', ['地产研究', '房产分析'], ['market_appraisal', 'market_sizing', 'data_analysis', 'data_visualization', 'content_research', 'presentation_design']],
  // 文旅、餐饮与酒店
  ['hotel-operator', '酒店运营', 'hospitality', ['酒店', '酒店管理'], ['reservation_management', 'guest_recovery', 'service_operations', 'customer_support', 'data_analysis', 'process_documentation']],
  ['travel-planner', '旅行策划师', 'hospitality', ['旅行', '旅游策划'], ['itinerary_planning', 'destination_research', 'customer_support', 'content_authoring', 'reservation_management', 'social_publishing']],
  ['chef', '厨师与餐饮研发', 'hospitality', ['厨师', '餐饮'], ['menu_planning', 'food_traceability', 'inventory_management', 'safety_training', 'content_authoring', 'process_documentation']],
  ['restaurant-manager', '餐厅经理', 'hospitality', ['餐饮运营', '店长'], ['service_operations', 'guest_recovery', 'inventory_management', 'menu_planning', 'vendor_management', 'data_analysis']],
  // 农业与食品
  ['farm-manager', '农场经营者', 'agriculture', ['农场', '种植'], ['crop_planning', 'farm_recordkeeping', 'field_observation', 'supply_planning', 'data_analysis', 'food_traceability']],
  ['agricultural-technician', '农业技术员', 'agriculture', ['农技', '农业技术'], ['agricultural_extension', 'field_observation', 'crop_planning', 'evidence_synthesis', 'farm_recordkeeping', 'content_authoring']],
  ['food-safety-specialist', '食品安全专员', 'agriculture', ['食品安全', '品控'], ['food_traceability', 'quality_inspection', 'safety_training', 'process_documentation', 'regulatory_monitoring', 'incident_response']],
  ['rural-content-creator', '乡村内容创作者', 'agriculture', ['三农博主', '乡村自媒体'], ['content_authoring', 'field_observation', 'short_video_editing', 'social_publishing', 'agricultural_extension', 'brand_management']],
  // 公共服务与公益
  ['public-affairs-specialist', '公共事务专员', 'public_services', ['公共事务', '政务'], ['public_policy_research', 'public_communications', 'stakeholder_management', 'document_authoring', 'meeting_facilitation', 'project_management']],
  ['nonprofit-operator', '公益项目运营', 'public_services', ['公益', '社会组织'], ['grant_writing', 'volunteer_coordination', 'project_management', 'public_communications', 'community_operations', 'data_analysis']],
  ['urban-service-coordinator', '城市服务协调员', 'public_services', ['城市服务', '社区治理'], ['service_design', 'stakeholder_management', 'case_management', 'public_communications', 'project_management', 'data_analysis']],
  ['community-social-worker', '社会工作者', 'public_services', ['社工', '社会服务'], ['case_management', 'community_operations', 'public_communications', 'service_design', 'knowledge_management', 'volunteer_coordination']],

  // Existing catalog roles that need their own searchable profile.
  ['developer_advocate', '开发者关系专员', 'software', ['开发者运营', 'DevRel'], ['content_authoring', 'api_development', 'community_operations', 'presentation_design', 'social_publishing', 'developer_relations']],
  ['producer', '内容制作人', 'media', ['制片', '制作人'], ['project_management', 'video_production', 'audio_production', 'script_writing', 'asset_management', 'stakeholder_management']],
  ['publisher', '内容发行专员', 'media', ['发行', '出版'], ['web_publishing', 'social_publishing', 'editorial_planning', 'newsletter_authoring', 'seo_optimization', 'content_research']],
  ['social_manager', '社交媒体运营', 'media', ['社媒运营', '新媒体运营'], ['social_publishing', 'community_operations', 'content_authoring', 'campaign_measurement', 'influencer_collaboration', 'data_analysis']],
  ['writer', '文案与写作专员', 'media', ['文案', '写作者'], ['copywriting', 'content_authoring', 'content_research', 'script_writing', 'document_authoring', 'translation_localization']],

  // Canonical component roles required by the approved composite personas.
  ['livestream-host', '直播主播', 'ecommerce', ['主播', '直播带货'], ['livestream_operations', 'script_writing', 'product_listing', 'customer_support', 'social_publishing', 'data_analysis'], 'none', ['media']],
  ['entrepreneur', '创业者', 'enterprise', ['创始人', '老板'], ['product_planning', 'brand_management', 'project_management', 'budget_planning', 'stakeholder_management', 'executive_reporting'], 'none', ['marketing']],
  ['marketing-lead', '营销负责人', 'marketing', ['市场负责人', '增长负责人'], ['campaign_planning', 'brand_positioning', 'campaign_measurement', 'media_buying', 'lead_generation', 'executive_reporting']],

  // The five approved composite personas. Each keeps its canonical components
  // so recommendations can explain the two work contexts without guessing.
  ['programmer-product-manager', '程序员产品经理', 'software', ['技术产品经理', '程序员兼产品'], ['product_planning', 'frontend_development', 'api_development', 'interactive_prototyping', 'development_planning', 'data_analysis'], 'none', [], { compositeOf: Object.freeze(['developer', 'product_manager']), reviewNote: '已复核：同时承担技术实现与产品决策。' }],
  ['designer-content-creator', '设计师内容创作者', 'design', ['设计博主', '创意自媒体'], ['visual_design', 'content_authoring', 'image_generation', 'short_video_editing', 'social_publishing', 'brand_management'], 'none', ['media'], { compositeOf: Object.freeze(['designer', 'content-creator']), reviewNote: '已复核：设计产出与内容发布均为核心工作。' }],
  ['teacher-content-creator', '教师内容创作者', 'education', ['知识博主', '教育自媒体'], ['lesson_planning', 'course_design', 'content_authoring', 'script_writing', 'video_production', 'social_publishing'], 'none', ['media'], { compositeOf: Object.freeze(['teacher', 'content-creator']), reviewNote: '已复核：教学设计与公开内容生产并行。' }],
  ['ecommerce-livestream-host', '电商直播主播', 'ecommerce', ['带货主播', '直播卖货'], ['livestream_operations', 'product_listing', 'script_writing', 'customer_support', 'campaign_measurement', 'social_publishing'], 'none', ['media'], { compositeOf: Object.freeze(['ecommerce-operator', 'livestream-host']), reviewNote: '已复核：店铺转化与主播表达均为核心工作。' }],
  ['entrepreneur-marketing-lead', '创业者兼营销负责人', 'enterprise', ['创始人营销', '创业增长负责人'], ['product_planning', 'brand_management', 'campaign_planning', 'lead_generation', 'budget_planning', 'executive_reporting'], 'none', ['marketing'], { compositeOf: Object.freeze(['entrepreneur', 'marketing-lead']), reviewNote: '已复核：经营决策与营销增长由同一负责人承担。' }]
];

export const ROLES = Object.freeze(ROLE_SPECS.map((spec) => role(...spec)));
