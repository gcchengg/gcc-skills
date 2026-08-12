# LOFTER Codex 内部浏览器登录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `lofter-x-anime-hotspot` 在发布阶段固定复用 Codex 应用内浏览器，并支持用户手动登录后从同一 LOFTER 标签继续填写。

**Architecture:** 浏览器选择与登录恢复规则保存在 Skill 发布协议中；确定性合同测试检查应用内浏览器选择、禁止自动切换外部浏览器、手动登录暂停和“已登录”恢复语义。发布门禁代码保持不变。

**Tech Stack:** Markdown Skill 协议、Python `unittest` 合同测试、Codex 应用内浏览器。

## Global Constraints

- 发布流程只使用 `browser:control-in-app-browser` 和 `agent.browsers.get("iab")`。
- 未登录时用户手动输入凭证；Skill 不读取、不填写、不保存密码、验证码、Cookie或浏览器存储。
- 用户回复“已登录”后复用同一个 LOFTER 标签和已锁定上传清单。
- 不自动切换 Chrome、Edge或外部浏览器。
- 填写完成后仍停在最终提交按钮前等待“确认最终提交”。

---

### Task 1: 应用内登录恢复合同

**Files:**
- Modify: `lofter-x-anime-hotspot/SKILL.md`
- Modify: `lofter-x-anime-hotspot/references/browser-publishing.md`
- Modify: `lofter-x-anime-hotspot/tests/test_skill_contract.py`
- Sync: `/Users/guocc/.codex/skills/lofter-x-anime-hotspot/`

**Interfaces:**
- Consumes: 已批准运行的 `upload-manifest.json` 和用户消息“已登录”。
- Produces: 固定应用内浏览器、同标签恢复且不接触凭证的发布协议。

- [ ] **Step 1: 写失败合同测试**

在 `test_skill_contract.py` 中断言 `browser-publishing.md` 包含 `agent.browsers.get("iab")`、`已登录`、同一标签复用、禁止读取凭证及禁止自动切换 Chrome 的规则。

- [ ] **Step 2: 验证 RED**

运行：

```bash
python3 -m unittest lofter-x-anime-hotspot/tests/test_skill_contract.py
```

预期：新增登录恢复合同因现有协议缺少这些精确规则而失败。

- [ ] **Step 3: 最小更新 Skill 协议**

在 `SKILL.md` 增加“已登录”恢复路由；在 `browser-publishing.md` 明确选择 `iab`、优先复用同一 LOFTER 标签、登录页暂停、用户手动输入、恢复时不得重复第一确认或改变清单、不得切换外部浏览器。

- [ ] **Step 4: 快速验证并同步安装副本**

运行合同测试和官方 Skill validator；通过后把仓库中的 Skill 文件同步到 `/Users/guocc/.codex/skills/lofter-x-anime-hotspot/`，再对安装副本执行一次 validator。

- [ ] **Step 5: 提交**

仅提交上述仓库 Skill 文件和测试；不提交当前运行数据或其他既有改动。
