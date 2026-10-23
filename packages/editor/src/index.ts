/**
 * heMathEditor —— 核心编辑器整体入口（未来 npm 包的唯一对外出口）
 *
 * 使用方式：
 * 1. 整体接入（推荐）：app.use(HeMathEditor)，自动安装 i18n 并全局注册全部组件
 * 2. 按需引入（支持 tree-shaking）：import { HeMdEditor } from 'he-math-editor'
 * 3. 纯函数能力：import { core } from 'he-math-editor'（公式解析 / Markdown 渲染）
 *
 * 注意：src/pages/*、App.vue、main.ts 属于演示站（demo），不属于库的对外内容，
 * 此处不得引用它们，打包入口（vite.lib.config.ts）也只从这里进入。
 */
import type { App, Plugin } from 'vue'
// 库全局样式：数学字体 / Markdown 排版 / MathLive 键盘层级（打进 dist-lib/style.css）
import './styles/global.scss'
import { i18n } from './i18n'
import HeMdEditorComponent from './components/HeMdEditor.vue'
import HeMdViewerComponent from './components/HeMdViewer.vue'
import HeMathInputComponent from './components/HeMathInput.vue'
import HeMathPreviewComponent from './components/HeMathPreview.vue'
import HeFormulaDialogComponent from './components/HeFormulaDialog.vue'
import HeFormulaEditorComponent from './components/HeFormulaEditor.vue'

/* ---------- 组件（具名导出，支持按需引入） ---------- */
export { default as HeMdEditor } from './components/HeMdEditor.vue'
export { default as HeMdViewer } from './components/HeMdViewer.vue'
export { default as HeMathInput } from './components/HeMathInput.vue'
export { default as HeMathPreview } from './components/HeMathPreview.vue'
export { default as HeFormulaDialog } from './components/HeFormulaDialog.vue'
export { default as HeFormulaEditor } from './components/HeFormulaEditor.vue'

/* ---------- 编辑器扩展（CodeMirror / Markdown 命令） ---------- */
export { formulaAtom } from './editor/formulaAtom'
export type { FormulaRef, FormulaEditHandler } from './editor/formulaAtom'
export * as editorCommands from './editor/mdCommands'

/* ---------- 纯函数能力：公式解析 + Markdown 渲染 ---------- */
export * as core from './core'
export { matchFormulaAt, scanFormulas } from './core/formula'
export type { FormulaMatch } from './core/formula'
export { markdownRenderer, renderMarkdownHtml, renderMarkdownInto } from './core/renderer'

/* ---------- 渲染服务 ---------- */
export { default as mathJaxService, renderTex } from './utils/mathjax'

/* ---------- 多语言 ---------- */
export { i18n, setLocale, getLocale, toggleLocale, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './i18n'
export type { AppLocale } from './i18n'

/* ---------- 整体插件：一次接入全部核心能力 ---------- */
const globalComponents: Record<string, unknown> = {
	HeMdEditor: HeMdEditorComponent,
	HeMdViewer: HeMdViewerComponent,
	HeMathInput: HeMathInputComponent,
	HeMathPreview: HeMathPreviewComponent,
	HeFormulaDialog: HeFormulaDialogComponent,
	HeFormulaEditor: HeFormulaEditorComponent
}

/**
 * Vue 插件整体安装：
 * app.use(HeMathEditor) 会自动安装内置 i18n，并把全部核心组件注册为全局组件，
 * 之后模板里可直接使用 <HeMdEditor /> 等，无需逐个 import。
 */
const HeMathEditor: Plugin = {
	install(app: App) {
		app.use(i18n)
		for (const [name, component] of Object.entries(globalComponents)) {
			app.component(name, component as never)
		}
	}
}

export default HeMathEditor