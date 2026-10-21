# README.ai.md · 面向 AI 的项目速读

> 目标：让 AI 在最少上下文中理解 heMathEditor 的架构、契约、不变量与改动路径。人类向说明见 [README.md](README.md)（英文）与 [README.zh-CN.md](README.zh-CN.md)（中文）。

## 1. 一句话定位

Vue 3 + Vite 的「两层公式编辑器」：CodeMirror 6 负责 Markdown 正文，公式以 `$...$` / `$$...$$` 源码存储在文档中，但在编辑器里渲染为不可分割的整体标签；点击标签弹出 `HeFormulaEditor`（自研 KaTeX 输入 + MathJax 预览），确认后原位回写源码。

当前状态：组件库 + 演示应用。`App.vue` 使用 hash 路由与顶部导航，页面位于 `src/pages`；已实现分栏编辑（`HeMdEditor`）、只读展示（`HeMdViewer`）与自研输入实验页（`InputPage`，`#/input`），`WysiwygPage` 为占位页。公式弹窗已拆为 `HeFormulaDialog`（容器）+ `HeFormulaEditor`（UI），弹窗与 `#/input` 共用同一个 UI；`HeMathInput`（MathLive）仅保留在内嵌示例中。

## 2. 架构分层

```
App.vue（应用外壳：hash 路由 + 顶部导航）
├─ pages/EditorPage.vue（/）
│  └─ HeMdEditor                     模式 1：分栏编辑
│     ├─ CodeMirror 6
│     │  ├─ markdown 语法高亮 / 历史 / 快捷键（Mod-b、Mod-i）
│     │  └─ formulaAtom(onEdit)       公式 → 原子标签（Decoration.replace + Widget）
│     ├─ core/renderer（markdown-it + 数学规则）→ 预览 HTML
│     │  └─ renderMarkdownInto → mathJaxService.renderElement(el)   逐元素排版
│     └─ HeFormulaDialog              弹窗容器（遮罩 + 标题 + 按钮）
│        └─ HeFormulaEditor           共用编辑 UI
│           ├─ 单行 KaTeX 输入
│           ├─ HeMathPreview          MathJax 预览
│           └─ 常用符号面板
├─ pages/ViewerPage.vue（/viewer）
│  └─ HeMdViewer                      模式 2：只读展示
│     └─ core/renderer → MathJax（不引入 CodeMirror / MathLive）
├─ pages/InputPage.vue（/input）
│  └─ HeFormulaEditor（直接展示，不套弹窗）
└─ pages/WysiwygPage.vue（/wysiwyg） 模式 3：占位页，组件待实现
```

## 3. 文件地图

