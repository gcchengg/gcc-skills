import { CATALOG_META } from './meta.js';

const REPOSITORIES = Object.freeze({
  baoyu: {
    owner: 'JimLiu/baoyu-skills',
    commit: '6b7a2e417500561a5ecdd0b168332f4142584617'
  },
  anthropics: {
    owner: 'anthropics/skills',
    commit: '3b3fad96af16a10759d930941b4520ba0c40edae'
  },
  hyperframes: {
    owner: 'heygen-com/hyperframes',
    commit: 'af1cb1c10da33bade100db8233435c7591b7c0bc'
  }
});

function sourceUrl(repository, sourcePath) {
  const { owner, commit } = REPOSITORIES[repository];
  return `https://github.com/${owner}/blob/${commit}/${sourcePath}`;
}

const SOFTWARE_DEVELOPMENT_ONLY_IDS = new Set([
  'anthropic-claude-api',
  'anthropic-frontend-design',
  'anthropic-mcp-builder',
  'anthropic-skill-creator',
  'anthropic-webapp-testing'
]);

function skill([id, name, summary, repository, sourcePath, taskTags, industryIds, roleIds, qualityGrade, learningCost, riskNote]) {
  const githubUrl = sourceUrl(repository, sourcePath);
  return Object.freeze({
    id,
    name,
    summary,
    githubUrl,
    taskTags: Object.freeze(taskTags),
    industryIds: Object.freeze(industryIds),
    roleIds: Object.freeze(roleIds),
    qualityGrade,
    learningCost,
    evidence: githubUrl,
    verifiedAt: CATALOG_META.verifiedAt,
    riskNote,
    softwareDevelopmentOnly: SOFTWARE_DEVELOPMENT_ONLY_IDS.has(id)
  });
}

