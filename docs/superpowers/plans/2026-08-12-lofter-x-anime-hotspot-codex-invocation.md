# LOFTER × X 二次元热点 Codex 调用 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `$lofter-x-anime-hotspot` 可在 Codex 中直接发现和调用，并使用中文默认提示启动既有工作流。

**Architecture:** 仓库中的 Skill 目录是唯一源文件；通过更新 discovery metadata 改善显式调用，再将排除运行产物的干净副本安装到个人 Codex Skills 目录。业务脚本和发布门禁保持不变。

**Tech Stack:** Markdown Skill metadata、Codex `agents/openai.yaml`、Python 官方 Skill validator、文件系统复制。

## Global Constraints

- Skill 名称保持 `lofter-x-anime-hotspot`。
- 默认调用只生成草稿，不自动发布。
- 保留 `确认发布` 与 `确认最终提交` 两次确认。
- 不改业务脚本，不运行完整测试。

---

### Task 1: 更新 Codex 发现元数据

**Files:**
- Modify: `lofter-x-anime-hotspot/SKILL.md`
- Modify: `lofter-x-anime-hotspot/agents/openai.yaml`

**Interfaces:**
- Consumes: Codex Skill frontmatter 和 `agents/openai.yaml` 规范。
- Produces: 可由 `$lofter-x-anime-hotspot` 发现的中文默认调用入口。

- [ ] **Step 1: 保留当前失败基线**

确认当前会话的可用 Skills 列表中没有 `lofter-x-anime-hotspot`，且 `~/.codex/skills/lofter-x-anime-hotspot` 不存在。

- [ ] **Step 2: 更新最小元数据**

将 description 调整为显式调用与具体使用场景；将默认提示改为中文并明确“生成预览、不自动发布”。

- [ ] **Step 3: 执行官方快速校验**

运行：

```bash
python3 "$HOME/.codex/skills/.system/skill-creator/scripts/quick_validate.py" lofter-x-anime-hotspot
```

预期：输出 `Skill is valid!`。

### Task 2: 安装干净的个人 Skill 副本

**Files:**
- Create: `~/.codex/skills/lofter-x-anime-hotspot/**`

**Interfaces:**
- Consumes: Task 1 的仓库源目录。
- Produces: Codex 自动发现的个人 Skill 安装目录。

- [ ] **Step 1: 复制静态 Skill 文件**

复制 `SKILL.md`、`agents/`、`references/`、`scripts/*.py`、`templates/` 和 `requirements-dev.txt`，不复制 `runs/`、缓存或开发依赖。

- [ ] **Step 2: 校验安装副本**

运行官方 validator，并检查：

```bash
test -f "$HOME/.codex/skills/lofter-x-anime-hotspot/SKILL.md"
test -f "$HOME/.codex/skills/lofter-x-anime-hotspot/agents/openai.yaml"
test ! -e "$HOME/.codex/skills/lofter-x-anime-hotspot/runs"
find "$HOME/.codex/skills/lofter-x-anime-hotspot" -name __pycache__ -print -quit
```

预期：两个必需文件存在；没有 `runs/`；最后一条无输出。

- [ ] **Step 3: 报告调用方式**

给出 `$lofter-x-anime-hotspot`、带主题调用和恢复/确认调用示例；说明当前任务列表若未即时刷新，可新开任务后使用。