| 文件 | 职责 | 关键导出 |
| --- | --- | --- |
| `src/components/HeMdEditor.vue` | 第一层编辑器：工具栏、CodeMirror 挂载、250ms 防抖预览、弹窗联动 | 默认导出组件；暴露 `focus` / `insertText` / `getValue` |
| `src/components/HeMdViewer.vue` | 只读展示：`markdown` 渲染、`emptyText` 空状态，仅依赖 core/renderer | 默认导出组件 |
| `src/components/HeFormulaDialog.vue` | 弹窗容器：遮罩、标题、底部按钮、开关与打开时初始化 | 默认导出组件；`confirm(text, display)` |
| `src/components/HeFormulaEditor.vue` | 共用编辑 UI：工具栏按钮、分数格式弹窗、KaTeX 输入、MathJax 预览、行间开关、符号面板、校验 | 默认导出组件；暴露 `focus` / `validate` / `clear` |
| `src/components/HeMathInput.vue` | MathLive 输入封装，仅用于 EditorPage 内嵌示例 | 默认导出；暴露 `focus` / `insert` / `getValue` |
| `src/components/HeMathPreview.vue` | MathJax 单公式预览，空值显示占位 | 默认导出 |
| `src/core/formula/parser.ts` | **公式解析唯一实现**：`matchFormulaAt` / `scanFormulas` | `FormulaMatch`、`matchFormulaAt`、`scanFormulas` |
| `src/core/renderer/index.ts` | 统一 Markdown 渲染：markdown-it 实例、数学规则、highlight.js 代码高亮、MathJax 排版入口 | `markdownRenderer`、`renderMarkdownHtml`、`renderMarkdownInto` |
| `src/editor/formulaAtom.ts` | 代码区排除、原子化 `StateField`、点击回调；扫描复用 core | `formulaAtom`、`scanFormulas`、`FormulaRef` / `FormulaEditHandler` |
| `src/editor/mdCommands.ts` | 工具栏命令：标题、行前缀、内联包裹、块插入 | `toggleHeading`、`toggleWrap`、`insertTable` 等 |
| `src/viewer/index.ts` | 只读展示子路径入口 | `HeMdViewer` |
| `src/i18n/index.ts` | vue-i18n 实例、语言检测（localStorage / `DEFAULT_LOCALE`）、`getLocale` / `setLocale` / `toggleLocale` | `i18n`、`AppLocale`、`SUPPORTED_LOCALES` |
| `src/i18n/locales/zh-CN.ts` / `en-US.ts` | 中英文消息包，按 `nav` / `pageTitles` / `*Page` / `formula` / `markdown` 分组 | 默认导出消息对象 |
| `TOOLBAR.md` | 工具栏支持清单：按钮状态、分数格式、可编辑区能力与逐次更新记录 | - |
| `src/pages/EditorPage.vue` | 首页：HeMdEditor、公式弹窗、内嵌输入示例 | 默认导出页面组件 |
| `src/pages/InputPage.vue` | 自研输入实验：直接渲染 `HeFormulaEditor` | 默认导出页面组件 |
| `src/pages/ViewerPage.vue` | HeMdViewer 只读展示与空状态示例 | 默认导出页面组件 |
| `src/pages/WysiwygPage.vue` | HeMdWysiwyg 占位页与计划说明 | 默认导出页面组件 |
| `src/assets/fonts/katex/` | KaTeX_Main / KaTeX_Math 字体文件（复制自 mathlive@0.100.0） | - |
| `src/styles/markdown-body.scss` | 编辑器预览与只读展示共享的 Markdown 排版 | - |
| `src/styles/math-font.scss` | `HeMathFont`：通过 unicode-range 组合 KaTeX_Main 与 KaTeX_Math | `HeMathFont`、`.he-math-font` |
| `src/styles/demo.scss` | 演示页公共样式：页面、卡片、按钮、标签、符号面板 | - |
| `src/utils/mathjax.ts` | MathJax 单例：动态加载本地脚本、配置、渲染队列、`\oiint` 宏 | `mathJaxService`、`renderTex` |
| `src/index.ts` | 桶文件 | 全部组件 + `formulaAtom` + core 解析/渲染 + 类型 + MathJax 服务 |
| `src/App.vue` | 应用外壳：顶部导航、hash 路由、页面切换与标题同步 | - |
| `public/mathjax/tex-svg.js` | 本地 MathJax 3.2.2 构建 | - |
| `vite.config.ts` | `@` 别名；`isCustomElement: tag.startsWith('math-')`；端口 3100 | - |
| `src/styles/index.scss` | 全局样式；引入 Markdown、演示页与数学字体共享样式；`.ML__keyboard { z-index: 3000 }` | - |

## 4. 数据契约

- 文档中的公式格式：行内 `$latex$`，行间 `$$latex$$`（可跨行）。
- `FormulaRef = { from, to, latex, display }`：`from/to` 为含分隔符的文档偏移。
- `HeFormulaDialog` 的 `confirm` 回传 **不含分隔符** 的编辑文本与 `display`；由 `HeMdEditor` 负责重新拼成 `$...$` 或 `$$...$$`。
- `HeFormulaEditor` 用 `v-model` 绑定编辑文本、`v-model:display` 绑定行间模式，并暴露 `focus` / `validate` / `clear`。
- `HeMathPreview` 接收裸文本（LaTeX 或 Unicode 数学文本），内部自行包裹 `\(...\)` / `\[...\]`；MathJax 已确认可直接排版 `×`、`−`、`÷`、`√`、`∑` 等 Unicode 字符。
- `HeMdViewer` 接收 `markdown` 源码，不接收 HTML、`v-model` 或编辑事件；空内容时按 `emptyText` 渲染占位。
- MathJax 只识别 `\(...\)` / `\[...\]`，**不要**在 MathJax 配置中启用 `$` 分隔符。

## 5. 核心机制与不变量

### 5.1 公式扫描（`core/formula/parser.ts`）

规则：