// Each GitHub URL is a commit-pinned, individual SKILL.md source. This allows
// independently useful skills in an authoritative collection to stay distinct.
const SPECS = [
  ['baoyu-article-illustrator', '文章插画编排', '分析文章结构，在合适位置生成匹配主题与调色的辅助插画。', 'baoyu', 'skills/baoyu-article-illustrator/SKILL.md', ['content_authoring', 'visual_design'], ['media', 'marketing'], ['editor', 'marketer'], 'B', 'medium', '生成图需复核事实、版权与品牌一致性。'],
  ['baoyu-comic', '知识漫画创作', '把知识主题拆成分镜并生成多风格教育漫画。', 'baoyu', 'skills/baoyu-comic/SKILL.md', ['content_authoring', 'visual_design'], ['education', 'media'], ['teacher', 'creator'], 'B', 'medium', '角色与画面文字需人工校对。'],
  ['baoyu-compress-image', '图片压缩', '将图片压缩为 WebP 或 PNG，并在体积与清晰度间选择处理方案。', 'baoyu', 'skills/baoyu-compress-image/SKILL.md', ['image_processing'], ['ecommerce', 'media'], ['designer', 'operator'], 'B', 'low', '压缩前应保留原始文件。'],
  ['baoyu-cover-image', '文章封面生成', '按类型、配色、渲染、文字和情绪生成文章封面。', 'baoyu', 'skills/baoyu-cover-image/SKILL.md', ['image_generation', 'brand_management'], ['media', 'marketing'], ['editor', 'brand_manager'], 'B', 'medium', '封面文案和商标使用需要人工审核。'],
  ['baoyu-gemini-web', '多模态内容生成', '通过配置的 Gemini Web 接口生成文本或图片，并支持基于输入图的编辑。', 'baoyu', 'skills/baoyu-danger-gemini-web/SKILL.md', ['content_authoring', 'image_generation'], ['marketing', 'education'], ['creator', 'teacher'], 'B', 'high', '依赖第三方接口；不得提交敏感数据。'],
  ['baoyu-x-to-markdown', 'X 内容归档', '将 X 帖子和文章提取为带 YAML 元数据的 Markdown 归档。', 'baoyu', 'skills/baoyu-danger-x-to-markdown/SKILL.md', ['data_extraction', 'content_research'], ['media', 'research'], ['researcher', 'editor'], 'B', 'medium', '遵守平台条款，并核验提取内容。'],
  ['baoyu-diagram', '专业 SVG 图表', '把架构、流程或结构说明转成深色专业 SVG 图表。', 'baoyu', 'skills/baoyu-diagram/SKILL.md', ['diagramming', 'visual_design'], ['consulting', 'education'], ['analyst', 'teacher'], 'B', 'medium', '图表关系和数据标签需人工复核。'],
  ['baoyu-electron-extract', 'Electron 数据提取', '从 Electron 桌面应用中提取可访问内容，供后续结构化处理。', 'baoyu', 'skills/baoyu-electron-extract/SKILL.md', ['data_extraction'], ['research', 'operations'], ['researcher', 'operator'], 'B', 'high', '仅处理获授权的本地应用和数据。'],
  ['baoyu-format-markdown', 'Markdown 排版', '为纯文本或 Markdown 补全结构、摘要、标题和常用排版。', 'baoyu', 'skills/baoyu-format-markdown/SKILL.md', ['document_authoring', 'web_publishing'], ['media', 'education'], ['editor', 'teacher'], 'B', 'low', '格式化后仍需检查事实与链接。'],
  ['baoyu-image-gen', '多模型图片生成', '根据提示词调用支持的图像模型，生成或编辑营销与内容图片。', 'baoyu', 'skills/baoyu-image-gen/SKILL.md', ['image_generation'], ['marketing', 'media'], ['designer', 'marketer'], 'B', 'medium', '模型输出可能涉及风格和版权风险。'],
  ['baoyu-infographic', '信息图制作', '从内容中选择布局和视觉风格，生成专业信息图。', 'baoyu', 'skills/baoyu-infographic/SKILL.md', ['diagramming', 'visual_design'], ['consulting', 'media'], ['analyst', 'marketer'], 'B', 'medium', '图中数字、比例和来源必须校验。'],
  ['baoyu-markdown-to-html', 'Markdown 转 HTML', '将 Markdown 转为带主题、代码高亮和数学公式的 HTML。', 'baoyu', 'skills/baoyu-markdown-to-html/SKILL.md', ['document_authoring', 'web_publishing'], ['media', 'education'], ['editor', 'publisher'], 'B', 'medium', '发布前在目标平台预览样式。'],
  ['baoyu-post-to-wechat', '公众号发布', '通过 API 或浏览器流程把文章内容发布到微信公众号。', 'baoyu', 'skills/baoyu-post-to-wechat/SKILL.md', ['social_publishing', 'content_authoring'], ['marketing', 'media'], ['marketer', 'editor'], 'B', 'high', '属于外部发布操作，需确认账号和最终文稿。'],
  ['baoyu-post-to-weibo', '微博发布', '将文字、图片、视频或头条文章发布到微博。', 'baoyu', 'skills/baoyu-post-to-weibo/SKILL.md', ['social_publishing'], ['marketing', 'media'], ['social_manager', 'marketer'], 'B', 'high', '属于外部发布操作，需确认受众与合规性。'],
  ['baoyu-post-to-x', 'X 发布', '将帖子、媒体或长文发布到 X 平台。', 'baoyu', 'skills/baoyu-post-to-x/SKILL.md', ['social_publishing'], ['marketing', 'media'], ['social_manager', 'marketer'], 'B', 'high', '属于外部发布操作，需确认平台政策。'],
  ['baoyu-slide-deck', '幻灯片图片生成', '根据内容规划专业演示文稿，并生成逐页幻灯片图像。', 'baoyu', 'skills/baoyu-slide-deck/SKILL.md', ['presentation_design', 'visual_design'], ['consulting', 'education'], ['consultant', 'teacher'], 'B', 'medium', '数据和演讲叙事需由作者把关。'],
  ['baoyu-translate', '文章翻译', '以快速、常规或深度模式翻译文章和文档。', 'baoyu', 'skills/baoyu-translate/SKILL.md', ['translation_localization', 'document_authoring'], ['media', 'international_trade'], ['translator', 'editor'], 'B', 'medium', '专业术语与法律文字需要人工审校。'],
  ['baoyu-url-to-markdown', '网页转 Markdown', '抓取 URL 内容并转换为保留元数据的 Markdown。', 'baoyu', 'skills/baoyu-url-to-markdown/SKILL.md', ['data_extraction', 'content_research'], ['research', 'media'], ['researcher', 'editor'], 'B', 'medium', '网页可访问性与转载许可需另行确认。'],
  ['baoyu-wechat-summary', '微信群摘要', '把指定时间范围的群聊整理为结构化摘要，并支持画像回溯。', 'baoyu', 'skills/baoyu-wechat-summary/SKILL.md', ['community_operations', 'knowledge_management'], ['operations', 'education'], ['community_manager', 'operator'], 'B', 'medium', '群聊含个人信息，应取得授权并最小化留存。'],
  ['baoyu-xhs-images', '小红书图文卡', '把内容拆成多张小红书风格的信息卡并生成图片。', 'baoyu', 'skills/baoyu-xhs-images/SKILL.md', ['social_publishing', 'visual_design'], ['marketing', 'media'], ['social_manager', 'designer'], 'B', 'medium', '平台规范和图中文字需人工复核。'],
  ['baoyu-youtube-transcript', 'YouTube 字幕提取', '按 URL 或视频 ID 下载字幕、转写内容和封面图。', 'baoyu', 'skills/baoyu-youtube-transcript/SKILL.md', ['data_extraction', 'video_production'], ['education', 'media'], ['researcher', 'video_editor'], 'B', 'medium', '确认版权、字幕准确性和使用许可。'],

  ['anthropic-academy-guide', '学习课程向导', '围绕 Academy 课程结构引导学习、练习与结果检查。', 'anthropics', 'skills/academy-guide/SKILL.md', ['product_planning', 'knowledge_management'], ['education'], ['teacher', 'learner'], 'A', 'low', '课程材料和学习结论应由学习者确认。'],
  ['anthropic-algorithmic-art', '算法艺术', '用可重复的算法过程生成可调参数的视觉艺术作品。', 'anthropics', 'skills/algorithmic-art/SKILL.md', ['visual_design', 'image_generation'], ['media', 'design'], ['artist', 'designer'], 'A', 'medium', '输出风格与素材来源需符合授权要求。'],
  ['anthropic-brand-guidelines', '品牌规范', '读取品牌资产和约束，产出符合既定品牌规范的内容。', 'anthropics', 'skills/brand-guidelines/SKILL.md', ['brand_management', 'document_authoring'], ['marketing', 'enterprise'], ['brand_manager', 'marketer'], 'A', 'medium', '以组织当前品牌规范为准。'],
  ['anthropic-canvas-design', '画布设计', '在画布上组织视觉元素，形成可迭代的设计产物。', 'anthropics', 'skills/canvas-design/SKILL.md', ['visual_design', 'interactive_prototyping'], ['design', 'education'], ['designer', 'teacher'], 'A', 'medium', '需要核对可读性和最终导出格式。'],
  ['anthropic-claude-api', 'Claude API 开发', '根据官方接口约束设计并实现 Claude API 集成。', 'anthropics', 'skills/claude-api/SKILL.md', ['api_development'], ['software'], ['developer'], 'A', 'high', '密钥、成本和模型行为需要独立评估。'],
  ['anthropic-discernment-nudge', '审辨式引导', '用提问和检查点帮助用户评估信息、假设和决策。', 'anthropics', 'skills/discernment-nudge/SKILL.md', ['content_research', 'knowledge_management'], ['education', 'consulting'], ['teacher', 'analyst'], 'A', 'low', '不应替代专业诊断或高风险决策。'],
  ['anthropic-doc-coauthoring', '协作文档写作', '通过访谈、提纲和迭代反馈共同完成结构化文档。', 'anthropics', 'skills/doc-coauthoring/SKILL.md', ['document_authoring'], ['consulting', 'enterprise'], ['writer', 'consultant'], 'A', 'medium', '作者必须核验事实、署名和机密内容。'],
  ['anthropic-docx', 'Word 文档处理', '创建、编辑和检查 DOCX 文档中的内容与版式。', 'anthropics', 'skills/docx/SKILL.md', ['document_authoring'], ['legal', 'enterprise'], ['writer', 'administrator'], 'A', 'medium', '复杂版式须在 Word 中复核。'],
  ['anthropic-frontend-design', '前端视觉设计', '将产品需求转成高质量、可实现的前端界面设计。', 'anthropics', 'skills/frontend-design/SKILL.md', ['web_design', 'interactive_prototyping'], ['software', 'ecommerce'], ['designer', 'developer'], 'A', 'high', '需进行可用性、无障碍和浏览器测试。'],
  ['anthropic-internal-comms', '内部沟通', '依据受众与场景起草内部公告、更新和沟通材料。', 'anthropics', 'skills/internal-comms/SKILL.md', ['internal_communications', 'document_authoring'], ['enterprise', 'hr'], ['hr_manager', 'manager'], 'A', 'low', '组织政策与敏感信息需批准后发布。'],
  ['anthropic-mcp-builder', 'MCP 服务构建', '设计、实现和测试向智能体暴露工具的 MCP 服务。', 'anthropics', 'skills/mcp-builder/SKILL.md', ['agent_authoring', 'api_development'], ['software'], ['developer'], 'A', 'high', '服务权限、输入校验和密钥处理需安全审查。'],
  ['anthropic-pdf', 'PDF 处理', '读取、创建、检查和渲染 PDF，并关注视觉版式。', 'anthropics', 'skills/pdf/SKILL.md', ['pdf_processing', 'document_authoring'], ['legal', 'finance'], ['administrator', 'analyst'], 'A', 'medium', '正式文件须复核签名、页码和版式。'],
  ['anthropic-pptx', 'PowerPoint 演示', '创建、编辑并检查 PPTX 演示文稿及其页面布局。', 'anthropics', 'skills/pptx/SKILL.md', ['presentation_design'], ['consulting', 'education'], ['consultant', 'teacher'], 'A', 'medium', '图表数值和演示适配需人工复查。'],
  ['anthropic-skill-creator', '技能创建', '定义技能元数据、说明和配套资源，并评估其触发效果。', 'anthropics', 'skills/skill-creator/SKILL.md', ['agent_authoring', 'development_planning'], ['software', 'enterprise'], ['developer', 'operations_manager'], 'A', 'high', '避免将不可信指令或秘密纳入技能包。'],
  ['anthropic-slack-gif-creator', 'Slack GIF 制作', '为 Slack 场景设计并生成短循环动图。', 'anthropics', 'skills/slack-gif-creator/SKILL.md', ['video_production', 'internal_communications'], ['enterprise', 'marketing'], ['communicator', 'designer'], 'A', 'medium', '发布前核对品牌、可访问性和受众。'],
  ['anthropic-theme-factory', '主题工厂', '从设计线索生成可复用的主题、色彩和排版方案。', 'anthropics', 'skills/theme-factory/SKILL.md', ['visual_design', 'brand_management'], ['design', 'marketing'], ['designer', 'brand_manager'], 'A', 'medium', '应检查色彩对比度和品牌适配。'],
  ['anthropic-web-artifacts-builder', '网页交互产物', '根据需求构建可运行的网页交互、演示或工具。', 'anthropics', 'skills/web-artifacts-builder/SKILL.md', ['interactive_prototyping', 'web_design'], ['education', 'consulting'], ['designer', 'teacher'], 'A', 'high', '上线前须测试交互与数据处理。'],
  ['anthropic-webapp-testing', '网页应用测试', '使用浏览器自动化检查网页应用流程并报告问题。', 'anthropics', 'skills/webapp-testing/SKILL.md', ['browser_testing', 'code_quality'], ['software', 'ecommerce'], ['tester', 'developer'], 'A', 'high', '测试环境不得包含生产敏感数据。'],
  ['anthropic-xlsx', '电子表格处理', '创建、编辑、分析并核验 XLSX 工作簿与公式。', 'anthropics', 'skills/xlsx/SKILL.md', ['spreadsheet_analysis', 'data_analysis'], ['finance', 'operations'], ['analyst', 'accountant'], 'A', 'medium', '关键公式和财务结果需双重复核。'],

  ['hyperframes-embedded-captions', '口播字幕包装', '为口播视频叠加按时间编排的字幕，并选择可读的视觉样式。', 'hyperframes', 'skills/embedded-captions/SKILL.md', ['video_production', 'visual_design'], ['media', 'education'], ['video_editor', 'creator'], 'A', 'medium', '字幕内容、可读性与语音同步需要复核。'],
  ['hyperframes-faceless-explainer', '无真人讲解视频', '将文章、笔记或主题拆成旁白和场景，渲染短讲解视频。', 'hyperframes', 'skills/faceless-explainer/SKILL.md', ['video_production', 'content_authoring'], ['education', 'marketing'], ['teacher', 'marketer'], 'A', 'high', '事实、配音授权和画面素材必须审核。'],
  ['hyperframes-figma', 'Figma 视频设计取材', '读取 Figma 设计上下文与素材，用作视频和动效创作的视觉输入。', 'hyperframes', 'skills/figma/SKILL.md', ['visual_design', 'video_production'], ['design', 'marketing'], ['designer', 'video_editor'], 'A', 'high', '确认设计文件权限与资产使用范围。'],
  ['hyperframes-general-video', '通用视频制作', '把内容大纲转为多场景 HyperFrames 视频，并控制时长和转场。', 'hyperframes', 'skills/general-video/SKILL.md', ['video_production', 'content_authoring'], ['media', 'education'], ['creator', 'teacher'], 'A', 'high', '渲染前需确认脚本、配乐和素材许可。'],
  ['hyperframes-animation', '动效编排', '为 HyperFrames 场景定义原子动效、分段节奏和场景过渡。', 'hyperframes', 'skills/hyperframes-animation/SKILL.md', ['video_production', 'visual_design'], ['design', 'media'], ['motion_designer', 'video_editor'], 'A', 'high', '高频动效须评估可访问性和观看舒适度。'],
  ['hyperframes-audio', '视频音频制作', '为视频生成、编辑和对齐旁白、背景音乐与音效。', 'hyperframes', 'skills/hyperframes-audio/SKILL.md', ['audio_production', 'video_production'], ['media', 'education'], ['audio_editor', 'video_editor'], 'A', 'high', '不得使用无授权音乐或误导性合成声音。'],
  ['hyperframes-cli', '视频命令行工作流', '使用 HyperFrames CLI 初始化、检查、捕获和渲染视频项目。', 'hyperframes', 'skills/hyperframes-cli/SKILL.md', ['video_production'], ['media', 'marketing'], ['video_editor', 'creator'], 'A', 'high', '渲染命令应在隔离项目目录中执行。'],
  ['hyperframes-core', '视频合成结构', '按时间与数据属性组织一个可渲染的 HyperFrames 合成项目。', 'hyperframes', 'skills/hyperframes-core/SKILL.md', ['video_production', 'interactive_prototyping'], ['media', 'education'], ['motion_designer', 'creator'], 'A', 'high', '时间轴和输入数据应通过预览核验。'],
  ['hyperframes-creative', '视频创意方向', '制定视频的调色、字体、镜头和视觉方向，并形成设计规范。', 'hyperframes', 'skills/hyperframes-creative/SKILL.md', ['visual_design', 'video_production'], ['marketing', 'media'], ['creative_director', 'designer'], 'A', 'medium', '需符合品牌规范并复核字体授权。'],
  ['hyperframes-keyframes', '关键帧动画', '为场景中的元素定义关键帧与时序，产出可控的运动效果。', 'hyperframes', 'skills/hyperframes-keyframes/SKILL.md', ['video_production', 'visual_design'], ['media', 'design'], ['motion_designer'], 'A', 'high', '预览关键帧，避免闪烁和运动不适。'],
  ['hyperframes-registry', '视频组件注册', '安装并接入可复用的视频组件和区块到 HyperFrames 合成。', 'hyperframes', 'skills/hyperframes-registry/SKILL.md', ['video_production', 'visual_design'], ['media', 'marketing'], ['video_editor', 'designer'], 'A', 'medium', '接入前检查第三方组件的许可证和兼容性。'],
  ['hyperframes-workflow', 'HyperFrames 制作总控', '根据视频目标选择合适的 HyperFrames 工作流并协调后续技能。', 'hyperframes', 'skills/hyperframes/SKILL.md', ['video_production', 'project_management'], ['media', 'marketing'], ['producer', 'creator'], 'A', 'medium', '需求不清时先确认视频受众、渠道和时长。'],
  ['hyperframes-media-use', '媒体资产管理', '解析视频所需的图片、图标、音乐和音效，并固化本地资产记录。', 'hyperframes', 'skills/media-use/SKILL.md', ['video_production', 'audio_production'], ['media', 'marketing'], ['producer', 'video_editor'], 'A', 'medium', '资产来源、许可和归档位置必须可追溯。'],
  ['hyperframes-motion-graphics', '动态信息图', '把数字、文字和图形转成强调信息传达的短动效。', 'hyperframes', 'skills/motion-graphics/SKILL.md', ['video_production', 'diagramming'], ['marketing', 'education'], ['motion_designer', 'analyst'], 'A', 'high', '数据准确性和节奏可读性需人工检查。'],
  ['hyperframes-music-to-video', '音乐节拍视频', '根据音乐轨道分析节拍并生成同步的视觉视频。', 'hyperframes', 'skills/music-to-video/SKILL.md', ['audio_production', 'video_production'], ['media', 'marketing'], ['video_editor', 'creator'], 'A', 'high', '音乐版权和节拍检测结果均需复核。'],
  ['hyperframes-pr-to-video', '变更讲解视频', '将 GitHub 拉取请求的改动转成面向受众的功能或更新讲解视频。', 'hyperframes', 'skills/pr-to-video/SKILL.md', ['video_production', 'internal_communications'], ['software', 'enterprise'], ['developer_advocate', 'product_manager'], 'A', 'high', '视频必须准确反映已合并的代码变更。'],
  ['hyperframes-product-launch-video', '产品发布视频', '将产品链接、脚本或卖点转成多镜头的发布宣传视频。', 'hyperframes', 'skills/product-launch-video/SKILL.md', ['video_production', 'social_publishing'], ['marketing', 'ecommerce'], ['marketer', 'producer'], 'A', 'high', '宣传陈述、定价和商标需批准后发布。'],
  ['hyperframes-remotion-port', 'Remotion 视频迁移', '将现有 Remotion 合成按映射规则迁移为 HyperFrames HTML 视频。', 'hyperframes', 'skills/remotion-to-hyperframes/SKILL.md', ['video_production'], ['media', 'design'], ['video_editor', 'motion_designer'], 'A', 'high', '迁移后必须逐帧核验行为和渲染差异。'],
  ['hyperframes-slideshow', '交互式视频幻灯', '制作具有离散页面、片段和交互节奏的 HyperFrames 幻灯演示。', 'hyperframes', 'skills/slideshow/SKILL.md', ['presentation_design', 'video_production'], ['education', 'consulting'], ['teacher', 'consultant'], 'A', 'high', '演示流程和内容准确性需排练验证。'],
  ['hyperframes-talking-head-recut', '访谈视频再剪辑', '为访谈或播客画面叠加定时的图形卡片和重点信息。', 'hyperframes', 'skills/talking-head-recut/SKILL.md', ['video_production', 'content_authoring'], ['media', 'education'], ['video_editor', 'creator'], 'A', 'high', '不得改变受访者原意，字幕与引用需核准。']
];

export const SKILLS = Object.freeze(SPECS.map(skill));
