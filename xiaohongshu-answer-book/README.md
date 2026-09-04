# 答案正在浮现

一个面向小红书小工具平台的纯 HTML/CSS/JavaScript 离线答案之书。

## 内容规模

- 16 个分类
- 每类 150 个问题，共 2400 个问题
- 600 条原创答案
- 同日同问题答案固定
- 全局随机最近 20 条去重

## 本地预览

```bash
python3 -m http.server 8098 --directory .
```

打开 `http://localhost:8098/`。不要直接使用 `file://` 预览 ES Modules。

## 验证与构建

```bash
npm test
npm run validate:data
npm run build
npm run check:package
```

上传包位于 `dist/xiaohongshu-answer-book.zip`。将该 ZIP 上传到小红书小工具 Builder Hub，入口文件为 `index.html`。

## 数据更新

问题和答案源位于 `src/data/`。修改后必须确保每个分类仍为 150 条、答案总数仍为 600，并运行完整验证命令。运行时不会联网，所有资源必须包含在 ZIP 内。

## 安全说明

产品用于娱乐与自我整理，不替代医疗、法律、金融或其他专业判断。高风险文本通过本地规则进入安全答案池，并显示现实求助提示。

## 项目约束

本项目按用户要求不执行 Git 分支、提交或其他 Git 写操作。
