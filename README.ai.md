# README.ai.md · 面向 AI 的项目速读

> 目标：让 AI 在最少上下文中理解 heMathEditor 的架构、契约、不变量与改动路径。人类向说明见 [README.md](README.md)（英文）与 [README.zh-CN.md](README.zh-CN.md)（中文）。

## 1. 一句话定位

Vue 3 + Vite 的「两层公式编辑器」：CodeMirror 6 负责 Markdown 正文，公式以 `$...$` / `$$...$$` 源码存储在文档中，但在编辑器里渲染为不可分割的整体标签；点击标签弹出 `HeFormulaEditor`（自研 KaTeX 输入 + MathJax 预览），确认后原位回写源码。

当前状态：**pnpm monorepo**（`packageManager: pnpm@12.15.0`）。`packages/editor` 是发布到 npm 的核心库（`he-math-editor`，含 `./full` 离线入口与 `./style.css` 样式入口，构建产物 `dist-lib` + d.ts）；`apps/demo` 是演示站（`@hemath/demo`），通过 vite alias 直连库源码热更新。许可证为 AGPL-3.0 / 商业双许可（`packages/editor/LICENSE`）。

## 2. 架构分层

```
根 package.json（monorepo 脚本：pnpm dev / build / build:lib / preview）
├─ packages/editor（库 he-math-editor → dist-lib）
│  └─ src/index.ts（主入口：组件 + 命令 + core + MathJax 服务 + i18n + 插件安装）
│     ├─ components/
│     │  ├─ HeMdEditor.vue            模式 1：分栏编辑
│     │  │  ├─ CodeMirror 6
│     │  │  │  ├─ markdown 语法高亮 / 历史 / 快捷键（Mod-b、Mod-i）
│     │  │  │  └─ formulaAtom(onEdit) 公式 → 原子标签（Decoration.replace + Widget）
│     │  │  ├─ core/renderer（markdown-it + 数学规则）→ 预览 HTML
│     │  │  │  └─ renderMarkdownInto → mathJaxService.renderElement(el)   逐元素排版
│     │  │  └─ HeFormulaDialog        弹窗容器（遮罩 + 标题 + 按钮）
│     │  │     └─ HeFormulaEditor     共用编辑 UI
│     │  │        ├─ LaTeX 源码 textarea（可编辑，双向同步）
│     │  │        ├─ 结构化可编辑公式区（contenteditable 槽位）
│     │  │        └─ HeMathPreview    MathJax 预览
│     │  ├─ HeMdViewer.vue            模式 2：只读展示（仅 core/renderer + MathJax）
│     │  ├─ HeMathInput.vue           MathLive 输入（仅 EditorPage 内嵌示例）
│     │  ├─ toolbar/catalog/          工具栏目录数据与类型（tools / symbolMap / 弹层卡片数组 / 预览构建）
│     │  └─ formula/                  结构化节点：ParsedNode、命令表、parseLatex、create* 渲染、serializeNodes
│  ├─ src/full.ts（./full 入口：构建期 emit 包内 tex-svg.js，离线可用）
│  └─ vite.lib.config.ts（库构建：双入口 + dts + 单一 style.css）
└─ apps/demo（演示站 @hemath/demo，workspace:* 依赖库）
   └─ src/App.vue（hash 路由 + 顶部导航）
      ├─ pages/EditorPage.vue（/）
      ├─ pages/ViewerPage.vue（/viewer）
      ├─ pages/InputPage.vue（/input，直接渲染 HeFormulaEditor）
      └─ pages/WysiwygPage.vue（/wysiwyg，占位页）
```

## 3. 文件地图

