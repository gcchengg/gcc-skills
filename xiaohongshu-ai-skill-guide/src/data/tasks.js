// Canonical task registry. It deliberately does not depend on skills or
// capability gaps, so all recommendation sources share the same vocabulary.
const TASK_SPECS = [
  ['agent_authoring', '智能体能力设计'], ['api_development', 'API 开发'], ['audio_production', '音频制作'], ['brand_management', '品牌管理'], ['browser_testing', '浏览器测试'],
  ['code_quality', '代码质量保障'], ['community_operations', '社群运营'], ['content_authoring', '内容创作'], ['content_research', '内容研究'], ['data_analysis', '数据分析'],
  ['data_extraction', '信息提取'], ['development_planning', '研发规划'], ['diagramming', '图表绘制'], ['document_authoring', '文档写作'], ['image_generation', '图像生成'],
  ['image_processing', '图像处理'], ['internal_communications', '内部沟通'], ['interactive_prototyping', '交互原型'], ['knowledge_management', '知识管理'], ['pdf_processing', 'PDF 处理'],
  ['presentation_design', '演示设计'], ['product_planning', '产品规划'], ['project_management', '项目管理'], ['social_publishing', '社交媒体发布'], ['spreadsheet_analysis', '电子表格分析'],
  ['translation_localization', '翻译与本地化'], ['video_production', '视频制作'], ['visual_design', '视觉设计'], ['web_design', '网页设计'], ['web_publishing', '网页发布'],

  ['audience_research', '受众研究'], ['copywriting', '文案写作'], ['script_writing', '脚本撰写'], ['campaign_planning', '营销活动策划'], ['seo_optimization', '搜索优化'],
  ['customer_support', '客户支持'], ['sales_enablement', '销售支持'], ['crm_management', '客户关系管理'], ['inventory_management', '库存管理'], ['demand_forecasting', '需求预测'],
  ['price_optimization', '定价优化'], ['livestream_operations', '直播运营'], ['short_video_editing', '短视频剪辑'], ['course_design', '课程设计'], ['lesson_planning', '教学备课'],
  ['assessment_design', '测评设计'], ['ux_research', '用户体验研究'], ['wireframing', '线框原型'], ['usability_testing', '可用性测试'], ['security_review', '安全审查'],

  ['frontend_development', '前端开发'], ['backend_development', '后端开发'], ['database_design', '数据库设计'], ['devops_automation', '研发运维自动化'], ['incident_response', '故障响应'],
  ['merchandising', '商品企划'], ['product_listing', '商品上架'], ['marketplace_operations', '店铺平台运营'], ['fulfillment_coordination', '履约协调'], ['return_management', '退换货管理'],
  ['media_buying', '媒体投放'], ['campaign_measurement', '营销效果衡量'], ['brand_positioning', '品牌定位'], ['lead_generation', '线索获取'], ['influencer_collaboration', '达人合作'],
  ['editorial_planning', '选题编辑策划'], ['interview_research', '访谈调研'], ['podcast_editing', '播客剪辑'], ['newsletter_authoring', '通讯撰写'], ['community_moderation', '社区治理'],
  ['curriculum_development', '课程体系开发'], ['learning_analytics', '学习分析'], ['teaching_materials', '教学材料制作'], ['learner_support', '学习者支持'], ['education_assessment', '教育评估'],
  ['design_systems', '设计系统'], ['visual_identity', '视觉识别设计'], ['illustration', '插画创作'], ['animation_design', '动画设计'], ['photo_retouching', '图片精修'],
  ['market_sizing', '市场规模测算'], ['competitive_analysis', '竞争分析'], ['workshop_facilitation', '工作坊引导'], ['client_reporting', '客户报告'], ['recommendation_design', '建议方案设计'],
  ['meeting_facilitation', '会议引导'], ['process_documentation', '流程文档化'], ['change_management', '变革管理'], ['stakeholder_management', '干系人管理'], ['executive_reporting', '管理层汇报'],
  ['financial_modeling', '财务建模'], ['budget_planning', '预算规划'], ['financial_reporting', '财务报告'], ['variance_analysis', '差异分析'], ['investment_screening', '投资筛选'],
  ['candidate_sourcing', '候选人寻访'], ['interview_coordination', '招聘面试协调'], ['performance_management', '绩效管理'], ['workforce_planning', '人力规划'], ['policy_communications', '人事制度沟通'],
  ['customs_documentation', '报关资料'], ['export_sales', '出口销售'], ['supplier_sourcing', '供应商寻源'], ['localization_review', '本地化审校'], ['trade_compliance', '贸易合规'],
  ['contract_review', '合同审阅'], ['legal_research', '法律检索'], ['regulatory_monitoring', '法规跟踪'], ['policy_drafting', '制度起草'], ['case_management', '案件管理'],
  ['supply_planning', '供应计划'], ['logistics_tracking', '物流追踪'], ['service_operations', '服务运营'], ['event_operations', '活动运营'], ['vendor_management', '供应商管理'],
  ['survey_design', '问卷设计'], ['qualitative_coding', '质性编码'], ['statistical_analysis', '统计分析'], ['data_visualization', '数据可视化'], ['insight_synthesis', '洞察综合'],
  ['clinical_documentation', '临床文档整理'], ['patient_education', '患者教育'], ['medication_information', '用药信息整理'], ['care_coordination', '照护协调'], ['evidence_synthesis', '证据综合'],
  ['production_scheduling', '生产排程'], ['quality_inspection', '质量检验'], ['maintenance_planning', '设备维护规划'], ['process_optimization', '工艺优化'], ['safety_training', '安全培训'],
  ['property_listing', '房源发布'], ['tenant_communications', '租客沟通'], ['market_appraisal', '市场估值'], ['site_inspection', '现场查验'], ['interior_planning', '室内方案规划'],
  ['itinerary_planning', '行程规划'], ['reservation_management', '预订管理'], ['menu_planning', '菜单规划'], ['guest_recovery', '客诉挽回'], ['destination_research', '目的地研究'],
  ['crop_planning', '种植规划'], ['farm_recordkeeping', '农事记录'], ['food_traceability', '食品追溯'], ['agricultural_extension', '农技推广'], ['field_observation', '田间观察'],
  ['public_policy_research', '公共政策研究'], ['service_design', '公共服务设计'], ['grant_writing', '项目申报写作'], ['volunteer_coordination', '志愿者协调'], ['public_communications', '公共沟通'],
  ['risk_management', '风险管理'], ['training_materials', '培训材料制作'], ['candidate_assessment', '候选人评估'], ['developer_relations', '开发者关系运营'], ['asset_management', '素材资产管理'],
  ['collaboration_feedback', '协作反馈']
];

export const TASKS = Object.freeze(TASK_SPECS.map(([id, name]) => Object.freeze({ id, name })));
