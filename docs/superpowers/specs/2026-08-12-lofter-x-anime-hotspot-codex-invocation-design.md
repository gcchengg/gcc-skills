# LOFTER × X 二次元热点 Codex 调用设计

## 目标

让仓库中的 `lofter-x-anime-hotspot` 作为个人 Codex Skill 被稳定发现，并可通过 `$lofter-x-anime-hotspot` 直接调用。

## 调用契约

- 单独输入 `$lofter-x-anime-hotspot`：默认研究近期 X 与 LOFTER 二次元热点，生成一篇可人工预览的 LOFTER 图文草稿，不自动发布。
- 在调用后追加主题或要求：把追加文本作为本次选题、修改或发布指令。
- 保留两次发布确认：`确认发布` 只允许填写平台表单；`确认最终提交` 才允许点击最终提交。

## 实现

1. 保留目录名和 frontmatter 名称 `lofter-x-anime-hotspot`，确保 `$` 调用名称稳定。
2. 优化 frontmatter `description`，覆盖显式 `$` 调用、新草稿、修订和发布确认等触发场景。
3. 更新 `agents/openai.yaml`：使用中文显示名、简短说明和中文默认提示，并在默认提示中显式包含 `$lofter-x-anime-hotspot`。
4. 将仓库目录作为源文件，干净复制到 `~/.codex/skills/lofter-x-anime-hotspot`；排除 `runs/`、`__pycache__/`、`.dev-deps/` 和其他运行时产物。

## 验证

- 用官方 `quick_validate.py` 校验仓库源目录和安装目录。
- 检查安装目录包含 `SKILL.md`、`agents/openai.yaml`、脚本、引用和模板。
- 检查安装目录不包含运行记录和缓存。
- 不运行完整单元测试；此次只修改发现元数据和安装形态，不修改业务脚本。

## 非目标

- 不改变热点研究、内容生成、图片生成或发布门禁逻辑。
- 不自动点击 LOFTER 最终发布按钮。
- 不提交现有无关缓存变化。
