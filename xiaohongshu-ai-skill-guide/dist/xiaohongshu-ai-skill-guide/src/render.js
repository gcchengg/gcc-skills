const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

const topbar = (title, step, progress) => `<header class="topbar"><button class="back" data-action="back" aria-label="返回">←</button><div><div class="step">${esc(step)}</div><strong>${esc(title)}</strong></div><span></span></header><div class="progress"><i style="width:${progress}%"></i></div>`;

function intro(state) {
  return `<section class="screen intro ${state.introPlayed ? 'intro-static' : ''}"><div class="aurora"></div><div class="grid"></div><header class="brand"><span class="brand-mark">S</span>AI Skill 装机指南</header><div><div class="hero-core"><i class="ring a"></i><i class="ring b"></i><i class="ring c"></i><span class="skill-chip s1">代码审查</span><span class="skill-chip s2">UI 设计</span><span class="skill-chip s3">行业研究</span><span class="skill-chip s4">内容创作</span><span class="skill-chip s5">数据分析</span><div class="core-mark">SK</div><div class="scanline"></div></div><div class="hero-copy"><div class="eyebrow">BUILD YOUR AI STACK</div><h1>干这行，应该<br>安装哪些 Skill？</h1><p>选择行业与岗位，回答 3 个问题，生成真正适合你的 AI Skill 装机单。</p></div></div><div class="intro-actions"><button class="primary" data-action="start">开始扫描我的职业 →</button>${state.introPlayed ? '<button class="copy-link replay" data-action="replay-intro">重播入场动画</button>' : ''}<div class="meta">无需登录 · 本地运行 · 结果可分享</div></div></section>`;
}

function industryScreen(state, data) {
  return `<section class="screen">${topbar('选择行业','第 1 步 / 共 5 步',20)}<h1>你在哪个行业？</h1><p class="subtitle">搜索或直接选择最接近的行业，后面还可以用岗位进一步校准。</p><input class="search" data-search="industry" placeholder="搜索行业，如：自媒体、教育、电商" aria-label="搜索行业"><div class="grid-list" data-list="industry">${data.industries.map((item) => `<button class="choice ${state.industryId === item.id ? 'selected' : ''}" data-industry="${esc(item.id)}"><strong>${esc(item.name)}</strong><small>${esc(item.aliases.slice(0,2).join(' · '))}</small></button>`).join('')}</div><div class="sticky-actions"><button class="primary" data-action="next" ${state.industryId ? '' : 'disabled'}>下一步</button></div></section>`;
}

function roleScreen(state, data) {
  const roles = data.roles.filter((role) => role.industryIds.includes(state.industryId));
  return `<section class="screen">${topbar('选择岗位','第 2 步 / 共 5 步',40)}<h1>你的工作身份是？</h1><p class="subtitle">最多选择 2 个岗位。选择两个时，我们会生成复合职业装机单。</p><input class="search" data-search="role" placeholder="搜索岗位" aria-label="搜索岗位"><div class="grid-list" data-list="role">${roles.map((role) => `<button class="choice ${state.roleIds.includes(role.id) ? 'selected' : ''}" data-role="${esc(role.id)}"><strong>${esc(role.name)}</strong><small>${esc(role.aliases.slice(0,2).join(' · '))}</small></button>`).join('')}</div><div class="sticky-actions"><button class="primary" data-action="next" ${state.roleIds.length ? '' : 'disabled'}>${state.roleIds.length === 2 ? '生成复合职业问题' : '下一步'}</button></div></section>`;
}

function questionScreen(state, data, index) {
  const question = data.questions[index]; const selected = state.answers[index] || [];
  return `<section class="screen">${topbar('微调推荐',`第 ${index + 3} 步 / 共 5 步`,60 + index * 18)}<h1>${esc(question.prompt)}</h1><p class="subtitle">${esc(question.helpText)}</p><div class="question-list">${question.options.map((option) => `<button class="question-option ${selected.some((item) => item.id === option.id) ? 'selected' : ''}" aria-pressed="${selected.some((item) => item.id === option.id)}" data-answer="${esc(option.id)}" data-question="${index}">${selected.some((item) => item.id === option.id) ? '✓ ' : ''}${esc(option.label)}</button>`).join('')}</div><div class="sticky-actions"><button class="primary" data-action="next-question" ${selected.length ? '' : 'disabled'}>${index === 2 ? '生成我的装机单' : '继续'}</button></div></section>`;
}

