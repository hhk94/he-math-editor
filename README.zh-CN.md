# heMathEditor

[English](./README.md) | 简体中文

基于 **Vue 3 + Vite** 的数学公式编辑器，采用「两层编辑」架构：

- **第一层 `HeMdEditor`**：Markdown 编辑器（CodeMirror 6），公式以整体标签嵌入正文，正文中不能修改公式局部内容。
- **第二层 `HeFormulaDialog`**：点击公式标签或工具栏「∑ 公式」打开，使用 MathLive 所见即所得输入 LaTeX，并用 MathJax 实时预览。

项目当前以组件库 + 演示页的形式组织，可直接运行查看效果，也可按需复用其中的组件与工具。

## 特性

- **公式输入**：MathLive `<math-field>` 仍以 `HeMathInput` 保留在内嵌示例中；公式弹窗改用 `HeFormulaEditor` 的自研 KaTeX 输入。
- **公式原子化**：正文中的 `$...$` / `$$...$$` 被替换为不可局部编辑、不可局部删除的整体标签。
- **点击即编辑**：点击公式标签打开弹窗，确认后原位替换，保持 Markdown 源码整洁。
- **分栏实时预览**：Markdown 预览与公式渲染同步更新，输入防抖 250ms。
- **代码高亮**：围栏代码块按语言用 highlight.js 着色，未知语言回退为纯文本。
- **Markdown 工具栏**：标题、加粗、斜体、删除线、行内代码、引用、列表、任务列表、代码块、链接、图片、表格、分割线。
- **本地 MathJax**：使用 `public/mathjax/tex-svg.js`（MathJax 3.2.2），不依赖 CDN，离线可用。
- **只读展示**：`HeMdViewer` 仅渲染后端返回的 Markdown，不加载 CodeMirror / MathLive。
- **自研输入实验**：独立页面 `#/input` 使用 KaTeX 数学字体直接渲染键盘输入，不依赖 MathLive。
- **演示页导航**：顶部导航可切换 HeMdEditor、公式输入、HeMdViewer、HeMdWysiwyg 四个展示页。
- **中英文界面**：基于 vue-i18n，导航栏提供语言切换按钮，选择会持久化到 `localStorage`。
- **组件化输出**：`src/index.ts` 统一导出组件与工具，`src/viewer` 提供只读子路径入口。

## 快速开始

环境要求：Node.js 18+（建议 20+）。

```bash
npm install
npm run dev      # 开发服务器，默认 http://localhost:3100
npm run build    # 类型检查 + 生产构建（vue-tsc --noEmit && vite build）
npm run preview  # 预览构建产物
```

演示页使用轻量 hash 路由（未引入 vue-router）：

- `/` 或 `#/`：HeMdEditor 分栏编辑（首页）
- `#/input`：自研公式输入实验（键盘数字与符号）
- `#/viewer`：HeMdViewer 只读展示
- `#/wysiwyg`：HeMdWysiwyg 占位展示（组件尚未实现）

> 开发服务器监听 `0.0.0.0:3100`，可通过局域网访问。

## 工具栏支持

每个工具栏按钮的支持状态、分数格式与更新记录统一维护在 [TOOLBAR.md](TOOLBAR.md)。工具栏能力有变化时必须同步更新该文件。

## 目录结构

