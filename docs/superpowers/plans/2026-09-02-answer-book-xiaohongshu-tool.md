# 《答案正在浮现》小红书小工具实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完全离线、带神秘入场与翻书动画、拥有 2400 个分类问题和 600 条原创答案的小红书答案之书工具。

**Architecture:** 新工具放在独立目录 `xiaohongshu-answer-book/`。内容数据由分类专属蓝图在构建前展开成可校验的静态记录，运行时只做本地标签匹配、稳定随机、状态渲染与 Canvas 分享；数据、算法、状态、视觉和构建边界彼此独立。

**Tech Stack:** HTML5、CSS3、原生 ES Modules、Canvas 2D、Node.js 内置 test runner、无第三方运行时依赖。

## Global Constraints

- 纯 HTML/CSS/JavaScript；不使用框架和后端。
- 运行时不得调用 `fetch`、`XMLHttpRequest`、`WebSocket`、`EventSource` 或远程动态 import。
- 16 个分类，每类恰好 150 个问题，总计 2400 个问题。
- 600 条原创答案，不复制实体《答案之书》的原句。
- 同一自然日、同一标准化问题返回相同答案。
- 最近 20 个随机问题不得重复。
- 最近 30 次问答和收藏仅保存在本机。
- 长按唤醒为 1800ms；首次入场约 3 秒。
- 支持 `prefers-reduced-motion`。
- 构建 ZIP 不超过 2MB。
- 不执行任何 Git 命令。

---

## File Map

```text
xiaohongshu-answer-book/
├── index.html                  # 唯一页面入口与无障碍基础结构
├── package.json               # 测试、校验、构建命令
├── README.md                  # 预览、构建、上传说明
├── styles/
│   ├── tokens.css             # 颜色、字体、尺寸、阴影变量
│   ├── motion.css             # 入场、长按、翻书及 reduced-motion
│   └── app.css                # 页面和组件布局
├── src/
│   ├── app.js                 # DOM 事件与模块编排
│   ├── render.js              # 纯 HTML 渲染函数
│   ├── state.js               # 应用状态机
│   ├── storage.js             # 历史、收藏、随机去重、容错
│   ├── matcher.js             # 标注、风险识别、候选评分
│   ├── stable-random.js       # 日期种子和稳定随机
│   ├── share-card.js          # 3:4 Canvas 分享卡
│   └── data/
│       ├── tags.js            # 合法标签、风险等级与基调
│       ├── categories.js      # 16 个分类
│       ├── question-blueprints.js # 16 类问题蓝图
│       ├── answer-blueprints.js   # 600 条答案内容源
│       └── catalog.js         # 展开并冻结问题/答案记录
├── scripts/
│   ├── validate-data.mjs      # 数量、唯一性、标签、近重复、安全校验
│   ├── build.mjs              # 复制运行文件并打 ZIP
│   └── check-package.mjs      # 离线 API、文件白名单、2MB 门禁
└── tests/
    ├── data.test.mjs
    ├── matcher.test.mjs
    ├── state.test.mjs
    ├── storage.test.mjs
    ├── share-card.test.mjs
    ├── html-contract.test.mjs
    └── package.test.mjs
```

---

### Task 1: 工程骨架与数据契约

**Files:**
- Create: `xiaohongshu-answer-book/package.json`
- Create: `xiaohongshu-answer-book/src/data/tags.js`
- Create: `xiaohongshu-answer-book/src/data/categories.js`
- Create: `xiaohongshu-answer-book/scripts/validate-data.mjs`
- Create: `xiaohongshu-answer-book/tests/data.test.mjs`

**Interfaces:**
- Produces: `CATEGORIES`, `SEMANTIC_TAGS`, `EMOTION_TAGS`, `RISK_LEVELS`, `ANSWER_TONES`, `validateCatalog(catalog)`。
- Question record: `{ id, text, categoryId, semanticTags, emotionTag, riskLevel }`。
- Answer record: `{ id, text, insight, semanticTags, tones, blockedRiskLevels, maxRiskLevel }`。

- [ ] **Step 1: 写失败的数据契约测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalog } from '../scripts/validate-data.mjs';

