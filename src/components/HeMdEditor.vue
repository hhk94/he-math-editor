<template>
	<div class="he-md-editor">
		<div class="he-md-editor__toolbar">
			<template v-for="(group, groupIndex) in tools" :key="groupIndex">
				<span v-if="groupIndex > 0" class="he-md-editor__sep"></span>
				<button
					v-for="tool in group"
					:key="tool.title"
					type="button"
					class="he-md-editor__tool"
					:class="tool.cls"
					:title="tool.title"
					@click="runTool(tool)"
				>
					{{ tool.label }}
				</button>
			</template>
			<span class="he-md-editor__sep"></span>
			<button
				type="button"
				class="he-md-editor__tool he-md-editor__tool--fx"
				title="插入公式"
				@click="openFormulaEditor(null)"
			>
				∑ 公式
			</button>
		</div>

		<div class="he-md-editor__body" :class="{ 'he-md-editor__body--split': preview }">
			<div ref="hostRef" class="he-md-editor__code"></div>
			<div v-if="preview" ref="previewRef" class="he-md-editor__preview he-markdown-body"></div>
		</div>

		<HeFormulaDialog
			v-model="dialogVisible"
			:latex="dialogLatex"
			:display="dialogDisplay"
			@confirm="onFormulaConfirm"
		/>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import HeFormulaDialog from './HeFormulaDialog.vue'
import { formulaAtom } from '@/editor/formulaAtom'
import type { FormulaRef } from '@/editor/formulaAtom'
import { renderMarkdownInto } from '@/core/renderer'
import {
	insertHr,
	insertImage,
	insertLink,
	insertTable,
	toggleBulletList,
	toggleCodeBlock,
	toggleHeading,
	toggleOrderedList,
	toggleQuote,
	toggleTaskList,
	toggleWrap
} from '@/editor/mdCommands'

/**
 * HeMdEditor —— 第一层 Markdown 编辑器
 * 工具栏覆盖常用 Markdown 语法；公式以整体标签嵌入正文（原子化，不可局部编辑/删除），
 * 点击公式标签或工具栏“∑ 公式”按钮打开第二层公式编辑弹窗。
 */
const props = withDefaults(
	defineProps<{
		modelValue?: string
		/** 是否显示右侧实时预览 */
		preview?: boolean
		placeholder?: string
	}>(),
	{
		modelValue: '',
		preview: true,
		placeholder: ''
	}
)

const emit = defineEmits<{
	(e: 'update:modelValue', value: string): void
}>()

interface Tool {
	label: string
	title: string
	cls?: string
	run: (view: EditorView) => void
}

const tools: Tool[][] = [
	[
		{ label: 'H1', title: '一级标题', run: (v) => toggleHeading(v, 1) },
		{ label: 'H2', title: '二级标题', run: (v) => toggleHeading(v, 2) },
		{ label: 'H3', title: '三级标题', run: (v) => toggleHeading(v, 3) }
	],
	[
		{ label: 'B', title: '加粗（Ctrl+B）', cls: 'is-bold', run: (v) => toggleWrap(v, '**', '加粗文字') },
		{ label: 'I', title: '斜体（Ctrl+I）', cls: 'is-italic', run: (v) => toggleWrap(v, '*', '斜体文字') },
		{ label: 'S', title: '删除线', cls: 'is-strike', run: (v) => toggleWrap(v, '~~', '删除线') },
		{ label: '</>', title: '行内代码', cls: 'is-mono', run: (v) => toggleWrap(v, '`', '代码') }
	],
	[
		{ label: '❝', title: '引用', run: toggleQuote },
		{ label: '•', title: '无序列表', run: toggleBulletList },
		{ label: '1.', title: '有序列表', run: toggleOrderedList },
		{ label: '☐', title: '任务列表', run: toggleTaskList }
	],
	[
		{ label: '{ }', title: '代码块', cls: 'is-mono', run: toggleCodeBlock },
		{ label: '链接', title: '插入链接', run: insertLink },
		{ label: '图片', title: '插入图片', run: insertImage },
		{ label: '表格', title: '插入表格', run: insertTable },
		{ label: '―', title: '分割线', run: insertHr }
	]
]

const hostRef = ref<HTMLElement>()
const previewRef = ref<HTMLElement>()
let view: EditorView | null = null

/* ---------- 预览渲染（输入防抖 250ms） ---------- */

let previewTimer: ReturnType<typeof setTimeout> | undefined

const renderPreview = (immediate = false) => {
	if (!props.preview) return
	clearTimeout(previewTimer)
	const doRender = async () => {
		const el = previewRef.value
		if (!el) return
		await renderMarkdownInto(el, view ? view.state.doc.toString() : props.modelValue)
	}
	if (immediate) {
		void doRender()
	} else {
		previewTimer = setTimeout(() => void doRender(), 250)
	}
}

/* ---------- 公式编辑弹窗联动 ---------- */

const dialogVisible = ref(false)
const dialogLatex = ref('')
const dialogDisplay = ref(false)
let editRange: { from: number; to: number } | null = null

const openFormulaEditor = (formula: FormulaRef | null) => {
	if (formula) {
		editRange = { from: formula.from, to: formula.to }
		dialogLatex.value = formula.latex
		dialogDisplay.value = formula.display
	} else {
		editRange = null
		dialogLatex.value = ''
		dialogDisplay.value = false
	}
	dialogVisible.value = true
}