```
heMathEditor/
├─ public/
│  └─ mathjax/tex-svg.js        # 本地 MathJax 3.2.2 构建产物
├─ src/
│  ├─ assets/
│  │  └─ fonts/katex/           # KaTeX_Main / KaTeX_Math 字体文件
│  ├─ core/
│  │  ├─ formula/parser.ts      # 公式扫描规则（编辑器与渲染共用的唯一定义）
│  │  └─ renderer/index.ts      # markdown-it + 数学规则 + 代码高亮
│  ├─ components/
│  │  ├─ HeMdEditor.vue         # 第一层：Markdown 编辑器（工具栏 + 分栏预览 + 公式弹窗）
│  │  ├─ HeMdViewer.vue         # 展示模式：只读渲染 Markdown + 公式
│  │  ├─ HeFormulaDialog.vue    # 公式弹窗容器（遮罩 + 标题 + 底部按钮）
│  │  ├─ HeFormulaEditor.vue    # 公式编辑 UI（KaTeX 输入 + 预览 + 符号面板）
│  │  ├─ HeMathInput.vue        # MathLive 公式输入框
│  │  └─ HeMathPreview.vue      # MathJax 公式预览
│  ├─ editor/
│  │  ├─ formulaAtom.ts         # 公式扫描 + CodeMirror 原子化扩展
│  │  └─ mdCommands.ts          # Markdown 工具栏命令实现
│  ├─ i18n/
│  │  ├─ index.ts               # vue-i18n 实例、语言检测与切换
│  │  └─ locales/               # zh-CN.ts / en-US.ts 消息包
│  ├─ viewer/index.ts           # 只读展示子路径入口
│  ├─ utils/
│  │  └─ mathjax.ts             # MathJax 单例服务（按需加载、排队渲染）
│  ├─ styles/
│  │  ├─ index.scss             # 全局样式（含 MathLive 虚拟键盘层级）
│  │  ├─ markdown-body.scss     # Markdown 排版共享样式（预览与只读展示共用）
│  │  ├─ math-font.scss         # HeMathFont：KaTeX_Main + KaTeX_Math（unicode-range）
│  │  └─ demo.scss              # 演示页公共样式（卡片、按钮、标签）
│  ├─ pages/
│  │  ├─ EditorPage.vue         # 首页：HeMdEditor 分栏编辑展示
│  │  ├─ InputPage.vue          # 自研输入实验：键盘数字与符号
│  │  ├─ ViewerPage.vue         # HeMdViewer 只读展示
│  │  └─ WysiwygPage.vue        # HeMdWysiwyg 占位展示
│  ├─ App.vue                   # 应用外壳：顶部导航 + hash 路由
│  ├─ index.ts                  # 组件库入口（桶文件）
│  └─ main.ts                   # 应用入口
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
└─ package.json
```

## 组件说明

### HeMdEditor

Markdown 编辑器，内置工具栏、公式原子化与可选的右侧实时预览。

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | Markdown 源码，支持 `v-model` |
| `preview` | `boolean` | `true` | 是否显示右侧实时预览 |
| `placeholder` | `string` | `''` | 编辑器占位提示 |

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | 内容变化时触发 |

| 暴露方法 | 说明 |
| --- | --- |
| `focus()` | 聚焦编辑器 |
| `insertText(text: string)` | 在光标处插入文本 |
| `getValue(): string` | 获取当前 Markdown 源码 |

```vue
<template>
  <HeMdEditor v-model="md" preview />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HeMdEditor } from '@/index'

const md = ref('行内公式 $E=mc^2$，行间公式：\n\n$$\n\\int_a^b f(x)\\,dx\n$$')
</script>
```

### HeMdViewer

只读展示组件，接收后端返回的 Markdown 源码并渲染，不包含编辑器、工具栏与公式输入。

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `markdown` | `string` | `''` | 待渲染的 Markdown 源码，支持 `$...$` / `$$...$$` |
| `emptyText` | `string` | `''` | 内容为空时的占位文本 |

```vue
<script setup lang="ts">
import { HeMdViewer } from '@/viewer'

const markdown = '## 标题\n\n行内公式 $a^2+b^2=c^2$'
</script>

<template>
  <HeMdViewer :markdown="markdown" empty-text="暂无内容" />
</template>
```

> 打包后对应子路径 `he-math-editor/viewer`，只读场景不会引入 CodeMirror 与 MathLive。

### HeFormulaDialog

公式编辑弹窗容器。只负责遮罩、标题、底部按钮与开关状态；实际编辑内容由 `HeFormulaEditor` 提供。

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | - | 是否显示弹窗，支持 `v-model` |
| `latex` | `string` | `''` | 初始文本（LaTeX 或 Unicode 数学文本） |
| `display` | `boolean` | `true` | 初始是否为行间公式（默认勾选） |
| `title` | `string` | `t('formula.dialogTitle')` | 弹窗标题 |
| `confirmText` | `string` | `t('common.confirm')` | 确认按钮文案 |
| `cancelText` | `string` | `t('common.cancel')` | 取消按钮文案 |

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `(visible: boolean)` | 弹窗开关状态变化 |
| `confirm` | `(latex: string, display: boolean)` | 点击确认，回传编辑文本与是否行间 |

```vue
<HeFormulaDialog
  v-model="visible"
  :latex="latex"
  :display="display"
  @confirm="(tex, isDisplay) => { latex = tex; display = isDisplay }"
/>
```