| 文件 | 职责 | 关键导出 |
| --- | --- | --- |
| `packages/editor/src/index.ts` | 库主入口：具名导出组件/命令/core/服务/i18n + 默认导出 Vue 插件（`app.use` 自动装 i18n 并全局注册组件） | 全部组件、`formulaAtom`、`core`、`mathJaxService` 等 |
| `packages/editor/src/full.ts` | `./full` 离线入口：通过构建期虚拟模块把包内 tex-svg.js emit 为资产并 configure | 同主入口 |
| `packages/editor/src/components/HeMdEditor.vue` | 第一层编辑器：工具栏、CodeMirror 挂载、250ms 防抖预览、弹窗联动 | 默认导出；暴露 `focus` / `insertText` / `getValue` |
| `packages/editor/src/components/HeMdViewer.vue` | 只读展示：`markdown` 渲染、`emptyText` 空状态，仅依赖 core/renderer | 默认导出 |
| `packages/editor/src/components/HeFormulaDialog.vue` | 弹窗容器：遮罩、标题、底部按钮、开关与打开时初始化 | 默认导出；`confirm(text, display)` |
| `packages/editor/src/components/HeFormulaEditor.vue` | 共用编辑 UI：工具栏、分数/上下标/根式/积分/大型运算符/括号/函数/导数符号/极限和对数/运算符弹层、LaTeX 源码 textarea、结构化可编辑公式区、MathJax 预览、行间开关、符号面板、校验 | 默认导出；暴露 `focus` / `validate` / `clear` |
| `packages/editor/src/components/HeMathInput.vue` | MathLive 输入封装，仅用于 EditorPage 内嵌示例 | 默认导出；暴露 `focus` / `insert` / `getValue` |
| `packages/editor/src/components/toolbar/catalog/` | 工具栏纯数据与类型：`types.ts`、`tools.ts`（tools / symbols / symbolMap / popoverToolIds）、按弹层拆分的卡片数组与预览构建函数（fraction / scripts / root / integral / bigOperator / bracket / function / derivative / operator）、`previewUtils.ts`、`index.ts` barrel | 全部类型与常量 |
| `packages/editor/src/components/toolbar/ToolCard.vue` | 弹层通用卡片：`title` / `html` / `text` 内容、`tall` / `wide` / `span2` 变体、`mathFont` 开关，`pick` 事件；全部卡片样式（含 `:deep()` 预览族）在此维护 | 默认导出；`pick` |
| `packages/editor/src/components/formula/` | 结构化公式内核：`types.ts`（`ParsedNode`）、`commands.ts`（解析命令表 + 序列化反查表）、`parser.ts`（`parseLatex` 与读取器）、`renderer.ts`（`createFormulaRenderer(t)` → `create*Element` / `appendNodes` / `renderInto`）、`serializer.ts`（`serializeNodes`）、`dom.ts`（槽位文本 / 括号段 / 堆栈行 / 无障碍 key） | `parseLatex`、`createFormulaRenderer`、`serializeNodes`、`ParsedNode` |
| `packages/editor/src/components/HeMathPreview.vue` | MathJax 单公式预览，空值显示占位 | 默认导出 |
| `packages/editor/src/core/formula/parser.ts` | **公式解析唯一实现**：`matchFormulaAt` / `scanFormulas` | `FormulaMatch`、`matchFormulaAt`、`scanFormulas` |
| `packages/editor/src/core/renderer/index.ts` | 统一 Markdown 渲染：markdown-it 实例、数学规则、highlight.js 代码高亮、MathJax 排版入口 | `markdownRenderer`、`renderMarkdownHtml`、`renderMarkdownInto` |
| `packages/editor/src/editor/formulaAtom.ts` | 代码区排除、原子化 `StateField`、点击回调；扫描复用 core | `formulaAtom`、`scanFormulas`、`FormulaRef` / `FormulaEditHandler` |
| `packages/editor/src/editor/mdCommands.ts` | 工具栏命令：标题、行前缀、内联包裹、块插入 | `toggleHeading`、`toggleWrap`、`insertTable` 等 |
| `packages/editor/src/viewer/index.ts` | 只读展示子路径入口（预留，未注册到 exports） | `HeMdViewer` |
| `packages/editor/src/i18n/index.ts` | 库 i18n 实例、语言检测（localStorage / `DEFAULT_LOCALE`）、`getLocale` / `setLocale` / `toggleLocale` | `i18n`、`AppLocale`、`SUPPORTED_LOCALES` |
| `packages/editor/src/i18n/locales/zh-CN.ts` / `en-US.ts` | 库文案（common / formula / markdown），随包发布 | 默认导出消息对象 |
| `packages/editor/src/utils/mathjax.ts` | MathJax 单例：懒加载、来源三级策略、渲染队列、宿主复用、`\oiint` 宏 | `mathJaxService`、`renderTex` |
| `packages/editor/src/styles/global.scss` | 库全局样式入口（math-font + markdown-body + MathLive 键盘层级），打进 `dist-lib/style.css` | - |
| `packages/editor/src/styles/markdown-body.scss` | 编辑器预览与只读展示共享的 Markdown 排版 | - |
| `packages/editor/src/styles/math-font.scss` | `HeMathFont`：通过 unicode-range 组合 KaTeX_Main 与 KaTeX_Math | `HeMathFont`、`.he-math-font` |
| `packages/editor/vite.lib.config.ts` | 库模式构建：双入口（index/full）、vite-plugin-dts、external 策略、tex-svg 外置资产插件 | - |
| `packages/editor/vitest.config.ts` | 单元测试配置：jsdom 环境 + @vitejs/plugin-vue，匹配 `src/**/*.{test,spec}.ts` | - |
| `packages/editor/src/components/__tests__/` | 组件单元测试（`integral` 积分 / 围道积分 / 微分；`bracket` 括号 / 分隔符 / 单侧括号 / 事例堆栈 / 常用公式；`sum` 求和；`prod` 乘积与副积（含 5 板块结构）；`union` 并集与交集；`veeWedge` 或运算与与运算；`commonBigop` 常用大型运算符；`delete` 分式 / 上下标 / 大型运算符边界删除；`function` 三角 / 反函数 / 双曲 / 反双曲函数弹层 / 插入 / 解析 / 嵌套 / 跳出 / 整块删除与常用函数模板；`limitLog` 极限和对数弹层 / 下标槽 / 插入 / 解析 / 下标与参数互跳 / 分级删除 / 常用模板；`operator` 运算符弹层 / 纯文本卡与叠等号结构化节点插入 / 解析往返（`\mathrm` 剥壳与归一）/ 记号槽导航与整块删除 / 弹层互斥；`arrow` 运算符结构 12 卡 / 箭头标注节点插入 / `\xleftarrow`、`\xrightarrow` 与 `\overset`、`\underset` 组合解析往返 / 双槽互跳与分级退格 / 点击聚焦；`derivative` 重音符号 / 带标记花括号 / 带框公式 / 顶线与底线 / 常用导数对象；均覆盖弹层 / 插入 / 解析 / 序列化 / 导航 / 删除） | `pnpm test` |
| `packages/editor/LICENSE` | AGPL-3.0 全文 + 商业双许可声明 + 第三方依赖清单 | - |
| `apps/demo/src/App.vue` | 应用外壳：顶部导航、hash 路由、页面切换与标题同步 | - |
| `apps/demo/src/main.ts` | `installDemoMessages()` 后 `app.use(HeMathEditor)` 整体安装 | - |
| `apps/demo/src/i18n/index.ts` | 把 demo 专属文案 `mergeLocaleMessage` 合并进库 i18n | `installDemoMessages` |
| `apps/demo/src/i18n/locales/zh-CN.ts` / `en-US.ts` | demo 文案（common 切换按钮 / nav / pageTitles / *Page 页面说明） | 默认导出消息对象 |
| `apps/demo/src/pages/*.vue` | EditorPage / InputPage / ViewerPage / WysiwygPage 演示页 | 默认导出页面组件 |
| `apps/demo/src/styles/demo.scss` | 演示页公共样式：页面、卡片、按钮、标签 | - |
| `apps/demo/vite.config.ts` | `@` → `apps/demo/src`；alias `he-math-editor` → `packages/editor/src/index.ts`（跨包热更新）；publicDir 复用库的 public | - |
| `packages/editor/src/assets/fonts/katex/` | KaTeX_Main / KaTeX_Math 字体文件（复制自 mathlive@0.100.0） | - |
| `TOOLBAR.md` | 工具栏支持清单：按钮状态、分数格式、可编辑区能力与逐次更新记录 | - |
| `pnpm-workspace.yaml` | workspace 定义（packages/* + apps/*）+ onlyBuiltDependencies | - |
| 根 `package.json` | monorepo 脚本：`dev` / `build` / `build:lib` / `preview`（pnpm --filter） | - |

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

- 单例；脚本**懒加载**：首次 `renderElement` 才注入，让 `configure` 有机会在加载前介入。
- **配置必须在脚本加载前写入** `window.MathJax`；加载已开始后 `configure` 会被忽略。
- 脚本来源三级优先：`mathJaxService.configure({ source })` > `he-math-editor/full` 入口（构建期 emit 包内 tex-svg.js 并自动 configure）> 默认（`import.meta.env.DEV` 用本地 `public/mathjax`，生产用 npmmirror CDN）。
- 宿主项目已自行加载完整 MathJax（`window.MathJax.typesetPromise` 存在）时直接复用；注意 `loadMathJax` 会先写配置占位对象，不能作为就绪依据。
- `startup.typeset: false`，禁止自动全页排版。
- 未加载完成时 `renderElement` 返回 Promise 并排队，`onload` 后依次执行。
- `\oiint` / `\oiiint` 用 `◯` 叠加 `∬` / `∭` 的宏实现，偏移量按实测字宽给出。

### 5.6 代码高亮

- `core/renderer` 为 markdown-it 配置 `highlight` 选项，使用 highlight.js core 构建并按需注册语言。
- 已注册：`bash`、`css`、`java`、`javascript`、`json`、`markdown`、`python`、`sql`、`typescript`、`xml`；`ts` / `js` / `html` / `sh` 等别名由 highlight.js 自动处理。
- 未知语言或未标记语言返回空字符串，markdown-it 会转义并输出纯文本，不抛错。
- 主题类 `.hljs-*` 定义在 `packages/editor/src/styles/markdown-body.scss`，不引入 highlight.js 自带 CSS。
- 行内代码不做语言高亮，只使用 `code` 样式。

### 5.7 其他约束

- MathLive 的 `<math-field>` 是原生自定义元素，Vite 必须保留 `isCustomElement` 放行，否则模板编译报错（demo 与库构建配置均已放行）。
- MathLive 虚拟键盘挂在 `body`，默认 `z-index: 105`，低于弹窗 `2000`，因此库全局样式（`global.scss`）提升到 `3000`。
- 代码缩进为 **Tab**；Vue 使用 `<script setup lang="ts">` + `scoped` 样式。
- 路径别名：demo 内 `@` → `apps/demo/src`，并把 `he-math-editor` alias 到库源码（跨包热更新）；**库内部一律相对导入，不使用 `@`**。
- 库构建 external 策略：`vue` / `vue-i18n` 为 peerDependencies；codemirror 系 / markdown-it / mathlive / highlight.js 保持外部引用（不打进产物），仅 `.css` 内联进 `style.css`。
- `vite.lib.config.ts` 的 `externalTexSvg` 插件：vite 对 `.js?url` 一律 inline 成 data URI，必须用 `emitFile` 把 tex-svg.js 外置为独立资产，`full` 入口靠它离线可用。

### 5.8 公式编辑容器 / UI 拆分

- `HeFormulaDialog`：纯容器，只负责遮罩、标题、底部按钮、开关状态与打开时初始化；确认前调用 `HeFormulaEditor.validate()`。
- `HeFormulaEditor`：三段展示（LaTeX 原文 / 自研可编辑渲染公式 / MathJax 实时预览），外加工具栏、分数弹窗、行间开关、符号面板与校验；`v-model` 绑定 LaTeX 文本。`display` prop 默认 `true`，即「行间公式（独立成行）」默认勾选；新建公式默认插入 `$$...$$`，点击已有公式时沿用其原 `display`。
- **LaTeX 原文是可编辑 textarea**：`v-model` 直接绑定 `text`；源码框输入 → `watch(modelValue)` → 与 `lastSerialized` 不同则 `renderEditor` 重建编辑区；编辑区输入 → `syncFromEditor` 回写 `text` 并更新 `lastSerialized`，跳过反向重渲染，实现双向同步。
- 可编辑区实现：`parseLatex` 递归解析 `\frac` / `\tfrac` / 斜式 `{}^{a}\!/\!_{b}` / 上下标 `^{...}`、`_{...}`、前置 `{}^{...}`、`{}_{1}^{n}` / 根式 `\sqrt{...}`、`\sqrt[n]{...}` / 积分 `\int` / `\iint` / `\iiint` 与围道 `\oint` / `\oiint` / `\oiiint`（最长优先匹配，可选跳过 `\limits`）/ 大型运算符 `\sum` / `\prod` / `\coprod` / `\bigcup` / `\bigcap` / `\bigvee` / `\bigwedge`（最长优先，`\nolimits` 行内式、`\limits` 兼容）/ 括号 `\left...\right`（`\middle|` 分段、单侧 `.` 空定界符、`\lbrack\lbrack` 双方括号）/ 竖向堆栈 `\begin{cases}` / `\begin{matrix}`（仅按顶层 `\\` 切行）/ 三角函数 `\sin` / `\cos` / `\tan` / `\csc` / `\sec` / `\cot`、反函数 `\sin^{-1}` / `\cos^{-1}` / `\tan^{-1}` / `\csc^{-1}` / `\sec^{-1}` / `\cot^{-1}`（命令表先于普通命令登记）与双曲函数 `\sinh` / `\cosh` / `\tanh` / `\csch` / `\sech` / `\coth`、反双曲函数 `\sinh^{-1}` / `\cosh^{-1}` / `\tanh^{-1}` / `\csch^{-1}` / `\sech^{-1}` / `\coth^{-1}`（`isCommandAt` 词边界，反函数 / 反双曲命令在命令表中先于普通命令登记）/ 对数与极限 `\log` / `\ln` / `\lim` / `\min` / `\max`（可选 `_{...}` 下标，`\lim` 与 `\ln` 按边界匹配）/ 叠等号 `\stackrel{top}{=}`（仅等号底座，非等号底座按原文保留；记号外层 `\mathrm{...}` 剥掉，槽内只显示内部文本）与 `\triangleq`（→ △ 上置叠等号）/ 箭头标注 `\xleftarrow[下]{上}` / `\xrightarrow{上}`（可选 `[...]` 下方组，方括号按嵌套深度扫描）与 `\overset` / `\underset` 包裹 `\Leftarrow` / `\Rightarrow` / `\leftrightarrow` / `\Leftrightarrow` 底座的组合（含 `\overset{上}{\underset{下}{底座}}` 双槽嵌套与 `\underset{下}{\overset{上}{底座}}` 归一；内核不是已知底座的 `\overset{a}{b}` 按原文保留）/ 导数符号 `\dot` / `\ddot` / `\dddot` / `\hat` / `\check` / `\acute` / `\grave` / `\tilde` / `\breve` / `\bar` / `\overbrace` / `\underbrace`（含带标签的 `\overbrace{x}^{1}` / `\underbrace{x}_{1}`）/ `\overline` / `\underline` / `\boxed` / `\overleftarrow` / `\overrightarrow` / `\overleftrightarrow` / `\overleftharpoon` / `\overrightharpoon`（命令表最长优先，`\overleftrightarrow` 不被较短前缀误判，`\dots` / `\hats` 不被短命令误判，`\underline` 不被 `\underbrace` 误判；`\bar{\bar{x}}` 递归解析为两层重音，紧跟 `\overbrace` / `\underbrace` 的 `^{...}` / `_{...}` 收进标签槽），分子/分母、上下标、根指数、被开方数、积分限界/被积函数、大型运算符限界/表达式、括号内容段、堆栈行与导数参数槽里可继续嵌套；`renderEditor` 生成 `.me-frac > .me-frac__num/__den`（斜式为 `.me-frac--skewed`，中间含 `.me-frac__slash`）、`.me-script > .me-script__sup/__sub`、`.me-root > .me-root__index / .me-root__sign / .me-root__radicand` 与 `.me-int > .me-int__sub/__sup/__sign/__integrand`、`.me-bigop > .me-bigop__sub/__sup/__sign/__operand`、`.me-bracket > .me-bracket__open/__sep/__content/__close`（单侧空定界符为 `.me-bracket__delim--empty`）、`.me-stack > .me-stack__brace/__rows/__row`、`.me-func > .me-func__name/__sup/__sub/__arg`（带下标的节点在名称与参数之间插入 `.me-func__sub`，节点带 `--with-sub`；lim / min / max 另带 `--sub-under` 网格布局）与 `.me-deriv > .me-deriv__mark/__arg/__label`（上方记号排在参数之前；`\underbrace` / `\underline` 加 `--under`，记号排在参数之后；带标签花括号加 `--labeled`，上方括号标签在记号前、下方括号标签在记号后；`\boxed` 加 `--boxed` 且不生成记号；`\overline` / `\underline` 的记号为 `.me-deriv__mark--rule`，用 CSS 横线随参数宽度拉伸）与 `.me-op > .me-op__top / __base`（上方记号槽 + 固定等号底座）与 `.me-arrow > .me-arrow__above / __sign / __below`（上方 / 下方标注槽按源码有无创建，箭头符号固定）容器（按节点类型使用 CSS grid / inline-flex 排版），容器内是 contenteditable `.me-text-slot`；`serializeEditor`/`serializeNodes` 递归还原 LaTeX（`\tfrac` 用 `.me-frac--small`，斜式输出 `{}^{...}\!/\!_{...}`，根式为 `\sqrt{...}` / `\sqrt[n]{...}`，积分为 `\int_{下}^{上}{被积函数}` 且被积函数花括号始终保留，大型运算符为 `\sum_{下}^{上}{表达式}`（行内式保留 `\nolimits`、`\limits` 被规整掉、表达式花括号始终保留），括号为 `\left...\right` / `\middle|`，堆栈为 `\begin{cases}...\end{cases}` / `\begin{matrix}...\end{matrix}`，函数为 `\sin{参数}`、反函数为 `\sin^{-1}{参数}`、带下标的对数 / 极限为 `\log_{底数}{参数}` / `\lim_{条件}{参数}`（下标与参数花括号始终保留，空槽为 `\log_{}{}`），导数为 `\命令{参数}`（参数花括号始终保留，避免后接文本被吞；带标签花括号为 `\overbrace{参数}^{标签}` / `\underbrace{参数}_{标签}`；带框公式为 `\boxed{参数}`；叠等号为 `\triangleq`（△ 未被改动）/ `\stackrel{\mathrm{记号}}{=}`（纯文本记号外包 `\mathrm{}` 保证预览直立，`\stackrel{abc}{=}` 归一为 `\stackrel{\mathrm{abc}}{=}`；空记号输出 `\stackrel{}{=}`；记号含命令时不包 `\mathrm`）；箭头标注为左 / 右箭头 `\xleftarrow[下]{上}` / `\xrightarrow{上}`（有下方槽才输出 `[...]`），其余底座为 `\overset{上}{底座}` / `\underset{下}{底座}` / `\overset{上}{\underset{下}{底座}}`，槽位存在与否以 DOM 为准（空上方槽仍输出 `\overset{}{底座}`）），后置上下标位于容器开头时补 `{}` 空基底）；`syncFromEditor` 同步 v-model、LaTeX 原文与预览。
- `lastSerialized` 用于跳过内部输入触发的重渲染，避免光标丢失；`lastFocusedSlot` 用于符号按钮失焦后的插入回退。
- 分子/分母支持普通文本与嵌套分式混排：`ensureDirectTextSlot` 用于在容器同级取/建文本槽，不进入嵌套分式；分子内在嵌套分式边界按 `←` / `→` 会创建同级文本槽（`2\frac{a}{b}` 这类混排可编辑）；点击分子/分母容器留白也走该函数。`getEdgeSlot` 只用于需要递归进入分式边缘的场景（点击公式本体、分子→分母等）。
- 键盘导航：`getActiveSlot` 通过槽位父容器判断 `num` / `den` / `sup` / `sub` / `rootIndex` / `radicand` / `integralSub` / `integralSup` / `integrand` / `bigopSub` / `bigopSup` / `bigopOperand` / `bracketContent` / `stackRow` / `funcSub` / `funcArg` / `derivArg` / `derivLabel` / `opTop` / `arrowAbove` / `arrowBelow` / `text`（`SLOT_ROLE_BY_CLASS` 类名表），`handleArrow` 按 `ARROW_NAV` 规则表（槽位角色 → 「键 + 可选条件 → 有序目标序列」，目标为 `slot` / `atom` / `sibling` / `bracketGroup` / `stackRow`）取首个可用目标，`moveSibling` 只负责跨同级节点。公式外部把每个分式 / 上下标 / 根式 / 积分 / 大型运算符 / 括号 / 堆栈 / 函数 / 导数 / 叠等号 / 箭头标注视为整体，`←` / `→` 跨过整座公式并落到相邻文本槽，不会进入内部；只有点击进入公式后，方向键才在内部元素间移动。进入后：分子末尾 `↓` / `→` 进入分母，分母开头 `↑` / `←` 回到分子；上标 `↓` 进下标、下标 `↑` 回上标；根指数 `↓` / 末尾 `→` 进被开方数、被开方数 `↑` / 开头 `←` 回根指数（无根指数时向左跳出整座根式）；积分下限 `↑` 到上限、上限 `↓` 回下限、限界 `↓` / 末尾 `→` 进被积函数、被积函数 `↑` / 开头 `←` 回最近的限界；大型运算符下限 `↑` 到上限、上限 `↓` 回下限、限界 `↓` / 末尾 `→` 进表达式、表达式 `↑` / 开头 `←` 回最近的限界；括号内容段 `←` / `→` 在相邻段间移动、`↑` / `↓` 跳出到括号左右；堆栈行 `↑` / `↓` 在行间移动、首行 `↑` / 末行 `↓` 跳出整座堆栈；函数与导数参数槽 `←` / `↑` 在开头跳出左侧、`→` / `↓` 在末尾跳出右侧，带下标的函数（log 底数 / lim、min、max 条件）下标末尾 `→` / `↓` 进入参数、参数 `↑` 或开头 `←` 回到下标末尾，带标签花括号的参数 / 标签槽按 `↑` / `↓` 互跳（上方括号参数 `↑` 进标签、标签 `↓` 回参数；下方括号参数末尾 `↓` 进标签、标签 `↑` 回参数）；叠等号记号槽 `←` / `↑` 在开头跳出左侧、`→` / `↓` 在末尾跳出右侧；箭头标注上方槽 `↓` 落到下方槽（双槽时）、下方槽 `↑` 回到上方槽末尾，其余边界键跳出整座节点；公式外侧边界跳出到紧邻的文本槽，因此 `\frac{a}{b}+c` 的 `+c` 位于分式外层。嵌套在槽位里的结构化节点按 `←` / `→` 先退到所在容器（`SLOT_CONTAINER_SELECTOR` 命中的参数槽 / 内容槽 / 行）的起点或终点文本槽，再按一次才离开外层节点，`\bar{\bar{x}}` 等嵌套结构逐层退出。
- `insertFraction` / `insertNodesAtCaret` 在当前文本槽内按光标切分并插入新节点，所以在分子/分母、上下标或根式内再次插入会形成嵌套结构，层级不设限。插入前若选区非折叠，先 `range.deleteContents()`，避免残留空文本槽。
- 空文本槽用零宽空格 `\u200b` 占位：`readSlotText` / `stripPlaceholder` 在序列化、首尾判断与空槽判定时过滤；槽位被删空后 `ensurePlaceholder` 自动补回并把光标放进文本节点；`onEditorFocusOut` 清理分子/分母中遗留的空槽，避免编辑区出现多余空白块。
- 分数浮层第一排为 `分数（竖式）\frac`、`分数（横式）a/b`、`分数（斜式）{}^{a}\!/\!_{b}`、`分数（小型分数）\tfrac`，不再提供连分式卡片；下方保留常用分数。
- `focusSlot` 必须把光标落到文本节点内部（`range.setStart(textNode, offset)`），落到 contenteditable 元素边界会导致方向键无法进入文字。
- 分式 / 上下标 / 根式 / 积分 / 大型运算符 / 括号 / 堆栈 / 函数 / 导数 / 叠等号不是 contenteditable，无法用默认退格删除：`handleDelete` 在 `Backspace`（分子 / 上标 / 下标 / 根指数开头，平方根为被开方数开头；积分任一限界开头，或无限界时被积函数开头；大型运算符任一限界开头，或无限界时表达式开头；括号首段开头；堆栈首行开头；函数 / 导数参数槽 / 标签槽开头，函数带下标时参数槽开头先回到下标；叠等号记号槽开头；箭头标注上方槽开头先落下方槽末尾（双槽时）、下方槽开头）/ `Delete`（分母 / 上标 / 下标 / 被开方数末尾；积分被积函数末尾；大型运算符表达式末尾；括号末段末尾；堆栈末行末尾；函数 / 导数参数槽 / 标签槽末尾，函数带下标时下标末尾先进入参数；叠等号记号槽末尾；箭头标注上方槽末尾、下方槽末尾先落上方槽开头（双槽时））以及文本槽与原子节点相邻的边界删除整个 `.me-frac` / `.me-script` / `.me-root` / `.me-int` / `.me-bigop` / `.me-bracket` / `.me-stack` / `.me-func` / `.me-deriv` / `.me-op` / `.me-arrow`；括号分隔符两侧与堆栈中间行边界的 `Backspace` / `Delete` 只在段 / 行间跳转；`removeAtomNode` 会先确保前后有文本槽可落光标，再移除节点并同步 LaTeX。结构化槽位的行为由 `DELETE_NAV` 规则表声明（槽位角色 → 「键 + 条件 → `remove` / `focus` / `focusOrRemove`」，目标复用方向键的 `NavTarget`）；文本槽自身的跨槽合并逻辑不走进表分支。
- 点击编辑区空白时用 `focusByPoint` 按 `clientX` 与子节点 `getBoundingClientRect()` 判断落点：分式左侧创建/进入前置文本槽，右侧创建/进入后置文本槽；点击 `.me-frac` 本体时聚焦分子，点击 `.me-root` 本体时聚焦被开方数，点击 `.me-int` 本体时聚焦被积函数，点击 `.me-bigop` 本体时聚焦表达式，点击 `.me-bracket` 时按横向位置聚焦对应内容段，点击 `.me-stack` 时按纵向位置聚焦最近一行，点击 `.me-func` 时聚焦参数槽，点击 `.me-deriv` 时聚焦参数槽（点击标签槽本身直接进入标签编辑），点击 `.me-op` 时聚焦记号槽，点击 `.me-arrow` 时聚焦上方 / 下方标注槽。
- 顶部工具栏共 12 个按钮：`符号`（Ω）、`分数`、上下标、根式、积分、大型运算符、括号、函数、导数符号、极限和对数、运算符、矩阵；分数、上下标、根式、积分、大型运算符、括号、函数、导数符号、极限和对数、运算符已绑定弹层，其余（符号 / 矩阵）暂未绑定行为。
- 分数按钮打开浮层：第一排 4 个格式（分数（竖式）`\frac{a}{b}`、分数（横式）`a/b`、分数（斜式）`{}^{a}\!/\!_{b}`、分数（小型分数）`\tfrac{a}{b}`），下方「常用分数」（`dy/dx`、`Δy/Δx`、`∂y/∂x`、`δy/δx`、`π/2`）；竖式、斜式、小型和常用分数插入结构化分式并选中分子，横式以文本模板插入。
- 上下标按钮打开浮层：第一排 4 个格式（上标 `x^{}`、下标 `x_{}`、上下标 `x_{}^{}`、前置上下标 `{}_{}^{}x`），下方「常用的下标和上标」（`x_{y^2}`、`e^{-iωt}`、`x^2`、`{}_{1}^{n}Y`）；格式卡片以 `x` 为基底插入结构化上下标并聚焦对应槽位，常用模板按解析结果插入并聚焦第一个上下标槽。
- 根式按钮打开浮层：第一排 4 个格式（平方根 `\sqrt{}`、n 次根 `\sqrt[n]{}`、二次根 `\sqrt[2]{}`、立方根 `\sqrt[3]{}`），下方「常用根式」（求根公式 `\frac{-b±\sqrt{b^{2}-4ac}}{2a}`、`\sqrt{a^{2}+b^{2}}`）；格式卡片插入结构化根式并聚焦根指数或被开方数，常用模板按解析结果插入并聚焦第一个可编辑槽。
- 积分按钮打开浮层：左右双栏共 18 种格式（左栏「积分」∫ / ∬ / ∭，右栏「围道积分」∮ / ∯ / ∰，每行 × 无限界 / 仅上限 / 上下限）+ 底部「微分」通栏 3 张纯文本卡（dx / dy / dθ），弹层加宽（`he-tool-popover--wide` 560px），外层 `__body` 统一包裹双栏与微分通栏；格式卡片插入结构化积分并聚焦下限（上下限）/ 上限（仅上限）/ 被积函数（无限界）。围道积分复用普通积分的 `me-int` 结构，仅积分号不同。积分号存 `dataset.sign`，序列化时按 `integralSignToCommand` 反查命令（`∭` → `\iiint`、`∯` → `\oiint`、其余 `\int` 等，与 `integralCommands` 同源）；输出 `\int_{下}^{上}{被积函数}`，被积函数花括号始终保留。微分卡片走 `pickDifferentialFormat` → `insertTextAtCaret` 按普通文本插入当前光标槽位（θ 用 Unicode，可编辑区不解析 `\theta`）。
- 大型运算符按钮打开浮层：五个板块共 40 张卡（求和 5 / 乘积和副积 10 / 并集和交集 10 / 其他大型运算符 10 / 常用模板 5），单栏、高度随弹窗 body 滚动；格式卡插入结构化 `.me-bigop` 并聚焦下限（上下限 / 仅下限）/ 上限（仅上限）/ 表达式（无限界），带上下标卡为 `\nolimits` 行内式；序列化 `\sum_{下}^{上}{表达式}`，表达式花括号始终保留，`\limits` 往返规整、`\nolimits` 保留；常用模板解析后插入并优先聚焦第一个空槽（组合数求和用括号内 `\tfrac` 近似）。
- 括号按钮打开浮层：五个板块共 41 张卡（12 种括号 / 4 种带分隔符 / 18 种单侧 / 4 种事例堆栈 / 3 个常用公式），单栏滚动；配对括号插入 `.me-bracket` 并聚焦首段内容，带分隔符按 `\middle|` 生成多段，单侧括号另一侧用 `.` 空定界符；事例堆栈插入 `.me-stack`（`cases` 带左侧花括号、`matrix` 无定界符）并聚焦首行，可外套配对括号；常用公式解析后插入并聚焦首个空槽或堆栈首行。
- 函数按钮打开浮层：五个板块共 27 张卡（三角函数 sin / cos / tan / csc / sec / cot；反函数 sin⁻¹ / cos⁻¹ / tan⁻¹ / csc⁻¹ / sec⁻¹ / cot⁻¹；双曲函数 sinh / cosh / tanh / csch / sech / coth；反双曲函数 sinh⁻¹ / cosh⁻¹ / tanh⁻¹ / csch⁻¹ / sech⁻¹ / coth⁻¹，各 6 张三列；常用函数 3 张两列：sin θ、cos 2x 与正切恒等式跨两列宽卡），单栏滚动（`__body--scroll`），卡片预览为直立函数名 + 虚线参数框，反函数 / 反双曲名带 `−1` 上标；点击插入 `.me-func`（`.me-func__name` 直立不可编辑 / `.me-func__sup` −1 上标 / `.me-func__arg` 可编辑参数槽）并聚焦参数槽。解析命令 `\sin` / `\cos` / `\tan` / `\csc` / `\sec` / `\cot`、反函数 `\sin^{-1}` 等、双曲 `\sinh` / `\cosh` / `\tanh` / `\csch` / `\sech` / `\coth` 与反双曲 `\sinh^{-1}` 等（反函数 / 反双曲命令在命令表中先于普通命令登记，避免被 `\sin` / `\sinh` 抢先拆解），`isCommandAt` 判断词边界避免 `\sinh` 被误判；参数槽 `←` / `↑` 开头跳出左侧、`→` / `↓` 末尾跳出右侧，开头 `Backspace` / 末尾 `Delete` 整块删除；序列化 `\sin{参数}` / `\sin^{-1}{参数}` / `\sinh{参数}` / `\sinh^{-1}{参数}`，参数花括号始终保留（空参数为 `\sin{}`）。常用函数为预填模板卡（`\sin{θ}`、`\cos{2x}`、`\tan{θ}=\frac{\sin{θ}}{\cos{θ}}`，θ 用 Unicode），解析后插入并聚焦首个可编辑槽。
- 极限和对数按钮打开浮层：两个板块共 8 张卡，单栏。「函数」6 张三列（带底数的对数 `\log_{}{}`、对数 `\log{}`、极限 `\lim_{}{}`、最小值 `\min_{}{}`、最大值 `\max_{}{}`、自然对数 `\ln{}`），「常用函数」2 张两列宽卡（重要极限 `\lim_{n→∞}{\left(1+\frac{1}{n}\right)^{n}}`、最大值 `\max_{0≤x≤1}{xe^{-x^{2}}}`）。复用 `.me-func` 节点：带下标的节点在名称与参数之间插入 `.me-func__sub` 槽并带 `--with-sub`，lim / min / max 另带 `--sub-under` 网格布局把名称与条件纵向堆叠、参数横跨右侧；log 底数在名称右下。点击插入时带下标的卡（log 底数 / lim / min / max）聚焦下标槽，log / ln 聚焦参数槽；常用模板解析后插入并聚焦参数槽。解析 `\log` / `\ln` / `\lim` / `\min` / `\max`，命令后可选 `_{...}` 再跟参数（`isCommandAt` 边界，`\ln{x}` 不会被误判为 `\lim`）；序列化 `\log_{底数}{参数}` / `\lim_{条件}{参数}`，下标与参数花括号始终保留（空槽为 `\log_{}{}`）。下标末尾 `→` / `↓` 进参数，参数 `↑` / 开头 `←` 回下标；下标开头 `Backspace`、参数末尾 `Delete` 整块删除，参数开头 `Backspace` / 下标末尾 `Delete` 先回另一槽位。
- 导数符号按钮打开浮层：四个板块共 27 张卡，单栏滚动（`__body--scroll`）。顶部四列网格 20 张重音符号卡，与 Word「导数符号」画廊一致（点 / 双点 / 三点、帽形 / 钩形、锐音符 / 钝音符、波浪线 / 短音符、横线 / 双横线、上 / 下花括号、带标记的上 / 下方括号 `\overbrace{2}^{1}` / `\underbrace{1}_{2}`、左 / 右 / 左右箭头、左 / 右鱼叉）；「带框公式」2 张（空框 `\boxed{}` 与预填勾股定理的跨两列宽带卡 `\boxed{a^{2}=b^{2}+c^{2}}`）；「顶线和底线」2 张（`\overline{}` / `\underline{}`）；「常用导数对象」3 张预填顶线卡（`\overline{A}` / `\overline{ABC}` / 跨两列宽带卡 `\overline{x⊕y}`，`⊕` 用 Unicode）。卡片预览为记号 + 虚线占位框（带标记花括号卡两个占位框，带框公式宽带卡为文本外一圈实线，顶线 / 底线为虚线框上方或下方一条实线，常用导数对象卡直接显示带顶线的对象文本 `.accent-preview__text`）。点击插入 `.me-deriv`（`.me-deriv__mark` 记号不可编辑 / `.me-deriv__arg` 可编辑参数槽 / `.me-deriv__label` 带标记花括号的可编辑标签槽；上方记号排在参数前，`\underbrace` / `\underline` 加 `--under` 并把记号排在参数后，带标记花括号加 `--labeled`，带框公式加 `--boxed` 且没有记号）并聚焦参数槽；普通双横线卡插入 `\bar{\bar{}}` 两层嵌套，宽带框公式卡与常用导数对象卡插入预填内容并把光标放到参数末尾；解析 20 条命令（`isCommandAt` 词边界与最长优先，`\overleftrightarrow`、`\dots` / `\hats`、`\underline` / `\underbrace` 均不被误判），`\hat x` 单字符参数往返为 `\hat{x}`，`\overbrace{x}^{1}` / `\underbrace{x}_{1}` 的标记收进标签槽；序列化 `\命令{参数}`，参数花括号始终保留（空参数为 `\命令{}`），带标记花括号为 `\overbrace{参数}^{标签}` / `\underbrace{参数}_{标签}`，带框公式为 `\boxed{参数}`；参数 / 标签槽 `←` / `↑` 开头跳出左侧、`→` / `↓` 末尾跳出右侧（带标签花括号按上下键互跳），开头 `Backspace` / 末尾 `Delete` 整块删除。
- 运算符按钮打开浮层：单栏双板块共 19 张卡，主体滚动（`__body--scroll`）。第一板块「基本运算符」四列网格 7 张卡（第一行 `:=`、`==`、`+=`、`−=`（Unicode 减号 U+2212）4 张纯文本卡；第二行 def / m / △ 上置叠等号 3 张结构化卡，预览为 `.op-stack` 纵向堆叠）。前 4 张走 `pickOperatorFormat` → `insertTextAtCaret` 插入符号字面量；后 3 张没有可用 Unicode，由 `insertOp` 插入结构化叠等号节点 `.me-op[data-op]`（`createOpElement`）：上方记号是 contenteditable 槽位（预填 def / m / △，插入后 `focusOpSlot` 聚焦记号槽），底座等号固定不可编辑（`aria-hidden`）。序列化：△ 未被改动时保持 `\triangleq` 缩写（△ 被改写后降级 `\stackrel{\mathrm{x}}{=}`，渲染不变），空记号输出 `\stackrel{}{=}`，纯文本记号外包 `\mathrm{}` 保证 MathJax 预览直立（`\stackrel{abc}{=}` 归一为 `\stackrel{\mathrm{abc}}{=}`），记号含命令（嵌套结构）时不包 `\mathrm`；解析仅识别等号底座的 `\stackrel{top}{=}`（记号外层 `\mathrm` 被剥掉，槽内只显示内部文本），非等号底座按原文保留。第二板块「运算符结构」四列网格 12 张卡（第一行 ← / → 下方标注与上方标注，第二行 ⇐ / ⇒ 下方标注与上方标注，第三行 ↔ 下方与上方、⇔ 下方与上方；预览为 `.arrow-preview` 虚线空标注框 + 箭头）。`pickArrowFormat` → `insertArrow` 插入结构化箭头节点 `.me-arrow[data-arrow]`（`createArrowElement`）：按卡片位置创建上方或下方一个空标注槽（插入后 `focusArrowSlot` 聚焦），箭头符号固定不可编辑。序列化：左 / 右箭头走 amsmath `\xleftarrow[下]{上}` / `\xrightarrow{上}`（本地 MathJax 原生支持可拉伸箭头），双线箭头（`\Leftarrow` / `\Rightarrow`）与左右箭头（`\leftrightarrow` / `\Leftrightarrow`）底座不可伸展且 extpfeil 宏（`\xLeftarrow` 等）离线不可用，用 `\overset{上}{底座}` / `\underset{下}{底座}` / `\overset{上}{\underset{下}{底座}}` 组合，槽位存在与否以 DOM 为准（空上方槽仍输出 `\overset{}{底座}`）；解析 `\xleftarrow` / `\xrightarrow`（可选 `[...]` 下方组）与已知底座的 `\overset` / `\underset` 组合（含双槽嵌套，`\underset` 内层归一为 `\overset` 外层），其余 `\overset{a}{b}` 按原文保留。
- 工具栏目录数据与类型已抽离到 `packages/editor/src/components/toolbar/catalog/`（`types.ts` + 按模块拆分的卡片数组 / 预览构建函数 + `index.ts` barrel），新增或调整卡片只改 catalog，不进入 SFC；SFC 现在只保留状态与交互逻辑（解析 / 渲染 / 序列化见下一条）。
- 解析 / 渲染 / 序列化已拆到 `packages/editor/src/components/formula/`：`parseLatex` 返回 `ParsedNode`；`createFormulaRenderer(t)` 返回 `create*Element` / `appendNodes` / `renderInto`（工厂注入 `t`，语言切换后新节点自动使用当前语言）；`serializeNodes` 与解析互逆；`dom.ts` 汇总槽位文本读取与括号段 / 堆栈行查询，交互逻辑复用同一份工具。
- 全部弹层卡片统一由 `toolbar/ToolCard.vue` 渲染（`title` + `html` / `text` + `tall` / `wide` / `span2` / `mathFont`），卡片结构、交互（`mousedown.prevent` + `pick`）与 `.he-tool-card*` 样式（含各预览族的 `:deep()`）只在该组件维护；SFC 只负责遍历 catalog 数组并绑定 `@pick`。
- 可编辑区导航有两个声明式表：`EDGE_PARTS`（原子类名 → 起点 / 终点 `EdgeQuery`）驱动 `getEdgeSlot`，`ARROW_NAV` / `DELETE_NAV` 驱动 `handleArrow` / `handleDelete`；`SLOT_ROLE_BY_CLASS` 同时反查出 `SLOT_CONTAINER_SELECTOR` 与 `ATOM_SELECTOR`（`getSlotRole` / `isAtomElement`），新增槽位只需补表项，不再散落 `if` 分支。
- 弹层开关只有一个状态 `activeTool: ToolId | null`：`popoverToolIds` 标记已接入弹层的工具，`onToolClick` 对同一按钮再次点击即关闭、点击其他工具即切换，非弹层工具（符号 / 矩阵）只关闭已打开弹层；`onDocumentClick` 在点击工具栏外时关闭；各 `pickXxx` 插入后置空。
- `#/input` 直接渲染 `HeFormulaEditor`；`HeMdEditor` 通过 `HeFormulaDialog` 使用同一个 UI。
- 输入模型是 LaTeX 文本；`*` / `-` / `/` 映射为 `×` / `−` / `÷`；MathJax 已确认可直接排版这些 Unicode 字符。
- `HeMathInput`（MathLive）仅保留在 EditorPage 的内嵌示例中，不再用于公式弹窗。
- 当前限制：`\frac` / `\tfrac` / 斜式 `{}^{a}\!/\!_{b}` / 上下标 `^`、`_` / 根式 `\sqrt` / 积分 `\int`、`\iint`、`\iiint` 与围道 `\oint`、`\oiint`、`\oiiint` / 大型运算符 `\sum`、`\prod`、`\coprod`、`\bigcup`、`\bigcap`、`\bigvee`、`\bigwedge` / 括号 `\left...\right` / 堆栈 `\begin{cases}`、`\begin{matrix}` / 三角函数 `\sin`、`\cos`、`\tan`、`\csc`、`\sec`、`\cot` / 反函数 `\sin^{-1}` 等 / 双曲函数 `\sinh`、`\cosh`、`\tanh`、`\csch`、`\sech`、`\coth` / 反双曲函数 `\sinh^{-1}` 等 / 对数与极限 `\log`、`\ln`、`\lim`、`\min`、`\max`（可选 `_{...}` 下标）/ 导数符号 `\dot`、`\ddot`、`\dddot`、`\hat`、`\check`、`\acute`、`\grave`、`\tilde`、`\breve`、`\bar`、`\overbrace`、`\underbrace`（含带标签的 `\overbrace{...}^{...}` / `\underbrace{...}_{...}`）、`\overline`、`\underline`、`\boxed`、`\overleftarrow`、`\overrightarrow`、`\overleftrightarrow`、`\overleftharpoon`、`\overrightharpoon` 与双层横线 `\bar{\bar{...}}` 已结构化；上置叠等号 `\stackrel{top}{=}`（仅等号底座，非等号底座按原文保留）与 `\triangleq` 已结构化；箭头标注 `\xleftarrow`、`\xrightarrow`（含 `[...]` 下方）与 `\overset` / `\underset` 包裹 `\Leftarrow`、`\Rightarrow`、`\leftrightarrow`、`\Leftrightarrow` 的组合已结构化（`\xLeftarrow` 等 extpfeil 宏离线不可用，非已知底座的 `\overset{a}{b}` 按原文保留）；`\cfrac` / `\dfrac` 和其他未支持的 LaTeX 命令在可编辑区仍显示为文本，实时预览会正确渲染。因此常用模板里避免使用 `\pm`、`\partial` 这类未解析命令（求根公式直接用 `±`，偏导模板直接用 `∂`）。

### 5.9 国际化

- 使用 vue-i18n（Composition API 模式）；库默认导出 Vue 插件，`app.use(HeMathEditor)` 自动安装 i18n（demo 的 `main.ts` 先 `installDemoMessages()` 再整体安装）。
- 库 i18n（`packages/editor/src/i18n`）与 demo 文案（`apps/demo/src/i18n`）分开维护：demo 启动时 `mergeLocaleMessage` 把导航/页面文案合并进库实例。
- `DEFAULT_LOCALE` 为默认语言；用户切换结果写入 `localStorage` 的 `hemath-editor:locale`，并同步 `<html lang>`。
- 顶部导航右侧的 `EN` / `中文` 按钮调用 `setLocale` 切换；`App.vue` 的导航、页面标题、浏览器标题全部来自 `t()`。
- 组件内使用 `useI18n()`：模板用 `t('key')`；`HeMdEditor` 的 `tools` 是 computed，保证语言切换后按钮标题/占位文字同步更新。
- `HeFormulaEditor` 的分式卡片只显示图形，名称放在 `title` 悬浮提示中；toolbar 的 key 使用 camelCase id（`largeOperator` / `limitLog`），与消息包一一对应。
- 槽位在运行时命令式创建，`aria-label` 通过 `watch(locale)` 统一刷新，避免语言切换后残留旧文案。
- 新增文案必须同时写入 zh-CN 与 en-US（库文案 → `packages/editor/src/i18n/locales`，demo 文案 → `apps/demo/src/i18n/locales`）；新增语言需扩展 `SUPPORTED_LOCALES` / `isAppLocale` 并调整导航语言控件。

## 6. 常见改动路径

| 需求 | 修改位置 |
| --- | --- |
| 新增 Markdown 工具栏按钮 | `packages/editor/src/editor/mdCommands.ts` 加命令；`HeMdEditor.vue` 的 `tools` 数组注册 |
| 新增公式常用符号 | `packages/editor/src/components/toolbar/catalog/tools.ts` 的 `symbols`；演示页 `EditorPage.vue` 的 MathLive 符号可选同步 |
| 修改公式分隔符/识别规则 | `packages/editor/src/core/formula/parser.ts`（唯一定义）+ `packages/editor/src/core/renderer/index.ts`（token 输出）+ `mathjax.ts`（分隔符配置）+ README.md / README.zh-CN.md |
| 新增代码高亮语言 | `packages/editor/src/core/renderer/index.ts` 导入并 `registerLanguage`；必要时在 `markdown-body.scss` 补充 token 样式 |
| 调整自研输入 / 键盘映射 | `packages/editor/src/components/toolbar/catalog/tools.ts` 的 `symbolMap` 与 `HeFormulaEditor.vue` 的 `onKeydown` |
| 调整弹窗容器 / 按钮 | `packages/editor/src/components/HeFormulaDialog.vue` |
| 调整数学字体 / 字符回退 | `packages/editor/src/styles/math-font.scss` 的 `@font-face` 与 `unicode-range` |
| 调整分数格式弹窗 | `packages/editor/src/components/toolbar/catalog/fraction.ts` 的 `fractionFormats` / `commonFractions` |
| 新增 / 调整工具栏弹层卡片 | `packages/editor/src/components/toolbar/catalog/<module>.ts`（卡片数组 + 预览构建，按模块拆分）；卡片外观 / 变体改 `toolbar/ToolCard.vue`，交互逻辑仍在 `HeFormulaEditor.vue` |
| 调整方向键 / 退格删除规则 | `HeFormulaEditor.vue` 的 `ARROW_NAV` / `DELETE_NAV`（键 + 条件 → 目标 / 动作）；新增槽位先补 `SLOT_ROLE_BY_CLASS` 与 `EDGE_PARTS` |
| 调整可编辑公式解析/序列化 | `packages/editor/src/components/formula/parser.ts` 的 `parseLatex` 与 `formula/serializer.ts` 的 `serializeNodes` |
| 调整结构化节点 DOM / 槽位类名 | `packages/editor/src/components/formula/renderer.ts`（`create*Element`）+ `formula/dom.ts`（槽位文本与容器查询）；交互仍在 `HeFormulaEditor.vue` |
| 新增/导出组件 | `packages/editor/src/components/` 加组件 + `packages/editor/src/index.ts` 导出 |
| 调整公式标签样式 | `HeMdEditor.vue` 中 `:deep(.he-formula-atom*)` |
| 调整 Markdown 排版 | `packages/editor/src/styles/markdown-body.scss`（编辑器预览与只读展示共用） |
| 调整只读展示容器 | `HeMdViewer.vue` 的 scoped 样式 |
| 新增 MathJax 宏/配置 | `packages/editor/src/utils/mathjax.ts` 的 `window.MathJax` 配置 |
| 更换 MathJax 版本 | 替换 `packages/editor/public/mathjax/tex-svg.js`，核对是否为完整构建 |
| 新增 npm 子路径入口 | `packages/editor/src/<xxx>.ts` 入口 + `vite.lib.config.ts` 的 `lib.entry` + `package.json` 的 `exports` |
| 新增演示页 | `apps/demo/src/pages/XxxPage.vue`，并在 `apps/demo/src/App.vue` 的 `pages`、`navItems`、`pageTitles` 注册 |
| 修改演示页公共样式 | `apps/demo/src/styles/demo.scss` |
| 修改 hash 路由 | `apps/demo/src/App.vue` 的 `parseRoute` / `applyRoute` |
| 新增/修改界面文案 | 按归属在库或 demo 的 locales 中同步加 key，组件内用 `t()`；不要在模板硬编码中文 |
| 新增语言 | 新增消息包 + 库 `i18n/index.ts` 的 `SUPPORTED_LOCALES` / `isAppLocale` + 导航语言控件 |
| 改端口/别名 | `apps/demo/vite.config.ts` |
| 调整库构建（external / 入口 / 样式产物） | `packages/editor/vite.lib.config.ts` |

## 7. 验证方式

单元测试（jsdom 环境，不依赖浏览器与 MathJax，`HeMathPreview` 以 stub 隔离）：

```bash
pnpm test         # = pnpm --filter he-math-editor test（vitest run）
```

注意：jsdom 中 contenteditable 元素的 `focus()` 不会更新 `document.activeElement`，测试断言基于 `window.getSelection()` 光标落点，键盘事件从光标所在槽位直接派发；`createTextSlot` 必须用 `setAttribute('contenteditable', 'true')` 而不是 `contentEditable` property（jsdom 不做 property → attribute 反射，`[contenteditable]` 选择器会失效）。

最低手工验证标准：

```bash
pnpm build        # 库构建 + demo 构建（demo 构建含 vue-tsc --noEmit 类型检查）
pnpm build:lib    # 仅库构建 → packages/editor/dist-lib
pnpm dev          # http://localhost:3100 手工验证
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
35. 点击根式按钮打开浮层：第一排 4 张格式卡片（平方根 / n 次根 / 二次根 / 立方根），第二排为「常用根式」2 张宽卡片（求根公式、√(a²+b²)）；点击卡片关闭浮层并插入结构化根式。
36. 插入平方根后原文为 `\sqrt{}` 并聚焦被开方数；插入 n 次根后原文为 `\sqrt{}`、编辑区出现根指数空槽，输入 `3` 后原文为 `\sqrt[3]{}`，`↓` 进入被开方数输入 `8` 后为 `\sqrt[3]{8}`。
37. 插入立方根后根指数 `3` 预填并选中，直接输入 `5` 可替换为 `\sqrt[5]{}`；被开方数末尾按 `Delete` 或根指数开头按 `Backspace` 能整块删除根式。
38. 在 LaTeX 源码框输入 `\sqrt{\sqrt{x}}+\frac{\sqrt{2}}{2}`，可编辑区正确渲染嵌套根式与根式分式；在根式外部按 `←` / `→` 会跨过整座根式，`↓` / `↑` 从被开方数跳出后不会误入根式内部。
39. LaTeX 原文是可编辑 textarea：在源码框直接输入/修改 `\frac{a}{b}+c`，下方编辑区实时重建为对应结构；反向在编辑区修改后源码框内容同步更新，两个方向都不会出现光标跳动或死循环。
40. `pnpm build:lib` 产出 `packages/editor/dist-lib`：`index.js`、`full.js`、`full.d.ts`、`style.css`、`mathjax/tex-svg.js` 齐全；宿主通过 `he-math-editor` / `he-math-editor/full` / `he-math-editor/style.css` 三个入口可正常引入。
41. 点击积分按钮打开浮层：左右双栏共 18 张格式卡（左栏 ∫ / ∬ / ∭，右栏围道 ∮ / ∯ / ∰，每行 × 无限界 / 仅上限 / 上下限）+ 底部「微分」通栏 3 张卡（dx / dy / dθ）；插入定积分后原文为 `\int_{}^{ }{}` 且聚焦下限，输入下限后 `↑` 到上限、`↓` 回下限、再 `↓` 进被积函数；输入后被积函数带花括号序列化（如 `\int_{0}^{1}{f(x)}`）。
42. 在 LaTeX 源码框输入 `\int\limits_{a}^{b}{x^{2}}dx` 与 `\iiint_{0}^{1}{x}+\iint^{2}{y}`，可编辑区正确渲染（`\limits` 被跳过、∭ 有下限、∬ 仅上限、尾部 `dx` 独立文本槽）；限界 / 被积函数内可嵌套分式与上下标（如 `\int_{0}^{1}{\frac{x}{2}}dx`）。
43. 积分整块删除：被积函数末尾 `Delete`、限界开头 `Backspace` 或相邻文本槽边界 `Backspace` / `Delete` 能删除整座积分；被积函数开头 `Backspace` 仅在积分无限界时整块删除。
44. 点击右栏「围道积分」卡片：`\oint` / `\oiint` / `\oiiint` 分别插入 `∮{}` / `∯_{}^{ }{}` / `∰{}` 并聚焦对应槽位；源码框输入 `\oint_{C}{f(z)dz}` 正确解析与往返，`\oiint` 不会被 `\oint` 前缀误匹配（最长优先）；围道积分的限界互跳、整块删除与普通积分一致。
45. 点击底部「微分」栏的 dx / dy / dθ 卡片：浮层关闭，光标所在槽位按普通文本插入对应内容；插入不定积分聚焦被积函数后再打开浮层点 dx，原文为 `\int{dx}`。
46. 点击括号按钮打开浮层：五个分区共 41 张卡（12 种括号 + 4 种带分隔符 + 18 种单侧 + 4 种事例堆栈 + 3 个常用公式）；点「花括号两行事例」插入 `\begin{cases}\\\end{cases}` 且光标在第一行，`↓` 到第二行、`↑` 回第一行，第一行开头 `Backspace` 整块删除。
47. 源码框输入 `\begin{cases}a\\\\b\\\\c\end{cases}` 与 `\left(\begin{matrix}n\\\\k\end{matrix}\right)`，可编辑区分别渲染 3 行 / 2 行堆栈且外层圆括号完整，往返序列化与输入一致；行内嵌套 `a^{2}` 不会被 `\\` 误切。
48. 点击「常用方括号」的分段函数卡片：原文为 `f(x)=\begin{cases}-x, x<0\\\\x, x≥0\end{cases}`；圆括号 / 尖括号组合数分别插入 `\left(\begin{matrix}n\\\\k\end{matrix}\right)` 与 `\left\langle\begin{matrix}n\\\\k\end{matrix}\right\rangle`，且左侧花括号 / 圆括号 / 尖括号在 MathJax 预览中随两行高度拉伸。
49. 点击大型运算符按钮打开浮层：五个板块共 40 张卡（求和 5 / 乘积和副积 10 / 并集和交集 10 / 其他 10 / 常用 5）；插入带上下限求和原文为 `\sum_{}^{}{}` 且聚焦下限，`↑` 到上限、`↓` 回下限、再 `↓` 进表达式；带上下标卡原文为 `\sum\nolimits_{}^{}{}`。
50. 源码框输入 `\sum_{i=1}^{n}{a_i}`、`\prod\nolimits_{k=1}^{n}{A_k}`、`\bigcup_{i=1}^{m}{(X_i∩Y_n)}`、`\bigvee_{0}^{n}{x}`，可编辑区分别渲染堆叠式 / 行内式；`\limits` 往返被规整、`\nolimits` 保留，表达式花括号始终保留（`\sum x` 序列化为 `\sum{x}`）。
51. 大型运算符整块删除：限界开头 `Backspace`、表达式末尾 `Delete`、无限界时表达式开头 `Backspace` 均可删除；有界表达式开头 `Backspace` 不删除（保留限界入口）；同一公式中的多个大型运算符互不干扰。
52. 点击 5 张「常用大型运算符」：组合数求和原文为 `\sum_{k}{(\tfrac{n}{k})}`、上下限求和聚焦空表达式、多条件求和下限为单行文本、乘积 / 并集模板与源码往返一致。
53. 点击函数按钮打开浮层：三角函数板块 6 张卡（sin / cos / tan / csc / sec / cot），卡片预览为直立函数名 + 虚线参数框；点 sin 插入 `\sin{}` 且光标在参数槽，输入 `x` 后原文为 `\sin{x}`。
54. 源码框输入 `a\sin{x}+1`，可编辑区正确渲染函数节点；参数末尾 `→` / 开头 `←` 跳出到相邻文本槽，参数开头 `Backspace` 或末尾 `Delete` 整块删除；`\sinh{x}` 不被误判为 `\sin`。
55. 函数弹层含「反函数」「双曲函数」板块各 6 张卡：点 sin⁻¹ 插入 `\sin^{-1}{}` 且光标在参数槽，输入 `x` 后原文为 `\sin^{-1}{x}`；编辑区函数名显示 `sin−1` 上标且不可编辑；点 sinh 插入 `\sinh{}`。
56. 源码框输入 `\sin^{-1}{x}` 与 `\coth{x}`，可编辑区分别渲染反函数（参数槽为 `x`，不是 `-1`）与双曲余切节点；`\sech{}+1` 往返不变；`\sinc{x}` 等未知命令保持文本。
57. 函数弹层含「反双曲函数」板块 6 张卡：点 sinh⁻¹ 插入 `\sinh^{-1}{}` 且光标在参数槽，输入 `x` 后原文为 `\sinh^{-1}{x}`；源码框输入 `\sinh^{-1}{x}` 不会被 `\sinh` 抢先拆解（参数槽为 `x`，不是 `^{-1}`），`\sin^{-1}{x}+\sinh^{-1}{x}` 混排往返不变。
58. 函数弹层「常用函数」板块：点 sin θ / cos 2x 分别插入 `\sin{θ}` / `\cos{2x}`；点正切恒等式宽卡插入 `\tan{θ}=\frac{\sin{θ}}{\cos{θ}}`，可编辑区渲染分式（分子 `\sin{θ}`、分母 `\cos{θ}`）且光标落在首个参数槽，预填内容可继续编辑。
59. 导数符号弹层共 27 张卡（四板块：20 张重音符号与 Word「导数符号」画廊一致 + 2 张带框公式 + 2 张顶线 / 底线 + 3 张常用导数对象）：点 ˙ 插入 `\dot{}` 且光标在参数槽，输入 `x` 后原文为 `\dot{x}`；记号不可编辑；下花括号 / 下方括号 / 底线的记号显示在参数下方。
60. 源码框输入 `\dot{x}`、`\hat{a}`、`\bar{\bar{x}}`、`\underbrace{y}`、`\overrightarrow{AB}`、`\ddot{\frac{a}{b}}`、`\sin{\dot{x}}`，可编辑区渲染重音节点且往返不变；`\dots`、`\hats` 保持文本；`\dot{}+1` 原文不变；`\hat x` 往返为 `\hat{x}`。
61. 导数弹层双横线卡插入 `\bar{\bar{}}`（两层嵌套，光标落在最内层参数槽）；卡片预览为记号 + 虚线占位框，带标记花括号卡显示两个占位框。
62. 导数弹层「带框公式」板块：点空框插入 `\boxed{}` 且节点没有记号元素；点宽带卡插入 `\boxed{a^{2}=b^{2}+c^{2}}`（三个上标结构）且光标在参数末尾；源码框输入 `\boxed{x+1}`、`\boxed{}+1` 往返不变。「顶线和底线」：点顶线 / 底线插入 `\overline{}` / `\underline{}`，记号元素带 `me-deriv__mark--rule` 与对应方向类，底线节点带 `--under`；`\underline{x}` 不被误判为 `\underbrace`，`\overline{\frac{a}{b}}` 内嵌分式往返不变。
63. 嵌套结构方向键逐层退出：源码框输入 `\bar{\bar{x}}`、`\sin{\sin{x}}`、`\left(\left[x\right]\right)`，光标落在内层参数 / 内容槽末尾按 `→`（或开头按 `←`）时，先停在外层容器的起点 / 终点文本槽，再按一次才离开外层节点；导航后源码框仍为原 LaTeX（空文本槽序列化为空）。
64. 导数弹层「常用导数对象」板块：点 A / ABC 卡分别插入 `\overline{A}` / `\overline{ABC}`，点 `x⊕y` 宽带卡插入 `\overline{x⊕y}`（⊕ 为 Unicode），三张卡光标都落在参数末尾且预填内容可继续编辑；卡片预览直接显示带横线的对象而非虚线占位框，宽带卡横跨两列。
65. 极限和对数弹层共 8 张卡（6 张基础卡 + 2 张常用函数宽卡）：点带底数的对数插入 `\log_{}{}` 且光标在下标槽，输入 `2` 后原文为 `\log_{2}{}`；点 lim / min / max 插入 `\lim_{}{}` 等且名称与下标纵向堆叠（节点带 `me-func--sub-under`）；点 log / ln 插入 `\log{}` / `\ln{}` 且光标在参数槽。
66. 极限和对数源码往返：输入 `\log_{2}{x}`、`\log{x}`、`\ln{x}`、`\lim_{n→∞}{a+b}`、`\min_{x>0}{f(x)}`、`\max_{0≤x≤1}{x}`、`\log_{}{}+1`、`\frac{\log_{2}{x}}{\ln{y}}`、`\log_{2}{\lim_{n→∞}{x}}` 均渲染对应函数节点且往返不变；`\lim_{n→∞}{x}` 不被 `\ln` 抢先匹配。
67. 极限和对数下标导航：光标在 `\log_{2}{x}` 下标末尾按 `→`、`\lim_{x→0}{x}` 下标末尾按 `↓` 进入参数槽；参数开头按 `←` / `↑` 回下标；下标开头 `←` 跳出到左侧文本，参数末尾 `→` 跳出到右侧文本。
68. 极限和对数分级删除：`\log_{2}{x}` 下标开头 `Backspace` 与 `\lim_{x→0}{x}` 参数末尾 `Delete` 整块删除；参数开头 `Backspace`、下标末尾 `Delete` 只回到另一槽位；点常用函数宽卡插入 `\lim_{n→∞}{\left(1+\frac{1}{n}\right)^{n}}` / `\max_{0≤x≤1}{xe^{-x^{2}}}` 且光标在参数槽。
69. 运算符弹层第一板块「基本运算符」7 张卡：点 `:=` / `==` / `+=` / `−=` 插入符号字面量（`−=` 为 Unicode 减号）；点 def / m / △ 上置叠等号卡插入结构化 `.me-op` 节点（记号槽预填 def / m / △、等号底座固定），光标落在记号槽，源码为 `\stackrel{\mathrm{def}}{=}` / `\stackrel{\mathrm{m}}{=}` / `\triangleq`；输入 `\stackrel{abc}{=}` 归一为 `\stackrel{\mathrm{abc}}{=}`，`\stackrel{}{=}` 往返不变，非等号底座 `\stackrel{a}{b}` 按原文保留；记号槽边界 `←` / `→` 跳出、开头 `Backspace` / 末尾 `Delete` 整块删除，△ 改写后降级 `\stackrel{\mathrm{x}}{=}` 且渲染不变；点击卡片后弹层关闭；与极限和对数弹层互斥、点击工具栏外部关闭。
70. 运算符弹层共 19 张卡：第二板块「运算符结构」12 张卡分三行（← / → 下方与上方标注、⇐ / ⇒ 下方与上方标注、↔ 下方与上方、⇔ 下方与上方），预览为虚线空标注框 + 箭头；点击插入 `.me-arrow` 节点（上方或下方空标注槽 + 固定箭头符号），光标落入标注槽，源码为 `\xleftarrow[]{}` / `\xrightarrow{}` / `\underset{}{\Leftarrow}` / `\overset{}{\Leftrightarrow}` 等；输入 `\xrightarrow[x]{abc}`、`\overset{a}{\underset{b}{\leftrightarrow}}` 渲染双槽节点且往返一致（`\underset` 内层归一为 `\overset` 外层），`\overset{a}{b}` 非已知底座按原文保留；上方槽 `↓` 与下方槽 `↑` 互跳、边界键跳出节点；单槽边界 `Backspace` / `Delete` 整块删除，双槽按上方 → 下方 / 下方 → 上方分级退格；点击箭头符号聚焦标注槽。

## 8. 提交与版本规则（强制）

- **每次提交代码前，必须更新 [CHANGELOG.md](CHANGELOG.md) 的 `[未发布]` 区块**，写明新增 / 修复 / 变更 / 移除 / 文档 / 工程。
- 工具栏按钮、分数格式、符号面板或可编辑区交互有变化时，必须同步更新 [TOOLBAR.md](TOOLBAR.md) 的支持矩阵和更新记录（新增一行「日期 + 支持项」）。
- 分支策略：文档/小 bug 可直接提交 `master`；新功能、重构、跨文件或交互改动走 `feat/*`；发版走 `release/x.y.z`，紧急修复走 `hotfix/*`。合并前至少运行 `pnpm build`（含 vue-tsc 类型检查）；本仓库推荐本地 `git merge --no-ff` 后一次 `git push` 同步 Gitee 与 GitHub。
- 提交信息沿用现有风格：`feat: ...`、`fix: ...`、`docs: ...`、`init: ...`。
- 发版时：把 `[未发布]` 归档为 `x.y.z - YYYY-MM-DD`，并同步 `packages/editor/package.json` 的 `version`。
- 只改文档也必须写 CHANGELOG。
- 未经用户明确要求，不要自动 `git commit` 或 `git push`。

## 9. 易错点

- 用 npm / yarn 安装：本仓库是 pnpm workspace（`packageManager` 固定 pnpm@12.15.0），必须 `pnpm install`，`package-lock.json` 已移除。
- 库内部用 `@` 别名导入：库源码一律相对导入；`@` 只在 demo（→ `apps/demo/src`）和库构建配置内存在。
- demo 直接 `pnpm add mathlive` 等库依赖：库依赖加在 `packages/editor/package.json`；demo 只放自身依赖（vue、workspace 库）。
- 修改 `packages/editor/public/mathjax/tex-svg.js` 后只跑 demo 不重跑 `pnpm build:lib`：`full` 入口的离线资产是构建期从该文件 emit 的，需要重新构建库产物。
- 把 MathJax 配置写到脚本 `onload` 之后：无效，必须先配置再加载；`configure({ source })` 必须在首次渲染前调用。
- 宿主已自行加载 MathJax 时按加载失败处理：服务会检测 `window.MathJax.typesetPromise` 直接复用宿主实例。
- 在 MathJax 中启用 `$` 分隔符：正文普通美元符号会被误配对。
- 修改公式语法只改了 `core/formula/parser.ts`，却漏改 `core/renderer` 的 token 输出：编辑器与预览表现不一致。
- 跨行公式使用非 block 装饰：CodeMirror 抛错或渲染异常。
- 用 `ViewPlugin` 提供跨行公式的块级装饰：CodeMirror 报 `Block decorations may not be specified via plugins`，必须改用 `StateField`。
- 点击公式时未 `preventDefault`：光标落入替换装饰范围，交互异常。
- 删除 `isCustomElement` 配置：Vue 编译器把 `<math-field>` 当普通组件处理而报错（demo 与库构建配置都要保留）。
- 新增页面只建了 SFC，未注册到 `apps/demo/src/App.vue` 的 `pages` / `navItems`：导航无法访问。
- 在模板或 TS 中硬编码界面文案：切换语言后不会更新；必须使用 `t()` 并同时补中英文消息包（库文案、demo 文案按归属各补各的）。
- 只在 zh-CN 加 key 而漏掉 en-US：英文界面会回退到中文或显示 key。
- 命令式创建的 DOM（如 `HeFormulaEditor` 的槽位）不处理语言切换：`aria-label` 会残留旧语言，需要在 `watch(locale)` 中刷新。
- KeepAlive 页面里的 Teleport 弹窗未在 `onDeactivated` 关闭：切换页面后弹窗会残留在其他页面。
- 分数浮层过高：在 `HeFormulaDialog` 的 `overflow-y` body 中底部会被裁切；卡片保持 68px、间距紧凑。
- 每次 input 后用 Vue 响应式重渲染可编辑区：光标会丢失；当前使用命令式 DOM + `lastSerialized` 跳过自身更新。
- `.he-formula-editable` 是 flex 容器而 `.me-text-slot` 是 `white-space: pre` 的 flex 项：漏写 `flex: 0 0 auto` / `flex-shrink: 0` 时，内容超宽会把文本槽压缩，溢出的文字直接画到相邻节点上（长串数字压住 `\max` 等节点，表现为「超过一行后错位」）；超宽应由容器 `overflow-x: auto` 滚动处理。
- LaTeX 源码 textarea 与编辑区双向同步依赖 `lastSerialized` 比对：源码输入路径必须走 `watch(modelValue)` + `renderEditor`，不能直接改 DOM，否则会出现回写循环。
- `parseLatex` 递归解析 `\frac` / `\tfrac` / 斜式 / 上下标 / 根式：分子、分母、上下标、根指数与被开方数里的内容继续结构化；斜式通过 `{}^{...}\!/\!_{...}` 识别（忽略空白与 `\!`），前置上下标通过 `{}^{...}` / `{}_{...}` 独占识别且不消费后面的基底，根式通过 `\sqrt` + 可选 `[n]` + 参数识别；`\cfrac`、`\dfrac` 等未支持的命令按文本保留，避免错误拆分。
- 上下标空内容用空数组 `[]` 表示存在该槽位（`[]` 为真值），`null` 表示该方向不存在；序列化后置上下标位于容器开头时必须补 `{}` 空基底，否则 `^{2}` 会被 MathJax 判为非法。
- 积分序列化省略空被积函数的花括号：源码往返时会吞掉后续文本（`\int` + `dx` 序列化为 `\intdx`，再解析 `dx` 被当成被积函数）；被积函数花括号必须始终输出。
- 积分命令匹配非最长优先：`\iiint` / `\iint` 必须先于 `\int` 匹配，否则被拆成 `\int` + 文本；源码中的 `\limits` 修饰符必须跳过，否则限界解析错位。
- 可编辑槽位缺少 `contenteditable`，或分式 / 上下标 / 根式容器缺少 `me-frac__num` / `me-frac__den`、`me-script__sup` / `me-script__sub`、`me-root__index` / `me-root__radicand` 类名：无法点击进入，键盘导航也无法判断槽位角色。
- 常用模板里写 `\pm`、`\Delta` 等未解析命令：可编辑区按纯文本显示成 `\pm`；模板应优先使用 `±`、`Δ` 这类 Unicode 符号，或在 `parseLatex` 中显式支持该命令。
- 函数序列化省略参数花括号：`\sin` 与后续文本会并成 `\sinx`；参数花括号必须始终输出。函数命令要用 `isCommandAt` 判断词边界，否则 `\sinh` / `\cosh` 会被误判为 `\sin` / `\cos`。反函数命令 `\sin^{-1}` 必须在命令表中先于 `\sin` 登记，反双曲 `\sinh^{-1}` 必须先于 `\sinh` 登记，否则 `\sin^{-1}{x}` 会被拆成 `\sin` + 参数 `-1`。
- 函数下标槽（log 底数 / lim、min、max 条件）不能省略花括号：`\log` 后直接跟文本会吞掉字符，空槽必须输出 `\log_{}{}`。`readFunction` 只把命令后紧跟的 `_{...}` 收进下标，再读取参数；`.me-func__sub` 必须注册 `funcSub` 槽位角色、加入 `SLOT_CONTAINER_SELECTOR` 与 `getEdgeSlot` 的起点分支，否则下标不可编辑或被跳过。`functionFormatById` 必须按节点 id（而非显示名）建索引，否则反函数卡会覆盖基础函数的上标显示；卡片 id 与节点名不一致时（logBase → log）由 `insertFunction` 回退到 `format.name`。
- 导数符号序列化省略花括号：`\dot` 与后续文本会并成 `\dotx`；参数花括号必须始终输出（空参数为 `\命令{}`）。命令表必须最长优先并用 `isCommandAt` 判断词边界，否则 `\overleftrightarrow` 被 `\overleftarrow` 截断、`\dots` 被 `\dot` 误判、`\hats` 被 `\hat` 误判。下置记号（`\underbrace` / `\underline`）的 DOM 顺序是参数在前、记号在后，与上置记号相反，创建 / 序列化 / 聚焦逻辑需按 `derivFormatById` 的 `placement` 区分。双横线卡不能用 `createDerivElement(node, [内部元素])` 构造（`appendNodes` 只接受 `ParsedNode`），需创建外层后把内层元素直接 `append` 到 `.me-deriv__arg`，否则内层会被静默丢弃。
- 带标记花括号（Word 画廊第 14 / 15 张卡）是 `\overbrace{参数}^{标签}` / `\underbrace{参数}_{标签}`，不是 `\overbracket` / `\underbracket`：`createDerivElement` 的第三个参数为 `null` 表示无标签、`[]` 表示空标签槽，两者不能混用；`.me-deriv__label` 必须注册 `derivLabel` 槽位角色并加入点击定位选择器，否则标签不可编辑。解析时只把紧跟命令参数的 `^{...}`（上方）/ `_{...}`（下方）收进标签，其他位置的上下标仍按 `me-script` 处理。
- 带框公式与顶线 / 底线复用 `.me-deriv`：`\boxed` 不生成 `.me-deriv__mark`（只有参数槽），`\overline` / `\underline` 的记号元素文本为空、靠 `.me-deriv__mark--rule` 的 `border-top` 绘制，必须 `align-self: stretch` 才能随参数宽度拉伸；宽带框公式卡通过 `latex` 预填并在插入后把光标放到参数末尾。新增卡片要同时更新预览数组、`allDerivFormats` / `derivFormatById` 与 `derivCommands`，缺一处会导致插入或解析失败。
- 新增槽位容器时漏加 `SLOT_CONTAINER_SELECTOR` / `isSlotContainer`：`moveSibling` 的原子分支会把嵌套节点直接递归到外层节点，按一次 `←` / `→` 就跳过所有中间层；容器判定必须放在分子 / 分母、限界等既有互跳特例之后、递归到 `parent.parentElement` 之前。
- 演示页使用 hash 路由，不要改成 history 模式，否则静态部署刷新会 404。
- 只注册了 highlight.js 语言但没补 `.hljs-*` 样式：代码块有 span 但没有任何颜色。
- 直接引入完整 `highlight.js` 而不是 `highlight.js/lib/core` + 语言模块：包体积会明显增大。
- 数学字体只写 `font-family` 而没有 `unicode-range`：数字与字母不会分别命中 `KaTeX_Main` / `KaTeX_Math`。
- 把编辑逻辑写回 `HeFormulaDialog`：容器只负责弹窗，编辑逻辑必须在 `HeFormulaEditor`。
- 把 `HeFormulaEditor` 再拆出一个独立键盘输入组件：当前要求编辑 UI 统一在一个组件内。
- 在 `HeFormulaDialog` 中重新引入 MathLive：公式弹窗已改用自研 KaTeX 输入，`HeMathInput` 仅保留在内嵌示例。