- 行内公式开头 `$` 后、闭合 `$` 前不能是空白；公式内容不能为空。
- 行内公式不跨行；`$$` 可跨行。
- 行间公式 `$$` 后允许换行与首尾空白，解析时对 LaTeX 做 `trim()`。
- 反斜杠转义：`\$` 不参与配对。
- 通过 `syntaxTree` 排除 `FencedCode` / `IndentedCode` / `InlineCode`。
- 跨行公式必须用 `Decoration.replace({ widget, block: true })` 覆盖整行。

不变量：`matchFormulaAt` 是公式识别的**唯一实现**。`scanFormulas`（编辑器原子化）与 `core/renderer` 的 markdown-it 规则都复用它，不再维护两份规则。修改公式语法只需改 `core/formula/parser.ts`，并同步 README.md / README.zh-CN.md 的公式规则。

### 5.2 原子化

- 装饰由 `StateField` 提供：块级装饰不能通过 `ViewPlugin` 注入，否则编辑器挂载时报 `Block decorations may not be specified via plugins`。
- `EditorView.atomicRanges` 绑定同一套 decorations，使光标跳过公式、删除按整体处理。
- `FormulaWidget.eq` 比较 `latex` / `display` / `from`，避免无意义重绘。
- Widget 用 `mousedown` + `preventDefault` + `stopPropagation` 触发编辑，避免光标落入公式。
- Widget 创建后 `queueMicrotask` 调 MathJax 渲染；未加载完会进入服务队列。

### 5.3 编辑器与弹窗联动

- 工具栏「∑ 公式」→ `openFormulaEditor(null)` → 光标处插入。
- 点击已有标签 → `openFormulaEditor(ref)` → 记录 `editRange` → 确认后 `changes: { from, to, insert }` 原位替换。
- 确认时对 `from/to` 做 `Math.min(..., doc.length)` 钳制，防止文档变短导致越界。

### 5.4 预览

- `core/renderer` 的数学规则输出 `<span class="he-math">\(...\)</span>` 或 `<div class="he-math he-math--display">\[...\]</div>`。
- `renderMarkdownInto(el, markdown)` 负责设置 `innerHTML` 并调用 MathJax 排版。
- `HeMdEditor` 预览与 `HeMdViewer` 共用该方法与 `.he-markdown-body` 排版样式。
- `renderPreview` 默认 250ms 防抖；挂载与切换 `preview` 时立即渲染。
- 每次渲染都重设 `innerHTML` 再整体 `typesetClear` + `typesetPromise`。

### 5.5 MathJax 服务

- 单例，构造时即开始加载 `${BASE_URL}mathjax/tex-svg.js`。
- **配置必须在脚本加载前写入** `window.MathJax`。
- `startup.typeset: false`，禁止自动全页排版。
- 未加载完成时 `renderElement` 返回 Promise 并排队，`onload` 后依次执行。
- `\oiint` / `\oiiint` 用 `◯` 叠加 `∬` / `∭` 的宏实现，偏移量按实测字宽给出。

### 5.6 代码高亮

- `core/renderer` 为 markdown-it 配置 `highlight` 选项，使用 highlight.js core 构建并按需注册语言。
- 已注册：`bash`、`css`、`java`、`javascript`、`json`、`markdown`、`python`、`sql`、`typescript`、`xml`；`ts` / `js` / `html` / `sh` 等别名由 highlight.js 自动处理。
- 未知语言或未标记语言返回空字符串，markdown-it 会转义并输出纯文本，不抛错。
- 主题类 `.hljs-*` 定义在 `src/styles/markdown-body.scss`，不引入 highlight.js 自带 CSS。
- 行内代码不做语言高亮，只使用 `code` 样式。

### 5.7 其他约束

- MathLive 的 `<math-field>` 是原生自定义元素，Vite 必须保留 `isCustomElement` 放行，否则模板编译报错。
- MathLive 虚拟键盘挂在 `body`，默认 `z-index: 105`，低于弹窗 `2000`，因此全局样式提升到 `3000`。
- 代码缩进为 **Tab**；Vue 使用 `<script setup lang="ts">` + `scoped` 样式。
- 路径别名 `@` → `src`。

### 5.8 公式编辑容器 / UI 拆分

