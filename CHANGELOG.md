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
- 拆分公式编辑弹窗：`HeFormulaDialog` 现在只负责遮罩、标题、底部按钮与开关状态，编辑内容抽为 `HeFormulaEditor` UI 组件。
- 公式弹窗编辑区由 MathLive 切换为自研可编辑公式区（contenteditable 槽位）；符号面板改为插入 Unicode 数学符号；`HeFormulaEditor` 同时用于 `#/input` 页面直接展示。
- `HeFormulaEditor` 改为三段展示：LaTeX 原文、自研可编辑渲染公式、只读 MathJax 实时预览。
- 可编辑区支持 `\frac{...}{...}` / `\tfrac{...}{...}` 结构化分式：`.me-frac` 下分 `.me-frac__num` / `.me-frac__den` 容器，容器内为 contenteditable 文本槽；点击即可编辑，LaTeX 原文与预览实时同步；插入竖式/小型/常用分式后默认选中分子。
- 分式解析改为递归：分子、分母中可继续嵌套分式；光标在分子/分母内再次插入竖式即可写任意层级连分式，`\tfrac` 序列化为带 `.me-frac--small` 的小型分式。
- 分式浮层第一排调整为「分数（竖式）/ 分数（横式）/ 分数（斜式）/ 分数（小型分数）」，移除单独的连分式卡片；卡片只显示图形，名称放在鼠标悬浮提示中。
- 键盘导航与删除逻辑改为按容器作用域递归处理（`moveSibling` / `getEdgeSlot`），同时适配嵌套分式。
- 引入 vue-i18n（Composition API）做中英文国际化：新增 `src/i18n`（实例、语言检测、`getLocale` / `setLocale` / `toggleLocale`）与 `locales/zh-CN.ts`、`locales/en-US.ts` 消息包；导航栏新增 `EN` / `中文` 切换按钮，选择持久化到 `localStorage`，并同步 `<html lang>` 与浏览器标题。
- 公式编辑器、公式弹窗、Markdown 工具栏、四个演示页的界面文案全部改为 `t()`；分式卡片不再显示常驻名称，改为鼠标悬浮时按当前语言显示名称。
- 分数（斜式）改为结构化分式：插入 `{}^{a}\!/\!_{b}` 时渲染为可编辑的上标分子/下标分母（`.me-frac--skewed` + `.me-frac__slash`），支持与竖式一致的点击编辑、方向键互跳、嵌套和整块删除，序列化仍输出 `{}^{...}\!/\!_{...}`。
- 「行间公式（独立成行）」默认勾选：`HeFormulaEditor` / `HeFormulaDialog` 的 `display` 默认值改为 `true`，新建公式默认插入 `$$...$$`；点击已有公式时仍沿用其原有 display。
- 可编辑公式把每座分式视为整体：公式外部按 `←` / `→` 跨过整座公式并落到相邻文本槽，不再进入分子/分母；只有点击进入公式后，方向键才在分子、分母等内部元素间移动。从公式内部向外移动时仍落在紧邻位置，两座相邻公式之间会自动补一个文本槽。
- 当前仅 `\frac` / `\tfrac` / 斜式 `{}^{a}\!/\!_{b}` 结构化；上下标（`^` / `_`）、`\cfrac` / `\dfrac` 等命令在可编辑区仍显示为文本，实时预览会正确渲染。
- `HeMathInput`（MathLive）仅保留在 EditorPage 的内嵌示例中，不再用于公式弹窗。

### 修复

- 修复行间公式 `$$\n...\n$$` 无法识别的问题：`$$` 后允许换行与首尾空白，LaTeX 首尾空白会被裁剪；行内公式规则保持不变。
- 公式原子化装饰改由 `StateField` 提供，修复跨行公式块级装饰无法通过 `ViewPlugin` 注入、导致编辑器挂载失败的问题。
- 修复演示页 `String.raw` 保留反斜杠导致行内代码示例失效的问题，改为普通模板字符串并转义 LaTeX 反斜杠。
- 修复 HeMdEditor 预览与 HeMdViewer 中围栏代码块无语法高亮的问题，接入 highlight.js。
- 修复 KeepAlive 页面切换时公式弹窗通过 Teleport 残留在其他页面的问题：EditorPage 在 `onDeactivated` 时关闭弹窗。
- 修复可编辑分式无法用键盘在分子/分母之间移动、也无法跳出分式的问题：`focusSlot` 将光标直接落到文本节点内部；新增 `getActiveSlot` / `handleArrow` / `moveSibling`，支持分子末尾 `↓` / `→` 进入分母、分母开头 `↑` / `←` 回到分子，以及分母末尾 `↓` / `→` 或分子开头 `↑` / `←` 跳出分式并自动创建外层文本槽，可直接输入 `\frac{a}{b}+c`。
- 修复可编辑区中结构化分式无法删除的问题：新增 `handleDelete` / `removeFractionNode`，分子开头按 `Backspace`、分母末尾按 `Delete`，或在相邻文本槽边界按 `Backspace` / `Delete` 可删除整个分式，并保留可落光标的文本槽。
- 修复点击可编辑区空白处时光标总是跳到分式内部（渲染结果之前）的问题：新增 `focusByPoint`，按点击位置在分式前后创建或进入文本槽，点击分式本体时聚焦分子。
- 修复竖式分式的分子/分母无法与整数等文本混排的问题：新增 `ensureDirectTextSlot`，点击分子/分母容器留白时聚焦或创建同级文本槽，不再强制进入嵌套分式；分子内在嵌套分式边界按 `←` / `→` 也会创建同级文本槽，支持 `\frac{2\frac{a}{b}}{b}` 这类混排。
- 修复嵌套插入分式时选中内容残留空文本槽、编辑区上方出现多余空白块的问题：插入时先删除选区再切分文本；空槽用零宽空格占位以校正光标位置，槽位被删空后自动补回，并在失焦时清理分子/分母中的空槽；粘贴时移除换行。