const onFormulaConfirm = (latex: string, display: boolean) => {
	if (!view) return
	const text = display ? `$$${latex}$$` : `$${latex}$`
	if (editRange) {
		const from = Math.min(editRange.from, view.state.doc.length)
		const to = Math.min(editRange.to, view.state.doc.length)
		view.dispatch({ changes: { from, to, insert: text } })
	} else {
		view.dispatch(view.state.replaceSelection(text))
	}
	editRange = null
	view.focus()
}

/* ---------- 编辑器挂载与销毁 ---------- */

const editorTheme = EditorView.theme({
	'&': { height: '100%', fontSize: '14px', backgroundColor: '#fff' },
	'.cm-scroller': {
		fontFamily: "Consolas, 'Courier New', 'PingFang SC', 'Microsoft YaHei', monospace",
		lineHeight: '1.75'
	},
	'.cm-content': { padding: '12px 14px' },
	'&.cm-focused': { outline: 'none' },
	'.cm-line': { padding: '0' }
})

const mdKeymap = keymap.of([
	{
		key: 'Mod-b',
		run: (v) => {
			toggleWrap(v, '**', '加粗文字')
			return true
		}
	},
	{
		key: 'Mod-i',
		run: (v) => {
			toggleWrap(v, '*', '斜体文字')
			return true
		}
	}
])

onMounted(() => {
	view = new EditorView({
		parent: hostRef.value!,
		state: EditorState.create({
			doc: props.modelValue,
			extensions: [
				mdKeymap,
				history(),
				keymap.of([...defaultKeymap, ...historyKeymap]),
				markdown({ base: markdownLanguage }),
				syntaxHighlighting(defaultHighlightStyle),
				EditorView.lineWrapping,
				formulaAtom(openFormulaEditor),
				EditorView.updateListener.of((update) => {
					if (!update.docChanged) return
					emit('update:modelValue', update.state.doc.toString())
					renderPreview()
				}),
				editorTheme,
				cmPlaceholder(props.placeholder)
			]
		})
	})
	renderPreview(true)
})

onBeforeUnmount(() => {
	clearTimeout(previewTimer)
	view?.destroy()
	view = null
})

watch(
	() => props.modelValue,
	(value) => {
		if (!view) return
		const current = view.state.doc.toString()
		const next = value ?? ''
		if (next === current) return
		view.dispatch({ changes: { from: 0, to: current.length, insert: next } })
		renderPreview()
	}
)

watch(
	() => props.preview,
	(visible) => {
		if (visible) renderPreview(true)
	}
)

const runTool = (tool: Tool) => {
	if (!view) return
	tool.run(view)
	view.focus()
}

const focus = () => view?.focus()

const insertText = (text: string) => {
	if (!view) return
	view.dispatch(view.state.replaceSelection(text))
	view.focus()
}

const getValue = () => view?.state.doc.toString() ?? ''

defineExpose({ focus, insertText, getValue })
</script>

<style scoped>
.he-md-editor {
	display: flex;
	flex-direction: column;
	border: 1px solid #e3e8ef;
	border-radius: 12px;
	background: #fff;
	overflow: hidden;
}

.he-md-editor__toolbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 4px;
	padding: 8px 12px;
	border-bottom: 1px solid #eef0f3;
	background: #fafbfc;
}

.he-md-editor__sep {
	width: 1px;
	height: 20px;
	margin: 0 6px;
	background: #e3e8ef;
}

.he-md-editor__tool {
	min-width: 30px;
	padding: 5px 9px;
	border: 1px solid transparent;
	border-radius: 6px;
	background: transparent;
	font-size: 13px;
	color: #444;
	cursor: pointer;
	transition: all 0.15s;
}

.he-md-editor__tool:hover {
	background: #eef3ff;
	color: #3b6ef5;
	border-color: #c9daff;
}

.he-md-editor__tool.is-bold {
	font-weight: 700;
}

.he-md-editor__tool.is-italic {
	font-style: italic;
}

.he-md-editor__tool.is-strike {
	text-decoration: line-through;
}

.he-md-editor__tool.is-mono {
	font-family: Consolas, monospace;
	font-size: 12px;
}

.he-md-editor__tool--fx {
	background: #3b6ef5;
	border-color: #3b6ef5;
	color: #fff;
	font-weight: 600;
}

.he-md-editor__tool--fx:hover {
	background: #2f5ee0;
	border-color: #2f5ee0;
	color: #fff;
}

.he-md-editor__body {
	display: flex;
	height: 480px;
}

.he-md-editor__code {
	flex: 1;
	min-width: 0;
	height: 100%;
	overflow: hidden;
}

.he-md-editor__body--split .he-md-editor__code {
	border-right: 1px solid #eef0f3;
}

.he-md-editor__preview {
	flex: 1;
	min-width: 0;
	height: 100%;
	overflow-y: auto;
	padding: 14px 18px;
	background: #fff;
}

.he-md-editor__code :deep(.cm-editor) {
	height: 100%;
}

.he-md-editor__code :deep(.cm-scroller) {
	overflow: auto;
}

/* 公式原子标签：整体标签样式，点击打开公式编辑器 */
.he-md-editor__code :deep(.he-formula-atom) {
	display: inline-block;
	max-width: 100%;
	padding: 1px 8px;
	margin: 0 2px;
	border: 1px solid #c9daff;
	border-radius: 6px;
	background: #eef3ff;
	cursor: pointer;
	vertical-align: middle;
	overflow-x: auto;
}

.he-md-editor__code :deep(.he-formula-atom:hover) {
	border-color: #3b6ef5;
	box-shadow: 0 0 0 2px rgba(59, 110, 245, 0.15);
}

.he-md-editor__code :deep(.he-formula-atom--display) {
	margin: 6px 0;
	padding: 8px 14px;
	text-align: center;
}
</style>
