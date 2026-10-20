# README.ai.md · 面向 AI 的项目速读

> 目标：让 AI 在最少上下文中理解 heMathEditor 的架构、契约、不变量与改动路径。人类向说明见 [README.md](README.md)。

## 1. 一句话定位

Vue 3 + Vite 的「两层公式编辑器」：CodeMirror 6 负责 Markdown 正文，公式以 `$...$` / `$$...$$` 源码存储在文档中，但在编辑器里渲染为不可分割的整体标签；点击标签弹出 MathLive 输入 + MathJax 预览的编辑弹窗，确认后原位回写源码。

当前状态：组件库 + 演示应用。`App.vue` 使用 hash 路由与顶部导航，页面位于 `src/pages`；已实现分栏编辑（`HeMdEditor`）与只读展示（`HeMdViewer`），`WysiwygPage` 为占位页，单栏所见即所得组件尚未实现。

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
│     └─ HeFormulaDialog              第二层：公式编辑弹窗
│        ├─ HeMathInput               MathLive <math-field>
│        ├─ HeMathPreview             MathJax 预览
│        └─ 常用符号面板
├─ pages/ViewerPage.vue（/viewer）
│  └─ HeMdViewer                      模式 2：只读展示
│     └─ core/renderer → MathJax（不引入 CodeMirror / MathLive）
└─ pages/WysiwygPage.vue（/wysiwyg） 模式 3：占位页，组件待实现
```

## 3. 文件地图

| 文件 | 职责 | 关键导出 |
| --- | --- | --- |
| `src/components/HeMdEditor.vue` | 第一层编辑器：工具栏、CodeMirror 挂载、250ms 防抖预览、弹窗联动 | 默认导出组件；暴露 `focus` / `insertText` / `getValue` |
| `src/components/HeMdViewer.vue` | 只读展示：`markdown` 渲染、`emptyText` 空状态，仅依赖 core/renderer | 默认导出组件 |
| `src/components/HeFormulaDialog.vue` | 第二层弹窗：初值同步、行间开关、符号插入、空值校验 | 默认导出组件；`confirm(latex, display)` |
| `src/components/HeMathInput.vue` | MathLive 输入封装，`v-model` 同步 LaTeX | 默认导出；暴露 `focus` / `insert` / `getValue` |
| `src/components/HeMathPreview.vue` | MathJax 单公式预览，空值显示占位 | 默认导出 |
| `src/core/formula/parser.ts` | **公式解析唯一实现**：`matchFormulaAt` / `scanFormulas` | `FormulaMatch`、`matchFormulaAt`、`scanFormulas` |
| `src/core/renderer/index.ts` | 统一 Markdown 渲染：markdown-it 实例、数学规则、highlight.js 代码高亮、MathJax 排版入口 | `markdownRenderer`、`renderMarkdownHtml`、`renderMarkdownInto` |
| `src/editor/formulaAtom.ts` | 代码区排除、原子化 `StateField`、点击回调；扫描复用 core | `formulaAtom`、`scanFormulas`、`FormulaRef` / `FormulaEditHandler` |
| `src/editor/mdCommands.ts` | 工具栏命令：标题、行前缀、内联包裹、块插入 | `toggleHeading`、`toggleWrap`、`insertTable` 等 |
| `src/viewer/index.ts` | 只读展示子路径入口 | `HeMdViewer` |
| `src/pages/EditorPage.vue` | 首页：HeMdEditor、公式弹窗、内嵌输入示例 | 默认导出页面组件 |
| `src/pages/ViewerPage.vue` | HeMdViewer 只读展示与空状态示例 | 默认导出页面组件 |
| `src/pages/WysiwygPage.vue` | HeMdWysiwyg 占位页与计划说明 | 默认导出页面组件 |
| `src/styles/markdown-body.scss` | 编辑器预览与只读展示共享的 Markdown 排版 | - |
| `src/styles/demo.scss` | 演示页公共样式：页面、卡片、按钮、标签、符号面板 | - |
| `src/utils/mathjax.ts` | MathJax 单例：动态加载本地脚本、配置、渲染队列、`\oiint` 宏 | `mathJaxService`、`renderTex` |
| `src/index.ts` | 桶文件 | 全部组件 + `formulaAtom` + core 解析/渲染 + 类型 + MathJax 服务 |
| `src/App.vue` | 应用外壳：顶部导航、hash 路由、页面切换与标题同步 | - |
| `public/mathjax/tex-svg.js` | 本地 MathJax 3.2.2 构建 | - |
| `vite.config.ts` | `@` 别名；`isCustomElement: tag.startsWith('math-')`；端口 3100 | - |
| `src/styles/index.scss` | 全局样式；引入 Markdown 与演示页共享样式；`.ML__keyboard { z-index: 3000 }` | - |

## 4. 数据契约

- 文档中的公式格式：行内 `$latex$`，行间 `$$latex$$`（可跨行）。
- `FormulaRef = { from, to, latex, display }`：`from/to` 为含分隔符的文档偏移。
- `HeFormulaDialog` 的 `confirm` 回传 **不含分隔符** 的 `latex` 与 `display`；由 `HeMdEditor` 负责重新拼成 `$...$` 或 `$$...$$`。
- `HeMathPreview` 接收裸 LaTeX，内部自行包裹 `\(...\)` / `\[...\]`。
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

不变量：`matchFormulaAt` 是公式识别的**唯一实现**。`scanFormulas`（编辑器原子化）与 `core/renderer` 的 markdown-it 规则都复用它，不再维护两份规则。修改公式语法只需改 `core/formula/parser.ts`，并同步 README 的「公式书写规则」。

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

## 6. 常见改动路径

| 需求 | 修改位置 |
| --- | --- |
| 新增 Markdown 工具栏按钮 | `src/editor/mdCommands.ts` 加命令；`HeMdEditor.vue` 的 `tools` 数组注册 |
| 新增公式常用符号 | `HeFormulaDialog.vue` 的 `symbols`；演示页 `EditorPage.vue` 的 `symbols` 可选同步 |
| 修改公式分隔符/识别规则 | `src/core/formula/parser.ts`（唯一定义）+ `src/core/renderer/index.ts`（token 输出）+ `mathjax.ts`（分隔符配置）+ README |
| 新增代码高亮语言 | `src/core/renderer/index.ts` 导入并 `registerLanguage`；必要时在 `markdown-body.scss` 补充 token 样式 |
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
6. 行间开关切换后插入的源码为 `$$...$$`。
7. 空公式确认时出现「请先输入公式」。
8. 只读展示区出现标题、列表、引用，行内与行间公式各生成 MathJax SVG，页面不出现原始 `$$`。
9. 编辑器预览与只读展示的标题字号、行高、引用边框保持一致。
10. 顶部导航可在 HeMdEditor / HeMdViewer / HeMdWysiwyg 间切换，URL hash 与当前导航高亮同步。
11. 直接访问 `#/viewer`、`#/wysiwyg` 能打开对应页面，浏览器前进 / 后退正常，未知 hash 回退首页。
12. 围栏代码块按语言生成 `.hljs-*` span 并有对应颜色；未知语言回退为纯文本。

## 8. 提交与版本规则（强制）

- **每次提交代码前，必须更新 [CHANGELOG.md](CHANGELOG.md) 的 `[未发布]` 区块**，写明新增 / 修复 / 变更 / 移除 / 文档 / 工程。
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
- 演示页使用 hash 路由，不要改成 history 模式，否则静态部署刷新会 404。
- 只注册了 highlight.js 语言但没补 `.hljs-*` 样式：代码块有 span 但没有任何颜色。
- 直接引入完整 `highlight.js` 而不是 `highlight.js/lib/core` + 语言模块：包体积会明显增大。