### HeFormulaEditor

公式编辑 UI 组件，被 `HeFormulaDialog` 弹窗和 `#/input` 展示页共用。

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | 公式文本，支持 `v-model` |
| `display` | `boolean` | `true` | 是否行间公式（默认勾选），支持 `v-model:display` |
| `placeholder` | `string` | `t('formula.placeholder')` | 输入占位提示 |

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | 公式文本变化 |
| `update:display` | `(display: boolean)` | 行间模式变化 |

| 暴露方法 | 说明 |
| --- | --- |
| `focus()` | 聚焦输入框 |
| `validate(): boolean` | 校验非空，并在组件内显示错误 |
| `clear()` | 清空内容并聚焦 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { HeFormulaEditor } from '@/index'

const formula = ref('a+b=12×3')
const display = ref(false)
</script>

<template>
  <HeFormulaEditor v-model="formula" v-model:display="display" />
</template>
```

### HeMathInput

MathLive 公式输入框，`v-model` 绑定 LaTeX 源码。

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | LaTeX 源码 |

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | 输入变化时触发 |

暴露方法：`focus()`、`insert(latex: string)`、`getValue(): string`。

### HeMathPreview

MathJax 公式预览组件。

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `latex` | `string` | `''` | 待渲染的 LaTeX |
| `display` | `boolean` | `false` | `true` 按行间公式渲染（`\[...\]`），否则按行内（`\(...\)`） |

### 工具函数

```ts
import { mathJaxService, renderTex, formulaAtom, scanFormulas, renderMarkdownInto } from '@/index'
import type { FormulaRef, FormulaEditHandler, FormulaMatch } from '@/index'

// 对任意 DOM 元素内的 \(...\) / \[...\] 排版（MathJax 未就绪时自动排队）
await mathJaxService.renderElement(el)

// 是否已加载完成
mathJaxService.isMathJaxLoaded()

// 将 <span class="latex">...</span> 转为 MathJax 行内分隔符
const html = renderTex('<span class="latex">x^2</span>')

// 为 CodeMirror 注入公式原子化扩展
const extension = formulaAtom((formula: FormulaRef) => {
  // formula: { from, to, latex, display }
})

// 扫描 Markdown 中的公式（from/to 含分隔符）
const formulas: FormulaMatch[] = scanFormulas(markdown)

// 渲染 Markdown 到指定元素，并用 MathJax 排版其中的公式
await renderMarkdownInto(el, markdown)
```

## 公式书写规则

- 行内公式：`$...$`，不跨行。
- 行间公式：`$$...$$`，允许跨行。
- 行内公式开 `$` 后、闭 `$` 前不能是空白字符，否则不识别。
- 行间公式 `$$` 后允许换行与首尾空白，LaTeX 会去除首尾空白。
- `\$` 视为转义美元符号，不参与配对。
- 围栏代码块、缩进代码块、行内代码中的 `$` 不会被识别为公式。

示例：

```markdown
质能方程 $E=mc^2$。

$$
\int_a^b f(x)\,dx = F(b)-F(a)
$$
```

## 关键实现

### 公式原子化

[formulaAtom.ts](src/editor/formulaAtom.ts) 在 CodeMirror 中扫描全文公式，用 `Decoration.replace` + 自定义 `WidgetType` 将公式替换为整体标签：

- 通过 `EditorView.atomicRanges` 让光标跳过公式、退格整体删除；
- 装饰由 `StateField` 提供，跨行公式的块级装饰不能通过 `ViewPlugin` 注入；
- 跨行公式使用块级替换装饰；
- 标签内用 MathJax 渲染，点击 `mousedown` 回传 `FormulaRef` 打开弹窗；
- 使用语法树排除代码区域，避免误识别。

公式扫描规则统一定义在 [parser.ts](src/core/formula/parser.ts)，编辑器原子化与 Markdown 渲染共用同一实现。

### 预览渲染

[renderer/index.ts](src/core/renderer/index.ts) 提供统一的 `markdownRenderer` 与 `renderMarkdownInto`：用 markdown-it 渲染 Markdown，并注册数学规则，将公式输出为显式分隔符 `\(...\)` / `\[...\]`，再由 MathJax 排版。Markdown 原文中的 `$` 不直接交给 MathJax 解析，避免误配对。

### 代码高亮

围栏代码块通过 markdown-it 的 `highlight` 选项交给 highlight.js 着色。使用 core 构建并按需注册语言，避免引入完整语言包：

- 已注册：`bash`、`css`、`java`、`javascript`、`json`、`markdown`、`python`、`sql`、`typescript`、`xml`（含常用别名，如 `ts`、`js`、`html`）。
- 未标记语言或未知语言返回空字符串，由 markdown-it 转义后输出纯文本。
- 主题色定义在 [markdown-body.scss](src/styles/markdown-body.scss) 的 `.hljs-*` 规则中，不依赖 highlight.js 自带 CSS。

### 只读展示

`HeMdViewer` 只调用 `renderMarkdownInto`，不引入 CodeMirror 与 MathLive。容器使用 `.he-markdown-body`，与编辑器预览共享 [markdown-body.scss](src/styles/markdown-body.scss) 排版样式，保证两种模式视觉一致。

### 公式编辑容器 / UI 拆分

`HeFormulaDialog` 现在只负责弹窗容器，实际编辑内容抽到 [HeFormulaEditor.vue](src/components/HeFormulaEditor.vue)，由弹窗和 `#/input` 页面共用：

