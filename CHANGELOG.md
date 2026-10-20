# 版本更新说明

本文件记录 heMathEditor 的版本变更。版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)，`0.x` 阶段不保证向后兼容。

## 维护规则

1. **每次提交代码前，必须在 `[未发布]` 区块补充本次修改**，按「新增 / 变更 / 修复 / 移除 / 文档 / 工程」分类。
2. 发版时，将 `[未发布]` 内容归档为 `## [x.y.z] - YYYY-MM-DD`，并同步修改 `package.json` 的 `version`。
3. 只修改文档、配置或注释，也要记录。
4. 条目尽量写清「改了什么、影响哪里」；涉及行为变化时注明兼容性影响。
5. 提交信息建议使用 `feat:` / `fix:` / `docs:` / `refactor:` / `chore:` 前缀，与版本说明条目对应。

## [未发布]

预计版本：`0.2.0`

### 变更

- 抽取共享内核 `src/core`，统一公式解析与 Markdown 渲染：
  - 新增 `src/core/formula`：`matchFormulaAt` / `scanFormulas`，作为公式识别的唯一实现。
  - 新增 `src/core/renderer`：统一 `markdownRenderer`、`renderMarkdownHtml`、`renderMarkdownInto`。
  - `src/editor/formulaAtom.ts` 改为复用 core 的扫描逻辑，消除原先编辑器与 markdown-it 两份重复规则；保留 `scanFormulas` 导出。
  - `HeMdEditor` 预览改用 `renderMarkdownInto`，界面与交互行为不变。
  - 桶文件 `src/index.ts` 新增 core 相关导出。
- 编辑器预览与只读展示共用 `.he-markdown-body` 排版样式，`HeMdEditor` 内重复的预览排版规则移至 `src/styles/markdown-body.scss`。
- 演示应用从单一 `App.vue` 拆分为应用外壳 + 三个展示页，`App.vue` 只负责顶部导航与 hash 路由；演示页公共样式移至 `src/styles/demo.scss`。

### 修复

- 修复行间公式 `$$\n...\n$$` 无法识别的问题：`$$` 后允许换行与首尾空白，LaTeX 首尾空白会被裁剪；行内公式规则保持不变。
- 公式原子化装饰改由 `StateField` 提供，修复跨行公式块级装饰无法通过 `ViewPlugin` 注入、导致编辑器挂载失败的问题。
- 修复演示页 `String.raw` 保留反斜杠导致行内代码示例失效的问题，改为普通模板字符串并转义 LaTeX 反斜杠。
- 修复 HeMdEditor 预览与 HeMdViewer 中围栏代码块无语法高亮的问题，接入 highlight.js。

### 文档

- README 支持中英文：`README.md` 为英文默认，`README.zh-CN.md` 为中文，两份顶部均提供语言切换；同步补充 GitHub 仓库地址。
- 新增 [README.md](README.md) / [README.zh-CN.md](README.zh-CN.md)：项目介绍、快速开始、目录结构、组件 API、公式规则与实现说明。
- 新增 [README.ai.md](README.ai.md)：面向 AI 的架构速读、数据契约、核心机制、改动路径与易错点。
- 新增 CHANGELOG.md（本文件），确立「每次提交同步更新版本说明」的维护规则。

### 新增

- 围栏代码块支持 highlight.js 语法高亮：按语言注册 `bash`、`css`、`java`、`javascript`、`json`、`markdown`、`python`、`sql`、`typescript`、`xml`，未知语言回退纯文本；主题色内置在 `markdown-body.scss`。
- 演示页新增 TypeScript 代码块示例。
- 新增顶部导航与 hash 路由，支持 HeMdEditor（首页）、HeMdViewer、HeMdWysiwyg 三个展示页切换，并同步页面标题与浏览器前进 / 后退。
- 新增 `src/pages/EditorPage.vue`、`ViewerPage.vue`、`WysiwygPage.vue`；`WysiwygPage` 当前为占位页，单栏所见即所得组件尚未实现。
- 新增 `src/styles/demo.scss`，承载演示页的卡片、按钮、标签与符号面板样式。
- 新增只读展示组件 `HeMdViewer`：接收后端返回的 Markdown 源码，复用共享渲染器与 MathJax，不依赖 CodeMirror / MathLive；支持 `emptyText` 空状态。
- 新增 `src/viewer/index.ts` 子路径入口，演示页通过 `@/viewer` 引入；后续打包对应 `he-math-editor/viewer`。
- 新增 `src/styles/markdown-body.scss`，统一编辑器预览与只读展示的 Markdown 排版。
- 演示页新增只读展示示例。
- 新增第一层 Markdown 编辑器 `HeMdEditor`（对应提交 `0a9052c`）：
  - 基于 CodeMirror 6，集成 Markdown 语法高亮、历史记录、`Mod-b` / `Mod-i` 快捷键。
  - 工具栏覆盖标题、加粗、斜体、删除线、行内代码、引用、无序/有序/任务列表、代码块、链接、图片、表格、分割线、插入公式。
  - 右侧分栏实时预览：markdown-it 渲染 + 自定义数学规则，输入防抖 250ms。
  - 公式以整体标签嵌入正文，点击标签打开公式弹窗，确认后原位替换。
- 新增公式原子化扩展 `formulaAtom`：
  - `scanFormulas` 扫描 `$...$` / `$$...$$`，支持 `\$` 转义、跳过代码区域、行内公式不跨行。
  - `Decoration.replace` + `WidgetType` 渲染公式标签，配合 `EditorView.atomicRanges` 实现不可局部编辑、整体删除。
  - 跨行公式使用块级装饰；点击标签通过回调回传 `FormulaRef`。
- 新增 Markdown 命令模块 `mdCommands.ts`：标题切换、行前缀切换、内联包裹切换、块级插入等工具函数。
- 新增组件库桶文件 `src/index.ts`，统一导出组件、`formulaAtom`、相关类型与 MathJax 服务。

### 工程

- 新增依赖 `highlight.js@^11.12.0`（core 构建 + 按需语言模块）。

## [0.1.0] - 2026-10-19

对应提交：`ffb02ce`（init）

### 新增

- 初始化 heMathEditor 项目：Vue 3 + Vite 6 + TypeScript + SCSS。
- 新增 `HeMathInput`：基于 MathLive 的所见即所得公式输入，支持 `v-model`、`focus` / `insert` / `getValue`。
- 新增 `HeMathPreview`：基于 MathJax 的公式预览，支持行内/行间模式。
- 新增 `HeFormulaDialog`：公式编辑弹窗，集成输入、实时预览、行间开关、常用符号面板与空值校验。
- 新增 `mathJaxService` 单例：
  - 按需加载本地 `public/mathjax/tex-svg.js`（MathJax 3.2.2）。
  - 关闭自动排版，按元素 `typesetClear` + `typesetPromise`。
  - 加载完成前的渲染请求自动排队。
  - 注册 `\oiint` / `\oiiint` 宏。
- 新增全局样式与 MathLive 虚拟键盘层级修正（`z-index: 3000`）。
- 新增演示页 `App.vue`，展示三层示例：Markdown 编辑器、公式弹窗、内嵌输入 + 实时预览。

## 提交记录对照

| 提交 | 日期 | 说明 | 归属版本 |
| --- | --- | --- | --- |
| `ffb02ce` | 2026-10-19 | init: heMathEditor 初始版本（MathLive 输入 + MathJax 渲染） | 0.1.0 |
| `0a9052c` | 2026-10-20 | feat: 新增第一层 Markdown 编辑器 HeMdEditor（公式原子化 + 分栏预览） | 未发布（0.2.0） |