- `HeFormulaDialog`：纯容器，只负责遮罩、标题、底部按钮、开关状态与打开时初始化；确认前调用 `HeFormulaEditor.validate()`。
- `HeFormulaEditor`：三段展示（LaTeX 原文 / 自研可编辑渲染公式 / MathJax 实时预览），外加工具栏、分数弹窗、行间开关、符号面板与校验；`v-model` 绑定 LaTeX 文本。`display` prop 默认 `true`，即「行间公式（独立成行）」默认勾选；新建公式默认插入 `$$...$$`，点击已有公式时沿用其原 `display`。
- 可编辑区实现：`parseLatex` 递归解析 `\frac` / `\tfrac` / 斜式 `{}^{a}\!/\!_{b}` / 上下标 `^{...}`、`_{...}`、前置 `{}^{...}`、`{}_{1}^{n}`，分子/分母与上下标里可继续嵌套；`renderEditor` 生成 `.me-frac > .me-frac__num/__den` 容器（斜式为 `.me-frac--skewed`，中间含 `.me-frac__slash`）与 `.me-script > .me-script__sup/__sub` 容器，容器内是 contenteditable `.me-text-slot`；`serializeEditor`/`serializeNodes` 递归还原 LaTeX（`\tfrac` 用 `.me-frac--small`，斜式输出 `{}^{...}\!/\!_{...}`，后置上下标位于容器开头时补 `{}` 空基底）；`syncFromEditor` 同步 v-model、LaTeX 原文与预览。
- `lastSerialized` 用于跳过内部输入触发的重渲染，避免光标丢失；`lastFocusedSlot` 用于符号按钮失焦后的插入回退。
- 分子/分母支持普通文本与嵌套分式混排：`ensureDirectTextSlot` 用于在容器同级取/建文本槽，不进入嵌套分式；分子内在嵌套分式边界按 `←` / `→` 会创建同级文本槽（`2\frac{a}{b}` 这类混排可编辑）；点击分子/分母容器留白也走该函数。`getEdgeSlot` 只用于需要递归进入分式边缘的场景（点击公式本体、分子→分母等）。
- 键盘导航：`getActiveSlot` 通过槽位父容器判断 `num` / `den` / `sup` / `sub` / `text`；`handleArrow` 调用 `moveSibling`。公式外部把每个分式 / 上下标视为整体，`←` / `→` 跨过整座公式并落到相邻文本槽，不会进入分子/分母或上下标；只有点击进入公式后，方向键才在内部元素间移动。进入后：分子末尾 `↓` / `→` 进入分母，分母开头 `↑` / `←` 回到分子；上标 `↓` 进下标、下标 `↑` 回上标；公式外侧边界跳出到紧邻的文本槽，因此 `\frac{a}{b}+c` 的 `+c` 位于分式外层。
- `insertFraction` / `insertNodesAtCaret` 在当前文本槽内按光标切分并插入新节点，所以在分子/分母或上下标内再次插入会形成嵌套结构，层级不设限。插入前若选区非折叠，先 `range.deleteContents()`，避免残留空文本槽。
- 空文本槽用零宽空格 `\u200b` 占位：`readSlotText` / `stripPlaceholder` 在序列化、首尾判断与空槽判定时过滤；槽位被删空后 `ensurePlaceholder` 自动补回并把光标放进文本节点；`onEditorFocusOut` 清理分子/分母中遗留的空槽，避免编辑区出现多余空白块。
- 分数浮层第一排为 `分数（竖式）\frac`、`分数（横式）a/b`、`分数（斜式）{}^{a}\!/\!_{b}`、`分数（小型分数）\tfrac`，不再提供连分式卡片；下方保留常用分数。
- `focusSlot` 必须把光标落到文本节点内部（`range.setStart(textNode, offset)`），落到 contenteditable 元素边界会导致方向键无法进入文字。
- 分式 / 上下标不是 contenteditable，无法用默认退格删除：`handleDelete` 在 `Backspace`（分子 / 上标 / 下标开头）/ `Delete`（分母 / 上标 / 下标末尾）以及文本槽与原子节点相邻的边界删除整个 `.me-frac` / `.me-script`；`removeAtomNode` 会先确保前后有文本槽可落光标，再移除节点并同步 LaTeX。
- 点击编辑区空白时用 `focusByPoint` 按 `clientX` 与子节点 `getBoundingClientRect()` 判断落点：分式左侧创建/进入前置文本槽，右侧创建/进入后置文本槽；点击 `.me-frac` 本体时聚焦分子。
- 顶部工具栏共 12 个按钮：`符号`（Ω）、`分数`、上下标、根式、积分、大型运算符、括号、函数、导数符号、极限和对数、运算符、矩阵；分数与上下标已绑定弹层，其余暂未绑定行为。
- 分数按钮打开浮层：第一排 4 个格式（分数（竖式）`\frac{a}{b}`、分数（横式）`a/b`、分数（斜式）`{}^{a}\!/\!_{b}`、分数（小型分数）`\tfrac{a}{b}`），下方「常用分数」（`dy/dx`、`Δy/Δx`、`∂y/∂x`、`δy/δx`、`π/2`）；竖式、斜式、小型和常用分数插入结构化分式并选中分子，横式以文本模板插入。
- 上下标按钮打开浮层：第一排 4 个格式（上标 `x^{}`、下标 `x_{}`、上下标 `x_{}^{}`、前置上下标 `{}_{}^{}x`），下方「常用的下标和上标」（`x_{y^2}`、`e^{-iωt}`、`x^2`、`{}_{1}^{n}Y`）；格式卡片以 `x` 为基底插入结构化上下标并聚焦对应槽位，常用模板按解析结果插入并聚焦第一个上下标槽。
- `#/input` 直接渲染 `HeFormulaEditor`；`HeMdEditor` 通过 `HeFormulaDialog` 使用同一个 UI。
- 输入模型是 LaTeX 文本；`*` / `-` / `/` 映射为 `×` / `−` / `÷`；MathJax 已确认可直接排版这些 Unicode 字符。
- `HeMathInput`（MathLive）仅保留在 EditorPage 的内嵌示例中，不再用于公式弹窗。
- 当前限制：`\frac` / `\tfrac` / 斜式 `{}^{a}\!/\!_{b}` / 上下标 `^`、`_` 已结构化；`\cfrac` / `\dfrac` 和其他未支持的 LaTeX 命令在可编辑区仍显示为文本，实时预览会正确渲染。

