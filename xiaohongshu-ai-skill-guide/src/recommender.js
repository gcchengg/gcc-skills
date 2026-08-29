const QUALITY = { A: 10, B: 6 };

function roleVector(roleIds, roles) {
  const vector = {};
  for (const roleId of roleIds) {
    const role = roles.find((item) => item.id === roleId);
    for (const [task, weight] of Object.entries(role?.taskWeights || {})) vector[task] = Math.min(8, (vector[task] || 0) + weight);
  }
  return vector;
}

export function buildTaskVector(roleIds, answers, roles) {
  const vector = roleVector(roleIds, roles);
  for (const answer of answers.flat ? answers.flat() : answers) {
    for (const [task, delta] of Object.entries(answer?.taskDeltas || {})) vector[task] = Math.max(0, (vector[task] || 0) + delta);
  }
  return vector;
}

function answerVector(answers) {
  const vector = {};
  for (const answer of answers.flat ? answers.flat() : answers) for (const [task, delta] of Object.entries(answer?.taskDeltas || {})) vector[task] = Math.max(0, (vector[task] || 0) + delta);
  return vector;
}

function weightedMatch(skill, vector, maximum) {
  const total = Object.values(vector).reduce((sum, value) => sum + Math.max(0, value), 0);
  const matched = skill.taskTags.reduce((sum, tag) => sum + Math.max(0, vector[tag] || 0), 0);
  return total ? maximum * Math.min(1, matched / total) : 0;
}

function scoreSkill(skill, industryId, roleTasks, answerTasks) {
  return weightedMatch(skill, roleTasks, 45) + weightedMatch(skill, answerTasks, 30) + (skill.industryIds.includes(industryId) ? 15 : 0) + QUALITY[skill.qualityGrade];
}

function decorate(skill, vector) {
  const bestTask = [...skill.taskTags].sort((a, b) => (vector[b] || 0) - (vector[a] || 0))[0];
  return { ...skill, why: `因为你的工作重点包含「${bestTask.replaceAll('_', ' ')}」，它能帮助你${skill.summary.replace(/[。.]$/, '')}。`, scenario: `当你需要处理「${bestTask.replaceAll('_', ' ')}」任务时，用它完成${skill.summary.replace(/[。.]$/, '')}。` };
}

function pickDiverse(scored, count, used = new Set()) {
  const picked = [];
  const families = new Map();
  for (const entry of scored) {
    if (used.has(entry.skill.githubUrl)) continue;
    const family = entry.skill.taskTags[0];
    if ((families.get(family) || 0) >= 2) continue;
    picked.push(entry.skill); used.add(entry.skill.githubUrl);
    families.set(family, (families.get(family) || 0) + 1);
    if (picked.length === count) break;
  }
  return picked;
}

function radarFrom(vector) {
  const groups = {
    创造: ['content_authoring', 'visual_design', 'image_generation', 'video_production'],
    分析: ['data_analysis', 'content_research', 'spreadsheet_analysis', 'evidence_synthesis'],
    表达: ['copywriting', 'presentation_design', 'document_authoring', 'social_publishing'],
    执行: ['project_management', 'process_documentation', 'code_quality', 'service_operations'],
    协作: ['stakeholder_management', 'community_operations', 'customer_support', 'internal_communications']
  };
  return Object.fromEntries(Object.entries(groups).map(([name, tags]) => [name, Math.min(100, 35 + tags.reduce((sum, tag) => sum + (vector[tag] || 0) * 7, 0))]));
}

export function recommend({ industryId, roleIds, answers = [], roles, skills, capabilities }) {
  const roleTasks = roleVector(roleIds, roles); const answerTasks = answerVector(answers); const vector = buildTaskVector(roleIds, answers, roles);
  const scored = skills.map((skill) => ({ skill, score: scoreSkill(skill, industryId, roleTasks, answerTasks) })).sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name));
  const used = new Set();
  const bestAScore = scored.find((entry) => entry.skill.qualityGrade === 'A')?.score || 0;
  const essential = pickDiverse(scored.filter((entry) => entry.skill.qualityGrade === 'A' || entry.score >= bestAScore * 1.2), 5, used).map((skill) => decorate(skill, vector));
  const advanced = pickDiverse(scored, 5, used).map((skill) => decorate(skill, vector));
  const coveredTasks = new Set([...essential, ...advanced].flatMap((skill) => skill.taskTags));
  const capabilitySuggestions = capabilities.filter((capability) => capability.taskTags.some((tag) => !coveredTasks.has(tag))).map((capability) => ({ capability, score: capability.taskTags.reduce((sum, tag) => sum + (vector[tag] || 0), 0) + (capability.industryIds.includes(industryId) ? 5 : 0) })).sort((a, b) => b.score - a.score).slice(0, 3).map(({ capability }) => capability);
  const selectedRoles = roleIds.map((id) => roles.find((role) => role.id === id)).filter(Boolean);
  const risk = selectedRoles.find((role) => role.riskDomain !== 'none')?.riskDomain;
  const labels = selectedRoles.map((role) => role.name.replace(/专员|工程师|经理/g, '')).slice(0, 2);
  return {
    archetype: labels.length > 1 ? `${labels[0]}型${labels[1]}造物者` : `${labels[0] || '职业'} AI 增强者`,
    profile: `围绕${Object.entries(vector).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([key]) => key.replaceAll('_', ' ')).join('与')}配置你的 AI 工作流。`,
    radar: radarFrom(vector), essential, advanced, capabilitySuggestions,
    professionalNotice: risk ? '这些 Skill 仅用于辅助工作，不能替代专业判断，关键结论须由具备资质的专业人员确认。' : ''
  };
}
