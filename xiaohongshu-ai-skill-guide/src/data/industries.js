// The guide keeps industry choices intentionally broad: a user should be able
// to find their work without having to know an internal job-classification code.
export const INDUSTRIES = Object.freeze([
  { id: 'software', name: '软件与互联网', aliases: ['互联网', 'SaaS', '科技'] },
  { id: 'ecommerce', name: '电商与零售', aliases: ['电商', '零售', '直播电商'] },
  { id: 'marketing', name: '市场营销与广告', aliases: ['营销', '广告', '品牌'] },
  { id: 'media', name: '媒体、自媒体与内容', aliases: ['自媒体', '内容创作', '新媒体'] },
  { id: 'education', name: '教育与培训', aliases: ['教育', '培训', '课程'] },
  { id: 'design', name: '设计与创意', aliases: ['设计', '创意', '视觉'] },
  { id: 'consulting', name: '咨询与专业服务', aliases: ['咨询', '战略', '专业服务'] },
  { id: 'enterprise', name: '企业服务与管理', aliases: ['企业管理', '行政', '项目管理'] },
  { id: 'finance', name: '金融与财务', aliases: ['金融', '财务', '会计'] },
  { id: 'hr', name: '人力资源', aliases: ['人力', '招聘', '组织发展'] },
  { id: 'international_trade', name: '国际贸易与跨境', aliases: ['外贸', '跨境', '进出口'] },
  { id: 'legal', name: '法律与合规', aliases: ['法律', '法务', '合规'] },
  { id: 'operations', name: '运营与供应链', aliases: ['运营', '供应链', '客户运营'] },
  { id: 'research', name: '研究与数据服务', aliases: ['研究', '数据', '洞察'] },
  { id: 'healthcare', name: '医疗健康', aliases: ['医疗', '健康', '医药'] },
  { id: 'manufacturing', name: '制造与工业', aliases: ['制造', '工业', '工厂'] },
  { id: 'real_estate', name: '房产与家居', aliases: ['房产', '地产', '家居'] },
  { id: 'hospitality', name: '文旅、餐饮与酒店', aliases: ['旅游', '餐饮', '酒店'] },
  { id: 'agriculture', name: '农业与食品', aliases: ['农业', '食品', '乡村'] },
  { id: 'public_services', name: '公共服务与公益', aliases: ['公共服务', '公益', '社会服务'] }
]);