### 5.9 国际化

- 使用 vue-i18n（Composition API 模式），在 `src/main.ts` 通过 `.use(i18n)` 安装。
- `src/i18n/index.ts` 的 `DEFAULT_LOCALE` 为默认语言；用户切换结果写入 `localStorage` 的 `hemath-editor:locale`，并同步 `<html lang>`。
- 顶部导航右侧的 `EN` / `中文` 按钮调用 `setLocale` 切换；`App.vue` 的导航、页面标题、浏览器标题全部来自 `t()`。
- 组件内使用 `useI18n()`：模板用 `t('key')`；`HeMdEditor` 的 `tools` 是 computed，保证语言切换后按钮标题/占位文字同步更新。
- `HeFormulaEditor` 的分式卡片只显示图形，名称放在 `title` 悬浮提示中；toolbar 的 key 使用 camelCase id（`largeOperator` / `limitLog`），与消息包一一对应。
- 槽位在运行时命令式创建，`aria-label` 通过 `watch(locale)` 统一刷新，避免语言切换后残留旧文案。
- 新增文案必须同时写入 `zh-CN.ts` 与 `en-US.ts`；新增语言需扩展 `SUPPORTED_LOCALES` / `isAppLocale` 并调整导航语言控件。

## 6. 常见改动路径

