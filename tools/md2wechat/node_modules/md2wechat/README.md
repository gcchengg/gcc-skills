# md2wechat

将 Markdown 转换为微信公众号兼容的 HTML 富文本的命令行工具。

## 功能特性

- **完整的 Markdown 语法支持** - 标题、段落、列表、引用、表格等
- **代码高亮** - 支持 40+ 种编程语言的语法高亮
- **数学公式** - 使用 KaTeX 渲染 LaTeX 公式
- **多级引用** - 为不同层级的引用提供不同的样式
- **主题系统** - 支持 Markdown 主题和代码高亮主题切换
- **样式内联化** - 自动将 CSS 转换为内联样式，兼容微信公众号
- **微信公众号同步** - 支持将 Markdown/HTML 直接同步到微信公众号草稿箱
- **图片上传** - 自动上传本地图片到微信服务器
- **TypeScript** - 完整的 TypeScript 类型支持

## 安装

### 全局安装（推荐）

```bash
npm install -g md2wechat
```

### 本地开发

```bash
# 克隆项目
git clone <repository_url>
cd wechat

# 安装依赖
npm install

# 构建
npm run build

# 链接到全局（开发测试用）
npm link
```

## 使用方式

### 1. Markdown 转 HTML

```bash
# 基本用法
md2wechat convert input.md output.html

# 指定主题
md2wechat convert input.md output.html --code-theme github

# 输出到标准输出
md2wechat convert input.md --stdout > output.html
```

### 2. Markdown 同步到微信公众号

```bash
# 基本用法（标题和作者从配置文件读取）
md2wechat sync-md article.md

# 指定标题和作者
md2wechat sync-md article.md --title "文章标题" --author "作者名"

# 指定封面图
md2wechat sync-md article.md --cover cover.jpg

# 更新现有草稿
md2wechat sync-md article.md --update <media_id>
```

### 3. HTML 同步到微信公众号

```bash
# 基本用法（需要指定标题）
md2wechat sync-html article.html --title "文章标题"

# 完整参数
md2wechat sync-html article.html --title "文章标题" --author "作者名" --digest "摘要" --cover cover.jpg
```

## 配置

### 环境变量配置

创建 `.env` 文件（参考 `.env.example`）：

```bash
# 微信公众号配置
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
WECHAT_DEFAULT_AUTHOR=Your Name

# 主题配置
THEME=default
CODE_THEME=atom-one-dark
```

### 配置说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `WECHAT_APP_ID` | 微信公众号 AppID | 是（同步功能） |
| `WECHAT_APP_SECRET` | 微信公众号 AppSecret | 是（同步功能） |
| `WECHAT_DEFAULT_AUTHOR` | 默认作者名称 | 否 |
| `THEME` | Markdown 主题名称 | 否 |
| `CODE_THEME` | 代码高亮主题名称 | 否 |

## 命令行选项

### convert 命令

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--theme` | `-t` | Markdown 主题名称 | `default` |
| `--code-theme` | `-c` | 代码高亮主题名称 | `atom-one-dark` |
| `--stdout` | - | 输出到标准输出 | - |

### sync-md 命令

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--title` | `-t` | 文章标题 | 自动提取 |
| `--author` | `-a` | 作者名称 | 从配置读取 |
| `--digest` | `-d` | 文章摘要 | 自动提取 |
| `--cover` | - | 封面图片路径 | - |
| `--update` | `-u` | 更新现有草稿（media_id） | - |
| `--index` | `-i` | 文章索引（用于更新） | `0` |

### sync-html 命令

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--title` | `-t` | 文章标题（必需） | - |
| `--author` | `-a` | 作者名称 | 从配置读取 |
| `--digest` | `-d` | 文章摘要 | - |
| `--cover` | - | 封面图片路径 | - |
| `--update` | `-u` | 更新现有草稿（media_id） | - |
| `--index` | `-i` | 文章索引（用于更新） | `0` |

### 通用选项

| 选项 | 简写 | 说明 |
|------|------|------|
| `--help` | `-h` | 显示帮助信息 |
| `--version` | `-v` | 显示版本号 |
| `--debug` | - | 启用调试模式 |

## 代码主题

- `atom-one-dark` - 深色主题（默认）
- `github` - 浅色主题

## 支持的语言

bash, javascript, typescript, python, java, cpp, go, rust, css, html, json, yaml, sql, markdown, shell, diff, protobuf, php, ruby, swift, kotlin, scala, clojure, haskell, lua, makefile, r, xml, dockerfile, dart, erlang, gradle, groovy, julia, lisp, matlab, objectivec, perl, verilog, vhdl, csharp, tex 等 40+ 种语言。

## Markdown 语法示例

### 标题

```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 代码块

````markdown
```javascript
function hello() {
  console.log('Hello, World!');
}
```
````

### 数学公式

行内公式：`$E = mc^2$`

块级公式：

```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### 多级引用

```markdown
> 一级引用
>
> > 二级引用
>
> > > 三级引用
```

### 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 1   | 2   | 3   |
| 4   | 5   | 6   |
```

## 输出使用

### 方式一：复制粘贴

1. 运行 `md2wechat convert` 生成 HTML 文件
2. 打开生成的 HTML 文件
3. 全选复制内容（Ctrl+A, Ctrl+C）
4. 粘贴到微信公众号编辑器（Ctrl+V）

### 方式二：API 同步

1. 配置微信公众号 API 凭证
2. 运行 `md2wechat sync-md` 或 `md2wechat sync-html`
3. 文章自动同步到草稿箱
4. 在微信公众号后台打开草稿进行编辑

## 项目结构

```txt
wechat/
├── src/                      # 源代码目录
│   ├── cli/                  # CLI 命令行工具
│   │   ├── index.ts          # CLI 入口
│   │   ├── commands/         # 子命令
│   │   └── utils/            # 工具函数
│   ├── core/                 # 核心功能模块
│   │   ├── parser.ts         # Markdown 解析器
│   │   ├── converter.ts      # HTML 转换器
│   │   ├── wechat-api.ts     # 微信公众号 API
│   │   └── image-handler.ts  # 图片处理
│   ├── plugins/              # markdown-it 插件
│   ├── highlight/            # 代码高亮配置
│   ├── types/                # 类型定义
│   └── index.ts              # 库入口
├── themes/                   # 样式主题
│   ├── basic.css             # 基础样式
│   ├── markdown/             # Markdown 主题
│   └── code/                 # 代码高亮主题
├── bin/                      # 命令行入口
│   └── md2wechat             # Bash 入口脚本
├── dist/                     # 编译输出目录
├── package.json
├── tsconfig.json
└── README.md
```

## 开发

```bash
# 安装依赖
npm install

# 监听模式编译
npm run watch

# 开发模式运行
npm run dev -- convert input.md

# 构建
npm run build

# 测试
npm test

# 代码检查
npm run lint
```

## 依赖

- [markdown-it](https://github.com/markdown-it/markdown-it) - Markdown 解析器
- [highlight.js](https://highlightjs.org/) - 代码语法高亮
- [katex](https://katex.org/) - 数学公式渲染
- [juice](https://github.com/Automattic/juice) - CSS 内联化
- [commander](https://github.com/tj/commander.js) - CLI 框架
- [chalk](https://github.com/chalk/chalk) - 终端样式

## 参考项目

本工具基于 [markdown-nice](https://github.com/mdnice/markdown-nice) 项目实现。

## 许可证

MIT
