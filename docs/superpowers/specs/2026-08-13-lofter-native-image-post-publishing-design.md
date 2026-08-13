# LOFTER 原生图片帖发布修正设计

## 目标

让 `lofter-x-anime-hotspot` 的 `image_post` 草稿使用 LOFTER 原生图片发布器，使信息流首屏以图片为主；重新发布当前帖子，并在确认新帖成功后删除旧帖。

## 发布路由

- `content_format: image_post` 必须进入 `https://www.lofter.com/#publish=photo`。
- `content_format: article` 继续进入 `https://www.lofter.com/#publish=text`。
- 图片帖先上传清单中的封面，再按清单顺序上传其余图片；短文案作为图片说明填写。
- 不得把“文字帖正文第一项是图片”视作原生图片帖。

## 安全顺序

1. 从已归档运行加载锁定的标题、短文案、标签和图片，不临时改稿。
2. 在原生图片发布器中填写新帖，并在最终提交前核对首图、图片顺序、文案和标签。
3. 使用本次用户已给出的最终提交确认发布新帖，只点击一次。
4. 取得新帖 HTTPS 地址并确认页面可访问、首屏以图片展示。
5. 只有第 4 步成功后才删除旧帖 `https://guochuncheng.lofter.com/post/b1151e17_34efb02ec`。
6. 如果新帖结果不确定或删除入口不明确，停止操作，不重复发布，也不删除旧帖。

## Skill 修正

- 在 `SKILL.md` 的首次确认、登录恢复和最终提交路由中区分图片帖与文章帖。
- 在 `references/browser-publishing.md` 固定两种编辑器地址及图片帖表单顺序。
- 增加合同测试，要求 `image_post` 对应 `#publish=photo`、`article` 对应 `#publish=text`，并禁止图片帖回退到文字编辑器。
- 仅运行合同测试和官方快速校验，不运行完整测试集。

## 完成标准

- 合同测试与 Skill 快速校验通过。
- 新帖拥有不同于旧帖的 HTTPS 地址，公开页面首屏展示图片。
- 新帖验证成功后，旧帖不再公开可访问或明确显示已删除。