- `HeFormulaEditor` 现在分三段展示：LaTeX 原文、自研可编辑渲染公式、只读 MathJax 实时预览。
- 可编辑区使用分式容器 + contenteditable 文本槽：`\frac{...}{...}` 和 `\tfrac{...}{...}` 渲染为结构化分式，分子/分母可直接落光标修改；点击槽位即可编辑渲染后的部分，而不是修改 LaTeX 原文。
- 分式解析是递归的：分子或分母中还可以继续包含 `\frac` / `\tfrac` / 斜式节点。光标在分子/分母内时再次点击「分数（竖式）」，会在该子项内嵌套新分式，因此重复插入竖式即可写任意层级的连分式。
- 分子/分母可以混排普通文本（如整数）与嵌套分式。分子内，在嵌套分式边界按 `←` / `→` 会在该层级创建文本槽；点击分子/分母容器的留白处也会聚焦或创建同级文本槽，而不是进入嵌套分式。
- 键盘导航：公式外部把每个分式视为整体，`←` / `→` 会跨过整座公式而不是进入它；点击公式内部后才在各元素之间移动。进入公式后，分子末尾按 `↓` / `→` 进入分母，分母开头按 `↑` / `←` 回到分子；分式外侧边界会跳出到前后的文本槽，因此可以直接输入 `\frac{a}{b}+c`，不必把 `+c` 写进分子或分母。
- 结构化分式本身不是可编辑节点，删除方式：分子开头按 `Backspace`、分母末尾按 `Delete`，或在相邻文本槽边界按 `Backspace` / `Delete` 删除整个分式；删除后光标停留在相邻文本槽。
- 点击编辑区空白处会按点击位置定位光标：分式左侧落到分式前的文本槽，右侧落到分式后的文本槽；点击分式本身则聚焦分子。
- 分数弹窗第一排为：分数（竖式）`\frac`、分数（横式）`a/b`、分数（斜式）`{}^{a}\!/\!_{b}`、分数（小型分数）`\tfrac`；竖式、斜式、小型和常用分数插入结构化分式并默认选中分子。连分式不再单独提供，改用竖式嵌套实现。
- 顶部工具栏除分数外暂未绑定行为：`符号`（Ω）、`分数`（打开分数格式弹窗）+ 上下标、根式、积分、大型运算符、括号、函数、导数符号、极限和对数、运算符、矩阵，共 12 个按钮；分数卡片会插入对应 LaTeX，其余按钮暂未接入。
- `HeFormulaDialog` 只负责遮罩、标题、底部按钮与开关状态。
- `#/input` 直接渲染 `HeFormulaEditor`，不再套弹窗。
- `*`、`-`、`/` 在 keydown 时转换为 `×`、`−`、`÷`。
- 当前限制：只有 `\frac`、`\tfrac` 和斜式 `{}^{a}\!/\!_{b}` 是结构化的；上下标（`^` / `_`）、`\cfrac` / `\dfrac` 和其他 LaTeX 命令在可编辑区仍显示为文本，实时预览会正确渲染。
- `HeMathInput`（MathLive）仍保留在内嵌示例中，但公式弹窗已不再使用它。