| 需求 | 修改位置 |
| --- | --- |
| 新增 Markdown 工具栏按钮 | `src/editor/mdCommands.ts` 加命令；`HeMdEditor.vue` 的 `tools` 数组注册 |
| 新增公式常用符号 | `HeFormulaEditor.vue` 的 `symbols`；演示页 `EditorPage.vue` 的 MathLive 符号可选同步 |
| 修改公式分隔符/识别规则 | `src/core/formula/parser.ts`（唯一定义）+ `src/core/renderer/index.ts`（token 输出）+ `mathjax.ts`（分隔符配置）+ README.md / README.zh-CN.md |
| 新增代码高亮语言 | `src/core/renderer/index.ts` 导入并 `registerLanguage`；必要时在 `markdown-body.scss` 补充 token 样式 |
| 调整自研输入 / 键盘映射 | `src/components/HeFormulaEditor.vue` 的 `symbolMap` 与 `onKeydown` |
| 调整弹窗容器 / 按钮 | `src/components/HeFormulaDialog.vue` |
| 调整数学字体 / 字符回退 | `src/styles/math-font.scss` 的 `@font-face` 与 `unicode-range` |
| 调整分数格式弹窗 | `src/components/HeFormulaEditor.vue` 的 `fractionFormats` / `commonFractions` |
| 调整可编辑公式解析/序列化 | `src/components/HeFormulaEditor.vue` 的 `parseLatex` / `renderEditor` / `serializeEditor` |
| 新增/导出组件 | 组件文件 + `src/index.ts`；需要独立入口时新增 `src/<name>/index.ts` |
| 调整公式标签样式 | `HeMdEditor.vue` 中 `:deep(.he-formula-atom*)` |
| 调整 Markdown 排版 | `src/styles/markdown-body.scss`（编辑器预览与只读展示共用） |
| 调整只读展示容器 | `HeMdViewer.vue` 的 scoped 样式 |
| 新增 MathJax 宏/配置 | `src/utils/mathjax.ts` 的 `window.MathJax` 配置 |
| 更换 MathJax 版本 | 替换 `public/mathjax/tex-svg.js`，核对 `tex-svg.js` 是否为完整构建 |
| 新增 npm 子路径入口 | `src/<name>/index.ts` + 后续 `package.json` 的 `exports` |
| 新增演示页 | `src/pages/XxxPage.vue`，并在 `src/App.vue` 的 `pages`、`navItems`、`pageTitles` 注册 |
| 修改演示页公共样式 | `src/styles/demo.scss` |
| 修改 hash 路由 | `src/App.vue` 的 `parseRoute` / `applyRoute` |
| 新增/修改界面文案 | 在 `src/i18n/locales/zh-CN.ts` 与 `en-US.ts` 同步加 key，组件内用 `t()`；不要在模板硬编码中文 |
| 新增语言 | 新增消息包 + `src/i18n/index.ts` 的 `SUPPORTED_LOCALES` / `isAppLocale` + 导航语言控件 |
| 改端口/别名 | `vite.config.ts` |

## 7. 验证方式

无测试框架，最低验证标准：

```bash
npm run build   # vue-tsc --noEmit + vite build
npm run dev     # http://localhost:3100 手工验证
```

手工回归清单：

