const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const book = () => `<div class="rune-ring"></div><div class="rune-ring second"></div><div class="book-shell"><div class="book-cover"><i class="book-spine"></i></div></div>`;
const topbar = (title) => `<header class="topbar"><button class="icon-button" data-action="back" aria-label="返回">←</button><h1>${esc(title)}</h1><span></span></header>`;

function intro(state) { return `<section class="screen intro ${state.introPlayed ? 'intro-static' : ''}"><div class="intro-visual"><div class="moon"></div>${book()}</div><div class="intro-copy"><div class="brand">THE ANSWER IS AWAKENING</div><h1>答案正在浮现</h1><p>有些答案，需要你亲手翻开。</p></div><div class="intro-actions"><button class="primary" data-action="enter">开启这本书</button><p class="legal">答案仅供娱乐与自我整理，不替代现实判断。</p></div></section>`; }

function home(state) { return `<section class="screen home"><div class="home-visual">${book()}</div><div class="home-copy"><div class="brand">BOOK OF INNER SIGNS</div><h1>答案正在浮现</h1><p>在心里默念困扰你的事，然后翻开属于你的那一页。</p></div><div class="home-actions"><button class="primary" data-action="compose">写下我的问题</button><button class="secondary" data-action="global-random">不知道问什么？随机一个</button><div class="micro-links"><button data-action="daily">今日启示</button><button data-action="favorites">我的收藏</button><button data-action="history">最近问过</button>${state.introPlayed ? '<button data-action="replay">重播入场</button>' : ''}</div><p class="legal">所有问题只保存在你的设备中。</p></div></section>`; }

function compose(state, data) {
  return `<section class="screen">${topbar('写下问题')}<div class="panel"><textarea class="question-input" maxlength="60" data-input="question" placeholder="把困扰你的事写在这里……">${esc(state.question)}</textarea><div class="counter" data-question-count>${[...state.question].length} / 60</div></div><div class="category-row" role="list">${data.categories.map((item) => `<button class="category ${state.categoryId === item.id ? 'selected' : ''}" aria-pressed="${state.categoryId === item.id}" data-category="${item.id}">${item.icon} ${esc(item.name)}</button>`).join('')}</div><div class="section-head"><h2>${state.categoryId ? '也许你想问' : '从一个分类开始'}</h2><button class="text-button" data-action="refresh-suggestions">换一批</button></div><div class="suggestions">${data.suggestions.map((item) => `<button class="suggestion" data-question-id="${item.id}">${esc(item.text)}</button>`).join('')}</div><div class="sticky"><button class="ghost" data-action="category-random">✦ 随机一个问题</button><button class="primary" data-action="confirm" ${state.question.trim() ? '' : 'disabled'}>问问答案之书</button><div class="notice">${esc(state.notice)}</div></div></section>`;
}

function awaken(state) { return `<section class="screen awaken">${topbar('让问题进入书中')}<div class="hold-zone ${state.holdState === 'holding' ? 'holding' : ''}" data-hold role="button" tabindex="0" aria-label="长按书封 1.8 秒唤醒答案"><div class="asked">你想问的是<strong>${esc(state.question)}</strong></div>${book()}<div class="hold-hint">长按书封 1.8 秒</div><div class="hold-track"><i class="hold-fill"></i></div></div><div class="notice">${esc(state.notice)}</div></section>`; }
function revealing() { return `<section class="screen revealing"><div><div class="book-open"><div class="page left"></div><div class="page right"></div><div class="turning-page"></div></div><p class="reveal-copy">书页正在寻找你的答案…</p></div></section>`; }

function answer(state, data) {
  const result = state.result; if (!result) return home(state);
  const category = data.categories.find(({ id }) => id === result.categoryId);
  return `<section class="screen answer-screen">${topbar('这一页属于你')}<div class="answer-stage"><div class="answer-question">“${esc(result.question)}”</div><div class="answer-text">${esc(result.answer.text)}</div><div class="answer-insight">${esc(result.answer.insight)}</div><div class="answer-meta">${category?.icon || '✦'} ${esc(category?.name || '心中一问')} · ${esc(result.dateKey)}</div>${result.riskLevel === 'high' ? '<div class="crisis">如果你正处于危险中或有伤害自己的念头，请立即联系身边可信赖的人、当地急救服务或专业危机干预支持。你不需要独自承担。</div>' : ''}</div><div class="answer-actions"><button class="primary" data-action="share">保存答案卡</button><button class="secondary" data-action="favorite">收藏这个答案</button><button class="secondary" data-action="ask-again">再问一个</button></div><p class="legal">答案仅供娱乐与自我整理，不替代现实判断。</p></section>`;
}

function records(title, entries, emptyCopy) { return `<section class="screen">${topbar(title)}${entries.length ? `<div class="list">${entries.map((item) => `<button class="record" data-record-id="${esc(item.id)}"><small>${esc(item.dateKey || '')} · ${esc(item.categoryName || '')}</small><p>${esc(item.question || item.answer?.text || item.answer || '')}</p></button>`).join('')}</div>` : `<div class="empty">✦<p>${esc(emptyCopy)}</p></div>`}</section>`; }
function share(state) { return `<section class="screen share-screen">${topbar('保存答案卡')}<h2>把这一页带走</h2><p class="subtitle">长按图片也可以保存到相册。</p><canvas id="share-canvas" aria-hidden="true"></canvas><img id="share-image" alt="答案正在浮现分享卡"><label class="toggle"><input type="checkbox" data-action="hide-question" ${state.hideShareQuestion ? 'checked' : ''}>隐藏我的问题</label><button class="primary" data-action="download-card">保存图片</button></section>`; }

export function renderApp(state, data) {
  if (state.step === 'intro') return intro(state);
  if (state.step === 'home') return home(state);
  if (state.step === 'compose') return compose(state, data);
  if (state.step === 'awaken') return awaken(state);
  if (state.step === 'revealing') return revealing();
  if (state.step === 'answer' || state.step === 'daily') return answer(state, data);
  if (state.step === 'history') return records('最近问过', data.history, '你还没有问过这本书。');
  if (state.step === 'favorites') return records('我的收藏', data.favorites, '还没有收藏的答案。');
  return share(state);
}