### 国际化

界面文案由 vue-i18n 的 Composition API 管理。

- [i18n/index.ts](src/i18n/index.ts) 创建 i18n 实例，初始语言从 `localStorage` 的 `hemath-editor:locale` 读取，否则使用 `DEFAULT_LOCALE`（`zh-CN`）；导出 `getLocale` / `setLocale` / `toggleLocale`。
- 文案位于 [locales/zh-CN.ts](src/i18n/locales/zh-CN.ts) 与 [locales/en-US.ts](src/i18n/locales/en-US.ts)，新增 key 时必须两边同步。
- 顶部导航提供语言按钮（`EN` / `中文`）；切换后会同步 `document.documentElement.lang`、页面标题以及所有使用 `useI18n()` 的组件。
- 新增语言：添加消息包，扩展 `src/i18n/index.ts` 的 `SUPPORTED_LOCALES` 与 `isAppLocale`，并调整导航栏的语言控件（当前按钮只在中英之间切换）。
- 组件中不得硬编码界面文案；模板、computed 与命令式 DOM 创建都要用 `t('...')`（槽位的 `aria-label` 会在切换语言时同步刷新）。

### MathJax 服务

[mathjax.ts](src/utils/mathjax.ts) 维护单例：

- 首次调用时动态注入 `public/mathjax/tex-svg.js`，配置必须在脚本加载前写入；
- 关闭自动排版（`startup.typeset: false`），改为按元素 `typesetClear` + `typesetPromise`；
- 加载完成前的渲染请求进入队列，加载后依次执行；
- 注册 `\oiint` / `\oiiint` 宏，使用 `◯` 叠加 `∬` / `∭` 实现。

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Vue 3.5（`<script setup>` + TypeScript） |
| 构建 | Vite 6 |
| 编辑器内核 | CodeMirror 6（`@codemirror/*`） |
| Markdown 渲染 | markdown-it 14 + highlight.js 11 |
| 公式输入 | MathLive 0.100（`HeMathInput`）+ 自研 KaTeX 输入（`HeFormulaEditor`） |
| 公式渲染 | MathJax 3.2.2（本地 `tex-svg.js`） |
| 国际化 | vue-i18n 11（Composition API，zh-CN / en-US） |
| 数学字体 | KaTeX_Main / KaTeX_Math（复制自 MathLive 0.100.0） |
| 样式 | SCSS（sass） |

## 开发约定

- 代码缩进使用 **Tab**，组件使用 `<script setup lang="ts">`，样式使用 `scoped`。
- 路径别名 `@` 指向 `src`。
- MathLive 的 `<math-field>` 需保留为原生自定义元素，已在 `vite.config.ts` 中通过 `isCustomElement` 放行。
- 项目暂无自动化测试，提交前至少执行一次 `npm run build` 完成类型检查与构建验证。
- Markdown 排版样式统一维护在 `src/styles/markdown-body.scss`，编辑器预览与 `HeMdViewer` 共用。
- KaTeX 字体文件位于 `src/assets/fonts/katex/`，复制自 `mathlive@0.100.0`，再分发时保留字体授权说明。
- 编辑 UI 统一放在 `src/components/HeFormulaEditor.vue`；`InputPage.vue` 只是直接展示它的薄页面，不要再单独抽键盘输入组件。
- `HeFormulaDialog` 必须保持纯容器职责，编辑逻辑放在 `HeFormulaEditor`。
- 演示页使用轻量 hash 路由（`src/App.vue`），页面放在 `src/pages`，公共样式放在 `src/styles/demo.scss`。
- 所有界面文案必须走 `t()`，同一个改动里同步补充 `src/i18n/locales/zh-CN.ts` 与 `en-US.ts`。
- 工具栏能力有变化时，必须同步更新 [TOOLBAR.md](TOOLBAR.md) 的支持矩阵与更新记录，并同步版本说明。
- 面向 AI / 协作者的快速上下文见 [README.ai.md](README.ai.md)。
- 版本变更记录见 [CHANGELOG.md](CHANGELOG.md)，**每次提交代码都必须同步更新版本说明**。

## 仓库

- GitHub：<https://github.com/hhk94/he-math-editor>
- Gitee：<https://gitee.com/hkchina/he-math-editor>
