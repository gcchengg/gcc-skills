# Content Marketing Skill 小红书内容包设计

## 目标

围绕 `shalintripathi/saas-marketing-agents` 仓库中的 `content-marketing` Skill，制作一套可直接发布的小红书内容包。重点解释 Skill 如何把 B2B SaaS 内容生产组织成有角色分工、交接和审核的编辑流程，最后用工作症状判断适合人群。

## 事实边界

- 核心对象是 `plugins/saas-marketing/skills/content-marketing/SKILL.md`，不是整个仓库的 77 个 Agent。
- Skill 文件列出 7 个角色：Blog Strategist、Case Study Producer、Whitepaper Architect、Copywriter、Video Script Writer、Newsletter Curator、Thought Leadership Ghostwriter。
- Skill 要求优先读取 `brand-context.md`，未知事实以待补充标记呈现，不得编造客户、指标或成果。
- 仓库 README 当前描述整个项目包含 77 个角色和 19 个 Skills；核验时 GitHub 页面显示约 8 Stars，不能使用“爆火”或高增长叙事。
- 仓库采用 MIT 许可证。只引用仓库明确提供的 Claude Code 插件安装命令，不把兼容性推断成已验证能力。

## 文案设计

推荐标题为“一个Skill，带着7个内容专家”，候选标题全部不超过 20 个 Unicode 字符。发布正文含话题不超过 900 个字符。

正文顺序：重复劳动钩子 → Skill 定义 → 7 个角色与输入输出 → `brand-context.md` 和防编造机制 → 五阶段工作流 → 产品发布最小案例 → 安装方式 → 风险与边界 → 工作症状和适用岗位。

Markdown 话题行以 `\#` 开始，发布粘贴版使用真实 `#`。

## 视觉系统

- 比例与格式：6 张 3:4 中文 PNG。
- 风格：艺术画册、独立杂志、真实厚纸、细腻击凸压凹，拒绝办公信息图。
- 配色：森林绿与暖米白为主色，橙红作极少量点睛。
- 字体：高对比衬线标题配压缩无衬线说明文字，形成三级字号。
- 光线：左上柔和侧光，压痕清楚但不呈现金属或塑料感。
- 核心隐喻：中央编辑手册连接 7 枚内容模块，表现一间有分工、有交接、有审核的编辑部。

## 六图职责

1. `01-封面.png`：标题、Skill 名称、中央编辑手册与七枚压凹模块。
2. `02-Skill是什么.png`：品牌上下文和任务作为输入，多种内容资产作为输出，突出它不是 Prompt 合集。
3. `03-能力解剖.png`：七个内容角色及各自职责，围绕同一个编辑中枢排列。
4. `04-工作流程.png`：品牌上下文、策略、研究大纲、初稿、修订、优化交付，显示审核回路。
5. `05-使用示例.png`：一个产品发布 Brief 被拆成文章、落地页文案、视频脚本、Newsletter 和高管文章。
6. `06-适合谁.png`：先显示四类工作症状，再补充内容负责人、B2B SaaS 市场团队、创业者和品牌团队。

## 生成与验收

先保存 6 份最终提示词，再用内置 Image 2 生成封面；02–06 以封面为视觉参考逐张生成。每张检查中文、角色数量、箭头关系、编号、裁切和手机可读性。失败只重做当前张。

最终文件归档到 `outputs/github-skill-xiaohongshu/20260903-shalintripathi-saas-marketing-agents-content-marketing/`。图片同时保留在 Codex 默认生成目录，确保聊天记录可查看。交付前运行文案长度校验，并更新生成历史。