### 文档

- README 支持中英文：`README.md` 为英文默认，`README.zh-CN.md` 为中文，两份顶部均提供语言切换；同步补充 GitHub 仓库地址。
- README / README.ai.md 补充自研输入实验页、`#/input` 路由、KaTeX 字体与键盘符号映射说明。
- README / README.ai.md 补充 `HeFormulaDialog` 容器与 `HeFormulaEditor` UI 的拆分、API 与共用方式说明。
- README / README.ai.md 补充三段展示、自研可编辑分式与当前限制说明。
- README / README.ai.md 补充可编辑分式的键盘导航说明与验证项（分子/分母互跳、跳出分式输入 `\frac{a}{b}+c`）。
- README / README.ai.md 补充分式删除方式与点击空白处定位光标的说明和验证项。
- README / README.ai.md 补充分数浮层新命名、小型分数 `\tfrac` 与嵌套竖式（连分式）的说明和验证项。
- README.ai.md 补充空文本槽零宽占位、选区替换与空槽清理的实现说明和验证项。
- README / README.ai.md 补充 vue-i18n 架构、语言切换、消息包维护与新增语言的说明和验证项。
- README / README.ai.md 补充斜式结构化分式的渲染、解析、键盘导航与验证说明。
- README / README.ai.md 补充分子/分母与整数等文本混排、嵌套分式边界文本槽的说明和验证项。
- 新增 [TOOLBAR.md](TOOLBAR.md)：集中记录 Markdown / 公式工具栏按钮状态、分数格式、可编辑区能力与逐次更新记录；README / README.zh-CN / README.ai 增加入口，并约定工具栏变更必须同步更新该文件与版本说明。
- 新增 [README.md](README.md) / [README.zh-CN.md](README.zh-CN.md)：项目介绍、快速开始、目录结构、组件 API、公式规则与实现说明。
- 新增 [README.ai.md](README.ai.md)：面向 AI 的架构速读、数据契约、核心机制、改动路径与易错点。
- 新增 CHANGELOG.md（本文件），确立「每次提交同步更新版本说明」的维护规则。

### 新增

- 新增自研公式输入实验页 `#/input`：直接展示 `HeFormulaEditor` UI 组件，支持键盘数字、字母与符号；`*`、`-`、`/` 在 keydown 时自动映射为 `×`、`−`、`÷`。
- 新增 `HeFormulaEditor` UI 组件：三段展示与自研可编辑公式区、MathJax 预览、行间开关、Unicode 符号面板与校验；暴露 `focus` / `validate` / `clear`，由 `HeFormulaDialog` 与 `#/input` 共用。
- `HeFormulaEditor` 新增顶部公式工具栏 UI：最左侧「符号」按钮（Ω）+ 分数、上下标、根式、积分、大型运算符、括号、函数、导数符号、极限和对数、运算符、矩阵，共 12 个按钮；分数按钮已接入弹窗，其余暂未绑定行为。
- 新增分数格式弹窗：标准分式、线性分式、斜分式、连分式，以及常用分数 `dy/dx`、`Δy/Δx`、`∂y/∂x`、`δy/δx`、`π/2`；标准和常用分数插入结构化分式并默认选中分子，其余格式插入文本模板。
- 新增 KaTeX 字体资源 `src/assets/fonts/katex` 与 `src/styles/math-font.scss`，通过 `unicode-range` 组合 `HeMathFont`：数字/运算符使用 `KaTeX_Main`，字母/希腊字母使用 `KaTeX_Math Italic`。
- 顶部导航新增「公式输入」页面，路由 `#/input`。
- 围栏代码块支持 highlight.js 语法高亮：按语言注册 `bash`、`css`、`java`、`javascript`、`json`、`markdown`、`python`、`sql`、`typescript`、`xml`，未知语言回退纯文本；主题色内置在 `markdown-body.scss`。
- 演示页新增 TypeScript 代码块示例。
- 新增顶部导航与 hash 路由，支持 HeMdEditor（首页）、公式输入、HeMdViewer、HeMdWysiwyg 四个展示页切换，并同步页面标题与浏览器前进 / 后退。
- 新增 `src/pages/EditorPage.vue`、`InputPage.vue`、`ViewerPage.vue`、`WysiwygPage.vue`；`WysiwygPage` 当前为占位页，单栏所见即所得组件尚未实现。
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
- KaTeX 字体文件复制自 `mathlive@0.100.0`，未新增 npm 依赖。

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
