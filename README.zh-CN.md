# heMathEditor

[English](./README.md) | 简体中文

基于 **Vue 3 + Vite** 的数学公式编辑器，采用「两层编辑」架构：

- **第一层 `HeMdEditor`**：Markdown 编辑器（CodeMirror 6），公式以整体标签嵌入正文，正文中不能修改公式局部内容。
- **第二层 `HeFormulaDialog`**：点击公式标签或工具栏「∑ 公式」打开，使用 MathLive 所见即所得输入 LaTeX，并用 MathJax 实时预览。

项目当前以组件库 + 演示页的形式组织，可直接运行查看效果，也可按需复用其中的组件与工具。

## 特性

- **所见即所得公式输入**：基于 MathLive 的 `<math-field>`，支持虚拟键盘与结构化输入。
- **公式原子化**：正文中的 `$...$` / `$$...$$` 被替换为不可局部编辑、不可局部删除的整体标签。
- **点击即编辑**：点击公式标签打开弹窗，确认后原位替换，保持 Markdown 源码整洁。
- **分栏实时预览**：Markdown 预览与公式渲染同步更新，输入防抖 250ms。
- **代码高亮**：围栏代码块按语言用 highlight.js 着色，未知语言回退为纯文本。
- **Markdown 工具栏**：标题、加粗、斜体、删除线、行内代码、引用、列表、任务列表、代码块、链接、图片、表格、分割线。
- **本地 MathJax**：使用 `public/mathjax/tex-svg.js`（MathJax 3.2.2），不依赖 CDN，离线可用。
- **只读展示**：`HeMdViewer` 仅渲染后端返回的 Markdown，不加载 CodeMirror / MathLive。
- **演示页导航**：顶部导航可切换 HeMdEditor、HeMdViewer、HeMdWysiwyg 三个展示页。
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
- `#/viewer`：HeMdViewer 只读展示
- `#/wysiwyg`：HeMdWysiwyg 占位展示（组件尚未实现）

> 开发服务器监听 `0.0.0.0:3100`，可通过局域网访问。

## 目录结构

```
heMathEditor/
├─ public/
│  └─ mathjax/tex-svg.js        # 本地 MathJax 3.2.2 构建产物
├─ src/
│  ├─ core/
│  │  ├─ formula/parser.ts      # 公式扫描规则（编辑器与渲染共用的唯一定义）
│  │  └─ renderer/index.ts      # markdown-it + 数学规则 + 代码高亮
│  ├─ components/
│  │  ├─ HeMdEditor.vue         # 第一层：Markdown 编辑器（工具栏 + 分栏预览 + 公式弹窗）
│  │  ├─ HeMdViewer.vue         # 展示模式：只读渲染 Markdown + 公式
│  │  ├─ HeFormulaDialog.vue    # 第二层：公式编辑弹窗
│  │  ├─ HeMathInput.vue        # MathLive 公式输入框
│  │  └─ HeMathPreview.vue      # MathJax 公式预览
│  ├─ editor/
│  │  ├─ formulaAtom.ts         # 公式扫描 + CodeMirror 原子化扩展
│  │  └─ mdCommands.ts          # Markdown 工具栏命令实现
│  ├─ viewer/index.ts           # 只读展示子路径入口
│  ├─ utils/
│  │  └─ mathjax.ts             # MathJax 单例服务（按需加载、排队渲染）
│  ├─ styles/
│  │  ├─ index.scss             # 全局样式（含 MathLive 虚拟键盘层级）
│  │  ├─ markdown-body.scss     # Markdown 排版共享样式（预览与只读展示共用）
│  │  └─ demo.scss              # 演示页公共样式（卡片、按钮、标签）
│  ├─ pages/
│  │  ├─ EditorPage.vue         # 首页：HeMdEditor 分栏编辑展示
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

公式编辑弹窗，内部组合 `HeMathInput`（输入）、`HeMathPreview`（预览）和常用符号面板。

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | - | 是否显示弹窗，支持 `v-model` |
| `latex` | `string` | `''` | 初始 LaTeX |
| `display` | `boolean` | `false` | 初始是否为行间公式 |
| `title` | `string` | `'公式编辑'` | 弹窗标题 |
| `confirmText` | `string` | `'插入'` | 确认按钮文案 |
| `cancelText` | `string` | `'取消'` | 取消按钮文案 |

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `(visible: boolean)` | 弹窗开关状态变化 |
| `confirm` | `(latex: string, display: boolean)` | 点击确认，回传 LaTeX 与是否行间 |

```vue
<HeFormulaDialog
  v-model="visible"
  :latex="latex"
  :display="display"
  @confirm="(tex, isDisplay) => { latex = tex; display = isDisplay }"
/>
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
| 公式输入 | MathLive 0.100 |
| 公式渲染 | MathJax 3.2.2（本地 `tex-svg.js`） |
| 样式 | SCSS（sass） |

## 开发约定

- 代码缩进使用 **Tab**，组件使用 `<script setup lang="ts">`，样式使用 `scoped`。
- 路径别名 `@` 指向 `src`。
- MathLive 的 `<math-field>` 需保留为原生自定义元素，已在 `vite.config.ts` 中通过 `isCustomElement` 放行。
- 项目暂无自动化测试，提交前至少执行一次 `npm run build` 完成类型检查与构建验证。
- Markdown 排版样式统一维护在 `src/styles/markdown-body.scss`，编辑器预览与 `HeMdViewer` 共用。
- 演示页使用轻量 hash 路由（`src/App.vue`），页面放在 `src/pages`，公共样式放在 `src/styles/demo.scss`。
- 面向 AI / 协作者的快速上下文见 [README.ai.md](README.ai.md)。
- 版本变更记录见 [CHANGELOG.md](CHANGELOG.md)，**每次提交代码都必须同步更新版本说明**。

## 仓库

- GitHub：<https://github.com/hhk94/he-math-editor>
- Gitee：<https://gitee.com/hkchina/he-math-editor>