function calculating() { return `<section class="screen scan-screen"><div><div class="scanner"><div class="core-mark" style="opacity:1;transform:none;animation:none">SK</div></div><h1 style="margin-top:28px">正在扫描 Skill 目录</h1><p class="subtitle">匹配你的行业、岗位和高频任务…</p></div></section>`; }

function bars(radar) { return `<div class="radar-bars">${Object.entries(radar).map(([name,value]) => `<div class="radar-bar"><i style="height:${value}%"></i><span>${esc(name)}</span></div>`).join('')}</div>`; }
function skillCard(skill, level) { return `<article class="skill-card"><div class="skill-head"><span class="skill-icon">${level === '必装' ? '✓' : '↗'}</span><div><h3>${esc(skill.name)}</h3><p>${esc(skill.summary)}</p></div><span class="badge">${level}</span></div><details><summary class="copy-link">为什么推荐给你？</summary><p>${esc(skill.why)}</p><p>典型场景：${esc(skill.scenario)}</p><p>最近核验：${esc(skill.verifiedAt)}</p></details><div class="skill-links"><a href="${esc(skill.githubUrl)}" target="_blank" rel="noopener noreferrer">查看 GitHub ↗</a><button class="copy-link" data-copy="${esc(skill.githubUrl)}">复制链接</button></div></article>`; }

function resultScreen(state, data) {
  const result = state.result; const industry = data.industries.find((item) => item.id === state.industryId); const roleNames = state.roleIds.map((id) => data.roles.find((role) => role.id === id)?.name).filter(Boolean);
  return `<section class="screen"><div class="topbar"><div class="brand"><span class="brand-mark">S</span>装机结果</div><button class="back" data-action="reset" aria-label="重新测评">↻</button></div><div class="result-hero"><small>你的 AI 职业类型</small><h1>${esc(result.archetype)}</h1><p class="subtitle">${esc(industry?.name)} · ${esc(roleNames.join(' × '))}</p><p>${esc(result.profile)}</p>${bars(result.radar)}</div>${result.professionalNotice ? `<div class="notice">${esc(result.professionalNotice)}</div>` : ''}<h2 class="section-title">必装 Skill · ${result.essential.length} 项</h2>${result.essential.map((skill) => skillCard(skill,'必装')).join('')}<h2 class="section-title">进阶 Skill · ${result.advanced.length} 项</h2>${result.advanced.map((skill) => skillCard(skill,'进阶')).join('')}<h2 class="section-title">建议补充能力 · 3 项</h2>${result.capabilitySuggestions.map((item) => `<article class="capability-card"><h3>${esc(item.name)}</h3><p>${esc(item.summary)}</p><p>${esc(item.whyItMatters)}</p></article>`).join('')}<div class="sticky-actions"><button class="secondary" data-action="back-to-questions" style="white-space:nowrap;flex:0 0 auto">修改答案</button><button class="primary" data-action="share">生成分享卡</button></div><div class="version">目录版本 ${esc(data.meta.version)} · 核验于 ${esc(data.meta.verifiedAt)}</div></section>`;
}

function shareScreen() { return `<section class="screen share-screen">${topbar('分享卡','长按图片保存，发布到小红书',100)}<h1>我的 AI Skill 装机单</h1><p class="subtitle">卡片不包含仓库长链接，适合直接分享。</p><canvas id="share-canvas" aria-hidden="true"></canvas><img id="share-image" alt="AI Skill 装机单：包含职业类型、五维能力与必装 Skill Top 5"><div class="sticky-actions"><button class="primary" data-action="save-card">保存图片</button></div></section>`; }

export function renderApp(state, data) {
  if (state.step === 'intro') return intro(state);
  if (state.step === 'industry') return industryScreen(state, data);
  if (state.step === 'role') return roleScreen(state, data);
  if (state.step.startsWith('question-')) return questionScreen(state, data, Number(state.step.at(-1)) - 1);
  if (state.step === 'calculating') return calculating();
  if (state.step === 'result') return resultScreen(state, data);
  return shareScreen();
}