1. 输入 `$x^2$` 与 `$$\int_a^b f(x)dx$$`，确认编辑器中出现公式标签。
2. 光标不能进入公式内部；退格整块删除。
3. 点击标签能打开弹窗且初值正确；确认后原位替换。
4. 代码块中的 `$x$` 不被识别为公式。
5. 右侧预览中公式正常排版，MathJax 加载前不报错。
6. 行间开关默认勾选；勾选时插入的源码为 `$$...$$`，取消勾选后为 `$...$`；点击已有公式时开关状态与该公式一致。
7. 空公式确认时出现「请先输入公式」。
8. 只读展示区出现标题、列表、引用，行内与行间公式各生成 MathJax SVG，页面不出现原始 `$$`。
9. 编辑器预览与只读展示的标题字号、行高、引用边框保持一致。
10. 顶部导航可在 HeMdEditor / 公式输入 / HeMdViewer / HeMdWysiwyg 间切换，URL hash 与当前导航高亮同步。
11. 直接访问 `#/input`、`#/viewer`、`#/wysiwyg` 能打开对应页面，浏览器前进 / 后退正常，未知 hash 回退首页。
12. 围栏代码块按语言生成 `.hljs-*` span 并有对应颜色；未知语言回退为纯文本。
13. `#/input` 与公式弹窗中都渲染 `.he-formula-editor`，确认两者使用同一个 UI 组件。
14. 在 `#/input` 或弹窗输入框中按 `*`、`-`、`/`，内容分别变为 `×`、`−`、`÷`；点击符号面板可插入 Unicode 符号。
15. 弹窗空内容点击“插入”时显示“请先输入公式”且不关闭；有内容时确认后回传文本并关闭。
16. 点击 HeMdEditor 中已有公式标签，弹窗输入框能带入原文本并正常预览。
17. 点击分数按钮打开浮层，第一排为分数（竖式）/（横式）/（斜式）/（小型分数）4 张卡片，下方 5 个常用分数，没有连分式；点击卡片插入对应 LaTeX 并关闭浮层，弹窗内不被裁切。
18. 页面显示三段：LaTeX 原文、可编辑渲染公式、实时预览；编辑分子/分母或文本槽位后，LaTeX 原文与预览同步更新。
19. 插入竖式后分子默认选中；点击分子/分母可继续输入，分式结构与 LaTeX 原文保持一致；插入小型分数后原文为 `\tfrac{a}{b}`，节点带 `me-frac--small`。
20. 分子末尾按 `↓` / `→` 能进入分母；分母开头按 `↑` / `←` 能回到分子。
21. 分母末尾按 `↓` / `→` 或分子开头按 `↑` / `←` 能跳到分式外层文本槽，输入 `+c` 后 LaTeX 原文为 `\frac{a}{b}+c`，`+c` 不在分子或分母内部。
22. 分子开头按 `Backspace`、分母末尾按 `Delete` 能删除整个分式；删除后组件内仍有可聚焦文本槽，LaTeX 原文同步更新。
23. 点击编辑区右侧空白处后可直接输入后缀（不会跳进分子），点击左侧空白处可直接输入前缀。
24. 光标在分子/分母内时再次插入竖式，会生成嵌套分式（如 `\frac{1}{\frac{2}{3}}`）；嵌套分式的分子/分母同样可用方向键互跳，并在分母末尾按 `↓` 跳出到最外层。
25. 选中分子内容后直接插入竖式，选中内容被新分式替换，编辑区不出现多余的空白块；空槽失焦后会被清理，空槽内的光标贴合文本基线。
26. 点击导航右侧 `EN` / `中文` 按钮：导航、页面标题、工具栏、字段名、弹窗按钮、悬浮提示全部切换；刷新后保持所选语言，`<html lang>` 与浏览器标题同步更新。
27. 分式卡片不再显示常驻名称，鼠标悬浮时 `title` 显示当前语言的分式名称（中文或英文）。
28. 插入分数（斜式）后，可编辑区渲染为“上标分子 / 下标分母”的斜式结构；分子/分母可点击编辑，`↓` / `↑` 可在两者之间移动，分母末尾 `→` 可跳出到外层，分子开头 `Backspace` 可整块删除；LaTeX 原文保持 `{}^{...}\!/\!_{...}`。
29. 在公式外部（根级文本槽）按 `→` / `←` 会跨过相邻的整座公式，光标落到公式另一侧的文本槽，不会进入分子/分母；点击公式后才能进入内部编辑。
30. 分子/分母可与整数等文本混排：例如 `\frac{\frac{a}{b}}{b}` 中，在嵌套分式的分子开头按 `←` 会在外层分子创建一个文本槽，输入 `2` 后原文为 `\frac{2\frac{a}{b}}{b}`；点击分子/分母留白也能创建同级文本槽。
31. 点击上下标按钮打开浮层：第一排 4 张格式卡片（上标 / 下标 / 上下标 / 前置上下标），第二排为「常用的下标和上标」4 个模板；点击卡片关闭浮层并插入结构化上下标。
32. 插入上标后原文为 `x^{}` 并选中上标槽，输入 `2` 后原文为 `x^{2}`；插入上下标后原文为 `x_{}^{}`，上标槽按 `↓` 进入下标槽、下标槽按 `↑` 回到上标槽；插入前置上下标后原文为 `{}_{}^{}x`。
33. 点击常用模板 `{}_{1}^{n}Y` 后原文保持 `{}_{1}^{n}Y`；点击 `x_{y^2}` 后原文为 `x_{y^{2}}`，可编辑区正确显示下标内嵌套上标，且无多余空白块。
34. 在上下标槽位开头按 `Backspace`、末尾按 `Delete` 能整块删除上下标；在根级文本槽按 `←` / `→` 会跨过整座上下标而不是进入内部。

## 8. 提交与版本规则（强制）

- **每次提交代码前，必须更新 [CHANGELOG.md](CHANGELOG.md) 的 `[未发布]` 区块**，写明新增 / 修复 / 变更 / 移除 / 文档 / 工程。
- 工具栏按钮、分数格式、符号面板或可编辑区交互有变化时，必须同步更新 [TOOLBAR.md](TOOLBAR.md) 的支持矩阵和更新记录（新增一行「日期 + 支持项」）。
- 分支策略：文档/小 bug 可直接提交 `master`；新功能、重构、跨文件或交互改动走 `feat/*`；发版走 `release/x.y.z`，紧急修复走 `hotfix/*`。合并前至少运行 `npx vue-tsc --noEmit`；本仓库推荐本地 `git merge --no-ff` 后一次 `git push` 同步 Gitee 与 GitHub。
- 提交信息沿用现有风格：`feat: ...`、`fix: ...`、`docs: ...`、`init: ...`。
- 发版时：把 `[未发布]` 归档为 `x.y.z - YYYY-MM-DD`，并同步 `package.json` 的 `version`。
- 只改文档也必须写 CHANGELOG。
- 未经用户明确要求，不要自动 `git commit` 或 `git push`。