test('requires exactly 16 categories, 2400 questions and 600 answers', () => {
  const errors = validateCatalog({ categories: [], questions: [], answers: [] });
  assert.ok(errors.some((item) => item.includes('16 categories')));
  assert.ok(errors.some((item) => item.includes('2400 questions')));
  assert.ok(errors.some((item) => item.includes('600 answers')));
});
```

- [ ] **Step 2: 运行测试并确认因模块缺失而失败**

Run: `node --test tests/data.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`。

- [ ] **Step 3: 创建 16 个分类与合法标签集合**

`categories.js` 必须导出 16 个冻结记录，ID 固定为：

```js
export const CATEGORY_IDS = [
  'ambiguity', 'ex', 'love', 'work', 'money', 'study', 'relationships',
  'midnight', 'choices', 'daily-luck', 'travel', 'chaos', 'life',
  'growth', 'family', 'future'
];
```

`tags.js` 至少登记：`relationship`、`expectation`、`observation`、`choice`、`action`、`risk`、`money`、`study`、`career`、`communication`、`self-worth`、`rest`、`timing`、`uncertainty`、`travel`、`family`。

- [ ] **Step 4: 实现 `validateCatalog`**

校验精确数量、每类 150 条、ID 唯一、文本非空、分类引用、标签引用、风险等级、答案禁用范围和重复标准化文本。返回字符串错误数组，不在导入时执行。

- [ ] **Step 5: 运行测试**

Run: `node --test tests/data.test.mjs`

Expected: PASS。

---

### Task 2: 2400 条问题与 600 条答案内容目录

**Files:**
- Create: `xiaohongshu-answer-book/src/data/question-blueprints.js`
- Create: `xiaohongshu-answer-book/src/data/answer-blueprints.js`
- Create: `xiaohongshu-answer-book/src/data/catalog.js`
- Modify: `xiaohongshu-answer-book/tests/data.test.mjs`

**Interfaces:**
- Produces: `QUESTIONS`（2400 条冻结记录）、`ANSWERS`（600 条冻结记录）。
- `expandQuestionBlueprints(blueprints, categories)` 必须产生稳定顺序和稳定 ID。
- `expandAnswerBlueprints(blueprints)` 必须产生稳定顺序和稳定 ID。

- [ ] **Step 1: 增加失败测试**

```js
test('ships 150 unique questions per category and 600 unique answers', () => {
  assert.equal(QUESTIONS.length, 2400);
  assert.equal(ANSWERS.length, 600);
  for (const category of CATEGORIES) {
    assert.equal(QUESTIONS.filter((q) => q.categoryId === category.id).length, 150);
  }
  assert.equal(new Set(QUESTIONS.map((q) => q.text)).size, 2400);
  assert.equal(new Set(ANSWERS.map((a) => a.text)).size, 600);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/data.test.mjs`

Expected: FAIL because `QUESTIONS` and `ANSWERS` do not exist。

- [ ] **Step 3: 编写分类专属问题蓝图**

每类至少使用 10 个自然语言句式族，每个句式族通过经过人工校对的主题槽位生成 15 条，共 150 条。禁止跨分类复用同一完整问题；发疯文学允许幽默，但不得鼓励伤害、违法或危险行为。

蓝图接口：

```js
{
  categoryId: 'work',
  families: [{
    template: '我现在适合{action}吗？',
    slots: { action: ['换工作', '争取晋升', '接受这个 offer'] },
    semanticTags: ['career', 'choice', 'timing'],
    emotionTag: 'uncertain',
    riskLevel: 'normal'
  }]
}
```

- [ ] **Step 4: 编写 600 条答案内容源**

答案按 10 种基调各 60 条组织。主答案必须唯一且可脱离具体分类阅读；`insight` 解释不得重复主答案。高风险可用答案标记 `maxRiskLevel: 'high'`，娱乐性强或命令式答案只能标记 `maxRiskLevel: 'normal'`。

- [ ] **Step 5: 实现稳定展开与冻结**

ID 格式：问题 `${categoryId}-q-001` 至 `150`；答案 `answer-001` 至 `answer-600`。展开时若数量不精确直接抛出带分类名的错误。

- [ ] **Step 6: 增加近重复和安全词测试**

标准化后相等必须失败；字符 bigram Jaccard 相似度大于 `0.92` 的问题输出候选清单并使校验失败。禁止答案包含“立即停药”“肯定没事”“梭哈”“一定会回来”等确定性危险表达。

- [ ] **Step 7: 运行数据测试与 CLI 校验**

Run: `npm test -- --test-name-pattern="catalog|questions|answers" && npm run validate:data`

Expected: PASS and print `16 categories, 2400 questions, 600 answers valid`。

---

### Task 3: 稳定随机、语义匹配与安全路由

**Files:**
- Create: `xiaohongshu-answer-book/src/stable-random.js`
- Create: `xiaohongshu-answer-book/src/matcher.js`
- Test: `xiaohongshu-answer-book/tests/matcher.test.mjs`

**Interfaces:**
- `normalizeQuestion(text): string`
- `localDateKey(date): string`，格式 `YYYY-MM-DD`
- `seedFrom(parts: string[]): number`
- `annotateCustomQuestion(text): { semanticTags, emotionTag, riskLevel }`
- `selectAnswer({ question, categoryId, date, answers }): AnswerRecord`

- [ ] **Step 1: 写失败测试**

```js
test('returns the same answer for the same question on the same local day', () => {
  const input = { question: '我要不要换工作？', categoryId: 'work', date: new Date('2026-09-02T09:00:00+08:00'), answers: ANSWERS };
  assert.equal(selectAnswer(input).id, selectAnswer(input).id);
});

test('routes crisis-like questions only to high-risk-safe answers', () => {
  const answer = selectAnswer({ question: '我不想活了怎么办', categoryId: 'midnight', date: new Date(), answers: ANSWERS });
  assert.equal(answer.maxRiskLevel, 'high');
  assert.match(answer.insight, /联系|求助|陪伴|专业/);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/matcher.test.mjs`

Expected: FAIL with missing exports。

- [ ] **Step 3: 实现规范化和稳定种子**

去除首尾空格、折叠空白、统一全半角标点、转小写；种子使用确定性的 32-bit FNV-1a，不使用 `Math.random()` 选择最终答案。

- [ ] **Step 4: 实现本地关键词标注**

关键词规则按主题分组并允许多个标签命中。危机词、停药、违法、借贷、投资和法律结论必须优先于普通标签。

- [ ] **Step 5: 实现候选评分**

评分规则固定为：语义标签每个 `+4`、分类关联 `+3`、情绪匹配 `+2`、通用答案 `+1`；先按风险硬过滤，再取最高分层，最后用稳定种子选择。候选为空时回退到 `safe-general` 答案集合。

- [ ] **Step 6: 增加跨分类、未知文本和跨日测试**

确保工作问题不会选择恋爱专用答案；无法识别文本仍返回安全通用答案；跨日种子不同但允许在候选极小时偶然相同，因此测试种子而非强制答案不同。

- [ ] **Step 7: 运行匹配测试**

Run: `node --test tests/matcher.test.mjs`

Expected: PASS。

---

### Task 4: 状态机、本地存储与随机问题去重

**Files:**
- Create: `xiaohongshu-answer-book/src/state.js`
- Create: `xiaohongshu-answer-book/src/storage.js`
- Test: `xiaohongshu-answer-book/tests/state.test.mjs`
- Test: `xiaohongshu-answer-book/tests/storage.test.mjs`

**Interfaces:**
- Steps: `intro | home | compose | awaken | revealing | answer | daily | history | favorites | share`。
- `createStore(initialState, persistence)`。
- `createPersistence(storage)`。
- `pickRandomQuestion({ questions, categoryId?, recentIds, randomValue })`。

- [ ] **Step 1: 写导航守卫和去重失败测试**

```js
test('cannot awaken with an empty question', () => {
  const store = createStore();
  store.dispatch({ type: 'OPEN_COMPOSE' });
  store.dispatch({ type: 'CONFIRM_QUESTION' });
  assert.equal(store.getState().step, 'compose');
});

test('random question excludes the latest twenty ids', () => {
  const recentIds = QUESTIONS.slice(0, 20).map((q) => q.id);
  const picked = pickRandomQuestion({ questions: QUESTIONS, recentIds, randomValue: 0 });
  assert.ok(!recentIds.includes(picked.id));
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/state.test.mjs tests/storage.test.mjs`

- [ ] **Step 3: 实现状态机**

实现问题编辑、分类选择、预设填充、随机填充、长按开始/取消/完成、答案写入、分享、收藏、今日启示和返回规则。问题超过 60 个字符时截断并记录可访问提示。

- [ ] **Step 4: 实现容错存储**

键名统一为 `answer-book:v1:*`。历史最多 30 条，随机记录最多 20 条，收藏以 answer-result ID 去重。所有 storage 访问包裹在 `try/catch` 中并返回内存默认值。

- [ ] **Step 5: 实现全局和分类随机**

全局不排除任何分类；分类随机只过滤指定 `categoryId`。若过滤 recentIds 后候选为空，清空最近记录后再抽，不返回 `undefined`。

- [ ] **Step 6: 运行状态与存储测试**

Run: `node --test tests/state.test.mjs tests/storage.test.mjs`

Expected: PASS。

---

### Task 5: 页面结构与神秘动画

**Files:**
- Create: `xiaohongshu-answer-book/index.html`
- Create: `xiaohongshu-answer-book/styles/tokens.css`
- Create: `xiaohongshu-answer-book/styles/motion.css`
- Create: `xiaohongshu-answer-book/styles/app.css`
- Create: `xiaohongshu-answer-book/src/render.js`
- Create: `xiaohongshu-answer-book/src/app.js`
- Test: `xiaohongshu-answer-book/tests/html-contract.test.mjs`

**Interfaces:**
- `renderApp(state, data): string`
- DOM actions use `data-action` and `data-*` IDs only。
- `app.js` is the sole module allowed to attach DOM events and timers。

- [ ] **Step 1: 写失败的 HTML 合约测试**

测试语义主区域、live region、本地资源、无远程 URL、无网络 API、`prefers-reduced-motion`、问题输入长度和关键按钮文案。

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/html-contract.test.mjs`

- [ ] **Step 3: 实现首页、编辑页和辅助页渲染**

首页包含悬浮书、主次入口、今日启示、收藏和重播；编辑页包含输入框、16 分类、6–10 个问题、换一批/随机/确认；历史收藏为空时有明确空状态。

- [ ] **Step 4: 实现长按状态**

统一处理 `pointerdown`、`pointerup`、`pointercancel`、`pointerleave`。使用 1800ms 计时器和 CSS 自定义属性 `--hold-progress`；取消后归零，成功只触发一次。可用时调用短促 `navigator.vibrate`，不可用时不报错。

- [ ] **Step 5: 实现三段动画**

- 入场：黑屏/月光、星尘聚书、符文环和标题，约 3 秒。
- 长按：符文逐段点亮、光圈收缩、书本呼吸。
- 揭晓：书页翻动、金光扫过、答案显现。

同一会话返回首页添加 `.intro-static`；重播显式清除该状态。reduced-motion 下所有强动画改为 `opacity` 淡入且不延迟操作。

- [ ] **Step 6: 实现答案页和安全提示**

答案页展示问题、主答案、启示、日期、分类、娱乐声明和四个操作。危机类问题额外显示现实求助区域，视觉上区别于神秘答案。

- [ ] **Step 7: 运行 HTML 与状态测试**

Run: `node --test tests/html-contract.test.mjs tests/state.test.mjs`

Expected: PASS。

---

### Task 6: 3:4 分享卡与保存降级

**Files:**
- Create: `xiaohongshu-answer-book/src/share-card.js`
- Test: `xiaohongshu-answer-book/tests/share-card.test.mjs`
- Modify: `xiaohongshu-answer-book/src/app.js`
- Modify: `xiaohongshu-answer-book/src/render.js`

**Interfaces:**
- `buildShareModel(result, { hideQuestion, productName }): ShareModel`
- `drawShareCard(canvas, model): Promise<Blob | null>`
- Canvas dimensions: `1080 × 1440`。

- [ ] **Step 1: 写失败测试**

```js
test('can hide the private question while retaining the answer', () => {
  const model = buildShareModel(result, { hideQuestion: true, productName: '答案正在浮现' });
  assert.equal(model.question, '一个只属于你的问题');
  assert.equal(model.answer, result.answer.text);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/share-card.test.mjs`

- [ ] **Step 3: 实现分享模型与换行函数**

隐藏问题时使用固定替代文案；主答案最多 3 行，启示最多 4 行，超长时按字符宽度换行并使用省略号。

- [ ] **Step 4: 实现 Canvas 视觉**

使用午夜蓝、神秘紫、月光金；绘制月相、星轨、烫金答案、启示、日期、分类和产品名。不得写入历史、收藏或内部标签。

- [ ] **Step 5: 实现 PNG 降级**

始终将 Canvas 同步为 `data:image/png` 的 `<img>`；下载按钮优先 Blob URL，Blob 不可用时使用 data URL，页面文案提示可长按图片保存。

- [ ] **Step 6: 运行分享卡测试**

Run: `node --test tests/share-card.test.mjs`

Expected: PASS。

---

### Task 7: 构建、离线包与发布说明

**Files:**
- Create: `xiaohongshu-answer-book/scripts/build.mjs`
- Create: `xiaohongshu-answer-book/scripts/check-package.mjs`
- Create: `xiaohongshu-answer-book/tests/package.test.mjs`
- Create: `xiaohongshu-answer-book/README.md`
- Modify: `xiaohongshu-answer-book/package.json`

**Interfaces:**
- `npm test`
- `npm run validate:data`
- `npm run build`
- `npm run check:package`
- Output: `dist/xiaohongshu-answer-book.zip`。

- [ ] **Step 1: 写失败的包测试**

验证 ZIP 存在、入口和全部本地模块存在、总大小小于 2MB、不包含 tests/research/docs/node_modules、运行文件不含网络 API。

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/package.test.mjs`

- [ ] **Step 3: 实现确定性构建**

清空并重建 `dist/xiaohongshu-answer-book/`，只复制 `index.html`、`styles/` 和 `src/`，再用系统 zip 创建上传包。构建不得联网。

- [ ] **Step 4: 实现包检查**

递归扫描所有运行文件；禁止远程 `<script>`、`<link>`、网络 API 和 source map；检查文件白名单与 2MB 上限。

- [ ] **Step 5: 编写 README**

包含本地预览命令、四条验证命令、数据更新规则、小红书 Builder Hub 上传 ZIP 的步骤、安全声明和“不操作 Git”的项目约束。

- [ ] **Step 6: 运行完整门禁**

Run: `npm test && npm run validate:data && npm run build && npm run check:package`

Expected: all tests pass; print exact catalog counts and final ZIP bytes under 2MB。

---

### Task 8: 浏览器完整流程验收

**Files:**
- Modify only if a verified defect is found in Tasks 1–7 files。

**Interfaces:**
- Preview: `python3 -m http.server 8098 --directory dist/xiaohongshu-answer-book`

- [ ] **Step 1: 启动本地预览并打开首页**

确认首次强动画结束后按钮可操作；返回首页不重播，重播按钮有效。

- [ ] **Step 2: 验收三条主路径**

1. 自定义问题 → 长按取消 → 再次长按成功 → 答案 → 分享卡。
2. 分类预设问题 → 编辑 → 答案 → 收藏 → 收藏列表。
3. 全局随机 → 连续换 21 次 → 最近 20 条无重复。

- [ ] **Step 3: 验收日期稳定性和风险路由**

同日同问题重复得到同一答案；危机文本显示现实求助提示且不出现娱乐化命令答案。

- [ ] **Step 4: 验收移动端与 reduced-motion**

检查 320px、375px、430px 宽度；按钮不换行溢出；长按不触发文本选择；reduced-motion 无旋转和翻页强动画。

- [ ] **Step 5: 重新运行完整门禁**

Run: `npm test && npm run validate:data && npm run build && npm run check:package`

Expected: PASS with zero failures and ZIP under 2MB。