## 9. 易错点

- 把 MathJax 配置写到脚本 `onload` 之后：无效，必须先配置再加载。
- 在 MathJax 中启用 `$` 分隔符：正文普通美元符号会被误配对。
- 修改公式语法只改了 `core/formula/parser.ts`，却漏改 `core/renderer` 的 token 输出：编辑器与预览表现不一致。
- 跨行公式使用非 block 装饰：CodeMirror 抛错或渲染异常。
- 用 `ViewPlugin` 提供跨行公式的块级装饰：CodeMirror 报 `Block decorations may not be specified via plugins`，必须改用 `StateField`。
- 点击公式时未 `preventDefault`：光标落入替换装饰范围，交互异常。
- 删除 `isCustomElement` 配置：Vue 编译器把 `<math-field>` 当普通组件处理而报错。
- 修改 `public/mathjax/tex-svg.js` 路径后未同步 `BASE_URL` 逻辑：部署到子路径时 404。
- 新增页面只建了 SFC，未注册到 `src/App.vue` 的 `pages` / `navItems`：导航无法访问。
- 在模板或 TS 中硬编码界面文案：切换语言后不会更新；必须使用 `t()` 并同时补中英文消息包。
- 只在 `zh-CN.ts` 加 key 而漏掉 `en-US.ts`：英文界面会回退到中文或显示 key。
- 命令式创建的 DOM（如 `HeFormulaEditor` 的槽位）不处理语言切换：`aria-label` 会残留旧语言，需要在 `watch(locale)` 中刷新。
- KeepAlive 页面里的 Teleport 弹窗未在 `onDeactivated` 关闭：切换页面后弹窗会残留在其他页面。
- 分数浮层过高：在 `HeFormulaDialog` 的 `overflow-y` body 中底部会被裁切；卡片保持 68px、间距紧凑。
- 每次 input 后用 Vue 响应式重渲染可编辑区：光标会丢失；当前使用命令式 DOM + `lastSerialized` 跳过自身更新。
- `parseLatex` 递归解析 `\frac` / `\tfrac` / 斜式 / 上下标：分子、分母、上下标里的内容继续结构化；斜式通过 `{}^{...}\!/\!_{...}` 识别（忽略空白与 `\!`），前置上下标通过 `{}^{...}` / `{}_{...}` 独占识别且不消费后面的基底；`\cfrac`、`\dfrac` 等未支持的命令按文本保留，避免错误拆分。
- 上下标空内容用空数组 `[]` 表示存在该槽位（`[]` 为真值），`null` 表示该方向不存在；序列化后置上下标位于容器开头时必须补 `{}` 空基底，否则 `^{2}` 会被 MathJax 判为非法。
- 可编辑槽位缺少 `contenteditable`，或分式 / 上下标容器缺少 `me-frac__num` / `me-frac__den`、`me-script__sup` / `me-script__sub` 类名：无法点击进入，键盘导航也无法判断槽位角色。
- 演示页使用 hash 路由，不要改成 history 模式，否则静态部署刷新会 404。
- 只注册了 highlight.js 语言但没补 `.hljs-*` 样式：代码块有 span 但没有任何颜色。
- 直接引入完整 `highlight.js` 而不是 `highlight.js/lib/core` + 语言模块：包体积会明显增大。
- 数学字体只写 `font-family` 而没有 `unicode-range`：数字与字母不会分别命中 `KaTeX_Main` / `KaTeX_Math`。
- 把编辑逻辑写回 `HeFormulaDialog`：容器只负责弹窗，编辑逻辑必须在 `HeFormulaEditor`。
- 把 `HeFormulaEditor` 再拆出一个独立键盘输入组件：当前要求编辑 UI 统一在一个组件内。
- 在 `HeFormulaDialog` 中重新引入 MathLive：公式弹窗已改用自研 KaTeX 输入，`HeMathInput` 仅保留在内嵌示例。
