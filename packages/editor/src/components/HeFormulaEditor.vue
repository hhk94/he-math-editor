<template>
	<div class="he-formula-editor">
		<div ref="toolbarRef" class="he-formula-toolbar-wrap">
			<div class="he-formula-toolbar">
				<button
					v-for="tool in tools"
					:key="tool.id"
					class="he-formula-toolbar__item"
					type="button"
					:title="t('formula.toolbar.' + tool.id)"
					@mousedown.prevent
					@click="onToolClick(tool)"
				>
					<span class="he-formula-toolbar__icon he-math-font" v-html="tool.icon"></span>
					<span class="he-formula-toolbar__label">
						{{ t('formula.toolbar.' + tool.id) }}
						<span class="he-formula-toolbar__chevron">▾</span>
					</span>
				</button>
			</div>

			<div
				v-if="fractionOpen"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.fraction.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.fraction.panelTitle') }}</div>
				<div class="he-tool-popover__body">
					<div class="he-tool-popover__grid">
						<button
							v-for="item in fractionFormats"
							:key="item.id"
							class="he-tool-card"
							type="button"
							:title="`${t('formula.fraction.' + item.id)} ${item.latex}`"
							@mousedown.prevent
							@click="pickFraction(item)"
						>
							<span class="he-tool-card__preview he-math-font" v-html="item.preview"></span>
						</button>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.fraction.commonTitle') }}</div>
					<div class="he-tool-popover__grid">
						<button
							v-for="item in commonFractions"
							:key="item.label"
							class="he-tool-card"
							type="button"
							:title="item.label"
							@mousedown.prevent
							@click="pickFraction(item)"
						>
							<span class="he-tool-card__preview he-math-font" v-html="item.preview"></span>
						</button>
					</div>
				</div>
			</div>

			<div
				v-if="scriptsOpen"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.script.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.script.panelTitle') }}</div>
				<div class="he-tool-popover__body">
					<div class="he-tool-popover__grid">
						<button
							v-for="item in scriptFormats"
							:key="item.id"
							class="he-tool-card"
							type="button"
							:title="t('formula.script.' + item.id)"
							@mousedown.prevent
							@click="pickScriptFormat(item)"
						>
							<span class="he-tool-card__preview he-math-font" v-html="item.preview"></span>
						</button>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.script.commonTitle') }}</div>
					<div class="he-tool-popover__grid">
						<button
							v-for="item in commonScripts"
							:key="item.label"
							class="he-tool-card"
							type="button"
							:title="item.label"
							@mousedown.prevent
							@click="pickCommonScript(item)"
						>
							<span class="he-tool-card__preview he-math-font" v-html="item.preview"></span>
						</button>
					</div>
				</div>
			</div>

			<div
				v-if="rootOpen"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.root.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.root.panelTitle') }}</div>
				<div class="he-tool-popover__body">
					<div class="he-tool-popover__grid">
						<button
							v-for="item in rootFormats"
							:key="item.id"
							class="he-tool-card he-tool-card--tall"
							type="button"
							:title="t('formula.root.' + item.id)"
							@mousedown.prevent
							@click="pickRootFormat(item)"
						>
							<span class="he-tool-card__preview he-math-font" v-html="item.preview"></span>
						</button>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.root.commonTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--half">
						<button
							v-for="item in commonRoots"
							:key="item.label"
							class="he-tool-card he-tool-card--wide"
							type="button"
							:title="item.label"
							@mousedown.prevent
							@click="pickCommonRoot(item)"
						>
							<span class="he-tool-card__preview he-math-font" v-html="item.preview"></span>
						</button>
					</div>
				</div>
			</div>

			<div
				v-if="integralOpen"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.integral.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.integral.panelTitle') }}</div>
				<div class="he-tool-popover__body">
					<div class="he-tool-popover__grid he-tool-popover__grid--thirds">
						<button
							v-for="item in integralFormats"
							:key="item.id"
							class="he-tool-card he-tool-card--tall"
							type="button"
							:title="t('formula.integral.' + item.id)"
							@mousedown.prevent
							@click="pickIntegralFormat(item)"
						>
							<span class="he-tool-card__preview he-math-font" v-html="item.preview"></span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<div class="he-field-label">{{ t('formula.latexSource') }}</div>
		<textarea
			v-model="text"
			class="he-formula-source"
			rows="2"
			spellcheck="false"
			:placeholder="t('formula.empty')"
			@keydown.enter.prevent
		></textarea>

		<div class="he-field-label he-field-label--gap">{{ t('formula.editable') }}</div>
		<div class="he-formula-editor__row">
			<div
				ref="editorRef"
				class="he-formula-editable he-math-font"
				:class="{ 'is-empty': !text }"
				:data-placeholder="placeholderText"
				role="textbox"
				:aria-label="t('formula.aria.editable')"
				@input="onEditorInput"
				@keydown="onEditorKeydown"
				@paste="onEditorPaste"
				@click="onEditorClick"
				@focusin="onEditorFocusIn"
				@focusout="onEditorFocusOut"
			></div>
			<button class="he-formula-editor__clear" type="button" @mousedown.prevent @click="clear">
				{{ t('common.clear') }}
			</button>
		</div>

		<div class="he-field-label he-field-label--gap">
			{{ t('formula.preview') }}
			<label class="he-display-toggle">
				<input v-model="displayMode" type="checkbox" />
				{{ t('formula.displayMode') }}
			</label>
		</div>
		<HeMathPreview :latex="text" :display="displayMode" />

		<div class="he-field-label he-field-label--gap">{{ t('formula.commonSymbols') }}</div>
		<div class="he-symbols">
			<button
				v-for="symbol in symbols"
				:key="symbol.label"
				class="he-sym he-math-font"
				type="button"
				@mousedown.prevent
				@click="insertText(symbol.value)"
			>
				{{ symbol.label }}
			</button>
		</div>

		<div v-if="error" class="he-error">{{ error }}</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import HeMathPreview from './HeMathPreview.vue'

/**
 * HeFormulaEditor —— 公式编辑 UI 组件
 * 只负责编辑内容：KaTeX 字体输入、MathJax 预览、行间开关、符号面板与校验。
 * 弹窗容器 HeFormulaDialog 与 /input 页面共用这个组件。
 */
const props = withDefaults(
	defineProps<{
		modelValue?: string
		display?: boolean
		placeholder?: string
	}>(),
	{
		modelValue: '',
		display: true,
		placeholder: ''
	}
)

const emit = defineEmits<{
	(e: 'update:modelValue', value: string): void
	(e: 'update:display', value: boolean): void
}>()

const { t, locale } = useI18n()

const placeholderText = computed(() => props.placeholder || t('formula.placeholder'))

const editorRef = ref<HTMLElement>()
const error = ref('')
let lastSerialized = ''
let lastFocusedSlot: HTMLElement | null = null

const text = computed({
	get: () => props.modelValue ?? '',
	set: (value: string) => emit('update:modelValue', value)
})

const displayMode = computed({
	get: () => props.display,
	set: (value: boolean) => emit('update:display', value)
})

type ToolId =
	| 'symbols'
	| 'fraction'
	| 'scripts'
	| 'radical'
	| 'integral'
	| 'largeOperator'
	| 'bracket'
	| 'function'
	| 'derivative'
	| 'limitLog'
	| 'operator'
	| 'matrix'
type Tool = { id: ToolId; icon: string }
type FractionStyle = 'normal' | 'small' | 'skewed'
type FractionChoice = {
	latex: string
	preview: string
	fraction?: { num: string; den: string; style?: FractionStyle }
}
type FractionFormatId = 'vertical' | 'horizontal' | 'skewed' | 'small'
type FractionFormat = FractionChoice & { id: FractionFormatId }
type CommonFraction = FractionChoice & { label: string }
type ScriptFormatId = 'sup' | 'sub' | 'both' | 'pre'
type ScriptFormat = { id: ScriptFormatId; preview: string }
type CommonScript = { label: string; latex: string; preview: string }
type RootFormatId = 'square' | 'nth' | 'squareIndex2' | 'cube'
type RootFormat = { id: RootFormatId; preview: string; index: string | null }
type CommonRoot = { label: string; latex: string; preview: string }
type IntegralFormatId =
	| 'int'
	| 'intSup'
	| 'intSubSup'
	| 'iint'
	| 'iintSup'
	| 'iintSubSup'
	| 'iiint'
	| 'iiintSup'
	| 'iiintSubSup'
type IntegralFormat = { id: IntegralFormatId; preview: string; sign: string; limits: 'none' | 'sup' | 'both' }

const toolbarRef = ref<HTMLElement>()
const fractionOpen = ref(false)
const scriptsOpen = ref(false)
const rootOpen = ref(false)
const integralOpen = ref(false)

/** 生成 HTML 分式预览，仅用于工具栏弹窗 */
const frac = (num: string, den: string, small = false) =>
	`<span class="math-frac${small ? ' math-frac--small' : ''}"><span class="math-frac__num">${num}</span><span class="math-frac__den">${den}</span></span>`

const fractionFormats: FractionFormat[] = [
	{
		id: 'vertical',
		latex: '\\frac{a}{b}',
		preview: frac('a', 'b'),
		fraction: { num: 'a', den: 'b' }
	},
	{ id: 'horizontal', latex: 'a/b', preview: 'a/b' },
	{
		id: 'skewed',
		latex: '{}^{a}\\!/\\!_{b}',
		preview: 'a⁄b',
		fraction: { num: 'a', den: 'b', style: 'skewed' }
	},
	{
		id: 'small',
		latex: '\\tfrac{a}{b}',
		preview: frac('a', 'b', true),
		fraction: { num: 'a', den: 'b', style: 'small' }
	}
]

const commonFractions: CommonFraction[] = [
	{ label: 'dy/dx', latex: '\\frac{dy}{dx}', preview: frac('dy', 'dx'), fraction: { num: 'dy', den: 'dx' } },
	{
		label: 'Δy/Δx',
		latex: '\\frac{\\Delta y}{\\Delta x}',
		preview: frac('Δy', 'Δx'),
		fraction: { num: 'Δy', den: 'Δx' }
	},
	{
		label: '∂y/∂x',
		latex: '\\frac{\\partial y}{\\partial x}',
		preview: frac('∂y', '∂x'),
		fraction: { num: '∂y', den: '∂x' }
	},
	{
		label: 'δy/δx',
		latex: '\\frac{\\delta y}{\\delta x}',
		preview: frac('δy', 'δx'),
		fraction: { num: 'δy', den: 'δx' }
	},
	{ label: 'π/2', latex: '\\frac{\\pi}{2}', preview: frac('π', '2'), fraction: { num: 'π', den: '2' } }
]

/** 生成上下标格式预览，仅用于工具栏弹窗 */
const scriptPreview = (sup: boolean, sub: boolean, pre = false) => {
	const stack = [
		sup ? '<span class="script-preview__slot"></span>' : '',
		sub ? '<span class="script-preview__slot"></span>' : ''
	].join('')
	return `<span class="script-preview${pre ? ' script-preview--pre' : ''}"><span class="script-preview__base">x</span><span class="script-preview__stack">${stack}</span></span>`
}

const scriptFormats: ScriptFormat[] = [
	{ id: 'sup', preview: scriptPreview(true, false) },
	{ id: 'sub', preview: scriptPreview(false, true) },
	{ id: 'both', preview: scriptPreview(true, true) },
	{ id: 'pre', preview: scriptPreview(true, true, true) }
]

const commonScripts: CommonScript[] = [
	{
		label: 'x_{y^2}',
		latex: 'x_{y^2}',
		preview: '<span class="script-tpl">x<sub>y<sup>2</sup></sub></span>'
	},
	{
		label: 'e^{-iωt}',
		latex: 'e^{-iωt}',
		preview: '<span class="script-tpl">e<sup>−iωt</sup></span>'
	},
	{
		label: 'x^2',
		latex: 'x^2',
		preview: '<span class="script-tpl">x<sup>2</sup></span>'
	},
	{
		label: '{}_{1}^{n}Y',
		latex: '{}_{1}^{n}Y',
		preview: '<span class="script-tpl"><span class="script-tpl__pre"><span>n</span><span>1</span></span>Y</span>'
	}
]

/**
 * 生成根式预览，仅用于工具栏弹窗。
 * dash 为虚线空槽，表示插入后可编辑的根指数 / 被开方数。
 */
const dashSlot = '<span class="math-dash"></span>'
const rootPreview = (radicand: string, index = '') =>
	`<span class="math-root">${index ? `<span class="math-root__index">${index}</span>` : ''}<span class="math-root__sign">√</span><span class="math-root__radicand">${radicand}</span></span>`

const rootFormats: RootFormat[] = [
	{ id: 'square', preview: rootPreview(dashSlot), index: null },
	{ id: 'nth', preview: rootPreview(dashSlot, dashSlot), index: '' },
	{ id: 'squareIndex2', preview: rootPreview(dashSlot, '2'), index: '2' },
	{ id: 'cube', preview: rootPreview(dashSlot, '3'), index: '3' }
]

/**
 * 生成积分预览，仅用于工具栏弹窗。
 * limits: none 无限界 / sup 仅上限 / both 上下限；网格布局把限界排到积分号右上、右下。
 */
const integralPreview = (sign: string, limits: 'none' | 'sup' | 'both') => {
	const sub = limits === 'both' ? `<span class="math-int__sub">${dashSlot}</span>` : ''
	const sup = limits !== 'none' ? `<span class="math-int__sup">${dashSlot}</span>` : ''
	return `<span class="math-int"><span class="math-int__sign">${sign}</span>${sub}${sup}<span class="math-int__integrand">${dashSlot}</span></span>`
}

const integralFormats: IntegralFormat[] = [
	{ id: 'int', sign: '∫', limits: 'none', preview: integralPreview('∫', 'none') },
	{ id: 'intSup', sign: '∫', limits: 'sup', preview: integralPreview('∫', 'sup') },
	{ id: 'intSubSup', sign: '∫', limits: 'both', preview: integralPreview('∫', 'both') },
	{ id: 'iint', sign: '∬', limits: 'none', preview: integralPreview('∬', 'none') },
	{ id: 'iintSup', sign: '∬', limits: 'sup', preview: integralPreview('∬', 'sup') },
	{ id: 'iintSubSup', sign: '∬', limits: 'both', preview: integralPreview('∬', 'both') },
	{ id: 'iiint', sign: '∭', limits: 'none', preview: integralPreview('∭', 'none') },
	{ id: 'iiintSup', sign: '∭', limits: 'sup', preview: integralPreview('∭', 'sup') },
	{ id: 'iiintSubSup', sign: '∭', limits: 'both', preview: integralPreview('∭', 'both') }
]

const commonRoots: CommonRoot[] = [
	{
		label: '(-b±√(b²-4ac))/2a',
		// 用 ± 这类 Unicode 符号而不是 \pm：可编辑区不解析未知命令，\pm 会被当成文本显示
		latex: '\\frac{-b±\\sqrt{b^{2}-4ac}}{2a}',
		preview: frac(`−b ± ${rootPreview('b² − 4ac')}`, '2a')
	},
	{
		label: '√(a²+b²)',
		latex: '\\sqrt{a^{2}+b^{2}}',
		preview: rootPreview('a² + b²')
	}
]

const symbols = [
	{ label: 'a/b', value: 'a/b' },
	{ label: '√x', value: '√x' },
	{ label: 'x²', value: 'x²' },
	{ label: 'lim', value: 'lim' },
	{ label: '∫', value: '∫' },
	{ label: 'Σ', value: 'Σ' },
	{ label: 'α', value: 'α' },
	{ label: 'π', value: 'π' },
	{ label: '∞', value: '∞' },
	{ label: '≤', value: '≤' },
	{ label: '≥', value: '≥' },
	{ label: '≠', value: '≠' }
]

/** 工具栏按钮；分数、上下标、根式已接入弹窗，其余暂未绑定行为 */
const tools: Tool[] = [
	{ id: 'symbols', icon: 'Ω' },
	{ id: 'fraction', icon: '<span class="tb-frac"><span>X</span><span>Y</span></span>' },
	{ id: 'scripts', icon: 'e<sup>x</sup>' },
	{ id: 'radical', icon: '√x' },
	{ id: 'integral', icon: '∫<sup>x</sup><sub>-x</sub>' },
	{
		id: 'largeOperator',
		icon: '<span class="tb-limits"><span class="tb-limits__sup">n</span><span class="tb-limits__main">∑</span><span class="tb-limits__sub">i=0</span></span>'
	},
	{ id: 'bracket', icon: '{()}' },
	{ id: 'function', icon: 'sinθ' },
	{ id: 'derivative', icon: 'f′' },
	{
		id: 'limitLog',
		icon: '<span class="tb-limits"><span class="tb-limits__sup">lim</span><span class="tb-limits__sub">n→∞</span></span>'
	},
	{ id: 'operator', icon: '±' },
	{
		id: 'matrix',
		icon: '<span class="tb-matrix"><span class="tb-matrix__bracket">[</span><span class="tb-matrix__grid"><i>1</i><i>0</i><i>0</i><i>1</i></span><span class="tb-matrix__bracket">]</span></span>'
	}
]

const symbolMap: Record<string, string> = {
	'*': '×',
	'-': '−',
	'/': '÷'
}

type ParsedNode =
	| { type: 'text'; value: string }
	| { type: 'fraction'; style: FractionStyle; numerator: ParsedNode[]; denominator: ParsedNode[] }
	| { type: 'script'; pre: boolean; sup: ParsedNode[] | null; sub: ParsedNode[] | null }
	| { type: 'root'; index: ParsedNode[] | null; radicand: ParsedNode[] }
	| { type: 'integral'; sign: string; sub: ParsedNode[] | null; sup: ParsedNode[] | null; integrand: ParsedNode[] }

const fractionCommands: { command: string; style: FractionStyle }[] = [
	{ command: '\\tfrac', style: 'small' },
	{ command: '\\frac', style: 'normal' }
]

/** 积分命令最长优先匹配，避免前缀误判 */
const integralCommands: { command: string; sign: string }[] = [
	{ command: '\\iiint', sign: '∭' },
	{ command: '\\iint', sign: '∬' },
	{ command: '\\int', sign: '∫' }
]

const readGroup = (source: string, start: number): { content: string; end: number } | null => {
	if (source[start] !== '{') return null
	let depth = 0
	for (let i = start; i < source.length; i++) {
		if (source[i] === '\\') {
			i++
			continue
		}
		if (source[i] === '{') depth++
		else if (source[i] === '}') {
			depth--
			if (depth === 0) return { content: source.slice(start + 1, i), end: i + 1 }
		}
	}
	return null
}

/** 跳过空白与负向细空格 \!，用于兼容斜式的不同写法 */
const skipSpacing = (source: string, start: number): number => {
	let cursor = start
	for (;;) {
		while (/\s/.test(source[cursor] ?? '')) cursor++
		if (source.startsWith('\\!', cursor)) {
			cursor += 2
			continue
		}
		return cursor
	}
}

/**
 * 解析斜式分式 `{}^{a}\!/\!_{b}`（也兼容 `{}^{a}/_{b}`）。
 * 结构：空组 + 上标分子 + 斜杠 + 下标分母。
 */
const readSkewedFraction = (
	source: string,
	start: number
): { numerator: string; denominator: string; end: number } | null => {
	if (!source.startsWith('{}^{', start)) return null
	const numerator = readGroup(source, start + 3)
	if (!numerator) return null
	let cursor = skipSpacing(source, numerator.end)
	if (source[cursor] !== '/') return null
	cursor = skipSpacing(source, cursor + 1)
	if (source[cursor] !== '_') return null
	cursor = skipSpacing(source, cursor + 1)
	const denominator = readGroup(source, cursor)
	if (!denominator) return null
	return { numerator: numerator.content, denominator: denominator.content, end: denominator.end }
}

/** 读取上下标参数：{...}、\command 或单个字符 */
const readScriptArgument = (source: string, start: number): { content: string; end: number } | null => {
	let cursor = start
	while (/\s/.test(source[cursor] ?? '')) cursor++
	if (source[cursor] === '{') return readGroup(source, cursor)
	if (source[cursor] === '\\') {
		const match = source.slice(cursor).match(/^\\[a-zA-Z]+/)
		if (match) return { content: match[0], end: cursor + match[0].length }
	}
	if (cursor < source.length) return { content: source[cursor], end: cursor + 1 }
	return null
}

/** 连续读取 ^{...} / _{...}，支持上下标同时存在 */
const readScriptParts = (
	source: string,
	start: number
): { sup: string | null; sub: string | null; end: number } | null => {
	let cursor = start
	let sup: string | null = null
	let sub: string | null = null
	let matched = false
	while (cursor < source.length && (source[cursor] === '^' || source[cursor] === '_')) {
		const marker = source[cursor]
		const argument = readScriptArgument(source, cursor + 1)
		if (!argument) break
		if (marker === '^') sup = argument.content
		else sub = argument.content
		cursor = argument.end
		matched = true
	}
	return matched ? { sup, sub, end: cursor } : null
}

/** 前置上下标：{}^{...} / {}_{...}，不消费后面的基底 */
const readPrescript = (
	source: string,
	start: number
): { sup: string | null; sub: string | null; end: number } | null => {
	if (source[start] !== '{' || source[start + 1] !== '}') return null
	const cursor = skipSpacing(source, start + 2)
	if (source[cursor] !== '^' && source[cursor] !== '_') return null
	return readScriptParts(source, cursor)
}

/**
 * 解析根式：`\sqrt{x}` / `\sqrt[n]{x}`（也兼容 `\sqrt x`、`\sqrt[n]x`）。
 * index 为 null 表示没有根指数，radicand 为被开方数。
 */
const readRoot = (
	source: string,
	start: number
): { index: string | null; radicand: string; end: number } | null => {
	if (!source.startsWith('\\sqrt', start)) return null
	let cursor = start + 5
	let index: string | null = null
	const bracketStart = skipSpacing(source, cursor)
	if (source[bracketStart] === '[') {
		const close = source.indexOf(']', bracketStart + 1)
		if (close === -1) return null
		index = source.slice(bracketStart + 1, close).trim()
		cursor = close + 1
	}
	const argument = readScriptArgument(source, cursor)
	if (!argument) return null
	return { index, radicand: argument.content, end: argument.end }
}

/**
 * 解析积分：`\int` / `\iint` / `\iiint`（兼容 `\limits`），
 * 限界用 `_{a}^{b}` 读取，被积函数取一个参数；结尾没有内容时被积函数为空。
 */
const readIntegral = (
	source: string,
	start: number
): { sign: string; sub: string | null; sup: string | null; integrand: string; end: number } | null => {
	const matched = integralCommands.find(({ command }) => source.startsWith(command, start))
	if (!matched) return null
	let cursor = start + matched.command.length
	if (source.startsWith('\\limits', cursor)) cursor += 7
	const parts = readScriptParts(source, cursor)
	let sub: string | null = null
	let sup: string | null = null
	if (parts) {
		sub = parts.sub
		sup = parts.sup
		cursor = parts.end
	}
	const argument = readScriptArgument(source, cursor)
	if (!argument) return { sign: matched.sign, sub, sup, integrand: '', end: cursor }
	return { sign: matched.sign, sub, sup, integrand: argument.content, end: argument.end }
}

/** 递归解析 \frac / \tfrac / 斜式 / 上下标 / 根式：子结构里的内容会继续结构化 */
const parseLatex = (source: string): ParsedNode[] => {
	const nodes: ParsedNode[] = []
	let buffer = ''
	let i = 0
	const flush = () => {
		if (buffer) {
			nodes.push({ type: 'text', value: buffer })
			buffer = ''
		}
	}
	while (i < source.length) {
		const skewed = readSkewedFraction(source, i)
		if (skewed) {
			flush()
			nodes.push({
				type: 'fraction',
				style: 'skewed',
				numerator: parseLatex(skewed.numerator),
				denominator: parseLatex(skewed.denominator)
			})
			i = skewed.end
			continue
		}
		const prescript = readPrescript(source, i)
		if (prescript) {
			flush()
			nodes.push({
				type: 'script',
				pre: true,
				sup: prescript.sup !== null ? parseLatex(prescript.sup) : null,
				sub: prescript.sub !== null ? parseLatex(prescript.sub) : null
			})
			i = prescript.end
			continue
		}
		if (source[i] === '^' || source[i] === '_') {
			const postscript = readScriptParts(source, i)
			if (postscript) {
				flush()
				nodes.push({
					type: 'script',
					pre: false,
					sup: postscript.sup !== null ? parseLatex(postscript.sup) : null,
					sub: postscript.sub !== null ? parseLatex(postscript.sub) : null
				})
				i = postscript.end
				continue
			}
		}
		const rootNode = readRoot(source, i)
		if (rootNode) {
			flush()
			nodes.push({
				type: 'root',
				index: rootNode.index !== null ? parseLatex(rootNode.index) : null,
				radicand: parseLatex(rootNode.radicand)
			})
			i = rootNode.end
			continue
		}
		const integralNode = readIntegral(source, i)
		if (integralNode) {
			flush()
			nodes.push({
				type: 'integral',
				sign: integralNode.sign,
				sub: integralNode.sub !== null ? parseLatex(integralNode.sub) : null,
				sup: integralNode.sup !== null ? parseLatex(integralNode.sup) : null,
				integrand: parseLatex(integralNode.integrand)
			})
			i = integralNode.end
			continue
		}
		const matched = fractionCommands.find(({ command }) => source.startsWith(command, i))
		if (matched) {
			let cursor = i + matched.command.length
			while (/\s/.test(source[cursor] ?? '')) cursor++
			const numerator = readGroup(source, cursor)
			if (numerator) {
				cursor = numerator.end
				while (/\s/.test(source[cursor] ?? '')) cursor++
				const denominator = readGroup(source, cursor)
				if (denominator) {
					flush()
					nodes.push({
						type: 'fraction',
						style: matched.style,
						numerator: parseLatex(numerator.content),
						denominator: parseLatex(denominator.content)
					})
					i = denominator.end
					continue
				}
			}
		}
		buffer += source[i]
		i++
	}
	flush()
	return nodes
}

const createTextSlot = (value: string): HTMLElement => {
	const slot = document.createElement('span')
	slot.className = 'me-text-slot'
	slot.contentEditable = 'true'
	slot.spellcheck = false
	slot.dataset.role = 'text'
	slot.setAttribute('role', 'textbox')
	slot.setAttribute('aria-label', t('formula.aria.text'))
	// 空槽放零宽空格：光标按文本基线定位，而不是落在元素边界上
	slot.textContent = value || '\u200b'
	return slot
}

const createFractionElement = (
	numerator: ParsedNode[],
	denominator: ParsedNode[],
	style: FractionStyle = 'normal'
): HTMLElement => {
	const fraction = document.createElement('span')
	fraction.className = style === 'normal' ? 'me-frac' : `me-frac me-frac--${style}`
	const num = document.createElement('span')
	num.className = 'me-frac__num'
	num.setAttribute('aria-label', t('formula.aria.numerator'))
	appendNodes(num, numerator)
	const den = document.createElement('span')
	den.className = 'me-frac__den'
	den.setAttribute('aria-label', t('formula.aria.denominator'))
	appendNodes(den, denominator)
	if (style === 'skewed') {
		const slash = document.createElement('span')
		slash.className = 'me-frac__slash'
		slash.textContent = '/'
		slash.setAttribute('aria-hidden', 'true')
		fraction.append(num, slash, den)
	} else {
		fraction.append(num, den)
	}
	return fraction
}

/** 创建上下标节点；pre 为前置上下标，sup / sub 为 null 表示该方向不存在 */
const createScriptElement = (
	pre: boolean,
	sup: ParsedNode[] | null,
	sub: ParsedNode[] | null
): HTMLElement => {
	const script = document.createElement('span')
	const classes = ['me-script']
	if (pre) classes.push('me-script--pre')
	if (sup && sub) classes.push('me-script--both')
	else if (sup) classes.push('me-script--sup')
	else classes.push('me-script--sub')
	script.className = classes.join(' ')
	if (sup) {
		const supEl = document.createElement('span')
		supEl.className = 'me-script__sup'
		supEl.setAttribute('aria-label', t('formula.aria.sup'))
		appendNodes(supEl, sup)
		script.append(supEl)
	}
	if (sub) {
		const subEl = document.createElement('span')
		subEl.className = 'me-script__sub'
		subEl.setAttribute('aria-label', t('formula.aria.sub'))
		appendNodes(subEl, sub)
		script.append(subEl)
	}
	return script
}

/** 创建根式节点；index 为 null 表示没有根指数 */
const createRootElement = (index: ParsedNode[] | null, radicand: ParsedNode[]): HTMLElement => {
	const rootNode = document.createElement('span')
	rootNode.className = 'me-root'
	if (index) {
		rootNode.classList.add('me-root--indexed')
		const indexEl = document.createElement('span')
		indexEl.className = 'me-root__index'
		indexEl.setAttribute('aria-label', t('formula.aria.rootIndex'))
		appendNodes(indexEl, index)
		rootNode.append(indexEl)
	}
	const sign = document.createElement('span')
	sign.className = 'me-root__sign'
	sign.textContent = '√'
	sign.setAttribute('aria-hidden', 'true')
	const radicandEl = document.createElement('span')
	radicandEl.className = 'me-root__radicand'
	radicandEl.setAttribute('aria-label', t('formula.aria.radicand'))
	appendNodes(radicandEl, radicand)
	rootNode.append(sign, radicandEl)
	return rootNode
}

/** 创建积分节点；sub / sup 为 null 表示没有对应限界，sign 存到 dataset 供序列化 */
const createIntegralElement = (
	sign: string,
	sub: ParsedNode[] | null,
	sup: ParsedNode[] | null,
	integrand: ParsedNode[]
): HTMLElement => {
	const integral = document.createElement('span')
	integral.className = 'me-int'
	integral.dataset.sign = sign
	if (sub) {
		const subEl = document.createElement('span')
		subEl.className = 'me-int__sub'
		subEl.setAttribute('aria-label', t('formula.aria.integralSub'))
		appendNodes(subEl, sub)
		integral.append(subEl)
	}
	if (sup) {
		const supEl = document.createElement('span')
		supEl.className = 'me-int__sup'
		supEl.setAttribute('aria-label', t('formula.aria.integralSup'))
		appendNodes(supEl, sup)
		integral.append(supEl)
	}
	const signEl = document.createElement('span')
	signEl.className = 'me-int__sign'
	signEl.textContent = sign
	signEl.setAttribute('aria-hidden', 'true')
	const integrandEl = document.createElement('span')
	integrandEl.className = 'me-int__integrand'
	integrandEl.setAttribute('aria-label', t('formula.aria.integrand'))
	appendNodes(integrandEl, integrand)
	integral.append(signEl, integrandEl)
	return integral
}

/** 把解析结果挂到容器上；空内容补一个空文本槽，保证光标有落点 */
const appendNodes = (container: HTMLElement, nodes: ParsedNode[]) => {
	if (!nodes.length) {
		container.append(createTextSlot(''))
		return
	}
	for (const node of nodes) {
		if (node.type === 'fraction') {
			container.append(createFractionElement(node.numerator, node.denominator, node.style))
		} else if (node.type === 'script') {
			container.append(createScriptElement(node.pre, node.sup, node.sub))
		} else if (node.type === 'root') {
			container.append(createRootElement(node.index, node.radicand))
		} else if (node.type === 'integral') {
			container.append(createIntegralElement(node.sign, node.sub, node.sup, node.integrand))
		} else {
			container.append(createTextSlot(node.value))
		}
	}
}

const renderEditor = (source: string) => {
	const root = editorRef.value
	if (!root) return
	root.replaceChildren()
	appendNodes(root, parseLatex(source))
	lastSerialized = source
}

/** 过滤空槽占位用的零宽空格 */
const stripPlaceholder = (value: string): string => value.replace(/\u200b/g, '')

/** 读取槽位文本，过滤空槽占位用的零宽空格 */
const readSlotText = (slot: HTMLElement): string => stripPlaceholder(slot.textContent ?? '')

const serializeNodes = (container: HTMLElement): string => {
	let result = ''
	let hasContent = false
	for (const child of Array.from(container.children) as HTMLElement[]) {
		if (child.classList.contains('me-script')) {
			const sup = child.querySelector(':scope > .me-script__sup') as HTMLElement | null
			const sub = child.querySelector(':scope > .me-script__sub') as HTMLElement | null
			const parts = `${sub ? `_{${serializeNodes(sub)}}` : ''}${sup ? `^{${serializeNodes(sup)}}` : ''}`
			const isPre = child.classList.contains('me-script--pre')
			// 后置上下标在容器开头时需要空基底，保证 LaTeX 合法
			result += `${isPre || !hasContent ? '{}' : ''}${parts}`
			hasContent = true
		} else if (child.classList.contains('me-frac')) {
			const num = child.querySelector(':scope > .me-frac__num') as HTMLElement | null
			const den = child.querySelector(':scope > .me-frac__den') as HTMLElement | null
			const numerator = num ? serializeNodes(num) : ''
			const denominator = den ? serializeNodes(den) : ''
			if (child.classList.contains('me-frac--skewed')) {
				result += `{}^{${numerator}}\\!/\\!_{${denominator}}`
			} else {
				const command = child.classList.contains('me-frac--small') ? '\\tfrac' : '\\frac'
				result += `${command}{${numerator}}{${denominator}}`
			}
			hasContent = true
		} else if (child.classList.contains('me-root')) {
			const indexEl = child.querySelector(':scope > .me-root__index') as HTMLElement | null
			const radicandEl = child.querySelector(':scope > .me-root__radicand') as HTMLElement | null
			const index = indexEl ? serializeNodes(indexEl) : ''
			const radicand = radicandEl ? serializeNodes(radicandEl) : ''
			result += index ? `\\sqrt[${index}]{${radicand}}` : `\\sqrt{${radicand}}`
			hasContent = true
		} else if (child.classList.contains('me-int')) {
			const sign = child.dataset.sign ?? '∫'
			const subEl = child.querySelector(':scope > .me-int__sub') as HTMLElement | null
			const supEl = child.querySelector(':scope > .me-int__sup') as HTMLElement | null
			const integrandEl = child.querySelector(':scope > .me-int__integrand') as HTMLElement | null
			const command = sign === '∭' ? '\\iiint' : sign === '∬' ? '\\iint' : '\\int'
			// 被积函数始终带花括号：空被积函数若省略花括号，后接文本会被解析吞掉（如 \intdx）
			const sub = subEl !== null ? `_{${serializeNodes(subEl)}}` : ''
			const sup = supEl !== null ? `^{${serializeNodes(supEl)}}` : ''
			result += `${command}${sub}${sup}{${integrandEl ? serializeNodes(integrandEl) : ''}}`
			hasContent = true
		} else if (child.classList.contains('me-text-slot')) {
			const value = readSlotText(child)
			if (value) {
				result += value
				hasContent = true
			}
		}
	}
	return result
}

const serializeEditor = (): string => {
	const root = editorRef.value
	return root ? serializeNodes(root) : ''
}

const syncFromEditor = () => {
	const next = serializeEditor()
	lastSerialized = next
	text.value = next
	error.value = ''
}

const onEditorInput = () => {
	syncFromEditor()
	ensurePlaceholder()
}

/** 槽位被删空后补回零宽空格，让光标贴合文本基线而不是落在元素边界 */
const ensurePlaceholder = () => {
	const info = getActiveSlot()
	if (!info) return
	const slot = info.slot
	if (slot.textContent !== '') return
	slot.textContent = '\u200b'
	lastFocusedSlot = slot
	const textNode = slot.firstChild
	if (!textNode) return
	const range = document.createRange()
	range.setStart(textNode, 0)
	range.collapse(true)
	const selection = window.getSelection()
	selection?.removeAllRanges()
	selection?.addRange(range)
}

const onEditorPaste = (event: ClipboardEvent) => {
	const plain = event.clipboardData?.getData('text/plain')
	if (plain == null) return
	event.preventDefault()
	// 公式是单行编辑，粘贴时去掉换行避免出现空行块
	insertTextAtCaret(plain.replace(/[\r\n]+/g, ''))
}

const focusSlot = (slot: HTMLElement | null, selectAll = false, position: 'start' | 'end' = 'end') => {
	if (!slot) return
	slot.focus()
	lastFocusedSlot = slot
	const range = document.createRange()
	if (selectAll) {
		range.selectNodeContents(slot)
	} else {
		const textNode = slot.firstChild
		if (textNode && textNode.nodeType === Node.TEXT_NODE) {
			const offset = position === 'start' ? 0 : (textNode.textContent ?? '').length
			range.setStart(textNode, offset)
			range.collapse(true)
		} else {
			range.setStart(slot, 0)
			range.collapse(true)
		}
	}
	const selection = window.getSelection()
	selection?.removeAllRanges()
	selection?.addRange(range)
}

type SlotRole =
	| 'num'
	| 'den'
	| 'sup'
	| 'sub'
	| 'rootIndex'
	| 'radicand'
	| 'integralSub'
	| 'integralSup'
	| 'integrand'
	| 'text'

type ActiveSlotInfo = {
	slot: HTMLElement
	fraction: HTMLElement | null
	script: HTMLElement | null
	rootNode: HTMLElement | null
	integral: HTMLElement | null
	role: SlotRole
	atStart: boolean
	atEnd: boolean
	collapsed: boolean
}

/** 根据文本槽的父容器判断它属于分子、分母、上标、下标、根指数、被开方数、积分限界/被积函数还是根级文本 */
const getSlotRole = (slot: HTMLElement): SlotRole => {
	const parent = slot.parentElement
	if (parent?.classList.contains('me-frac__num')) return 'num'
	if (parent?.classList.contains('me-frac__den')) return 'den'
	if (parent?.classList.contains('me-script__sup')) return 'sup'
	if (parent?.classList.contains('me-script__sub')) return 'sub'
	if (parent?.classList.contains('me-root__index')) return 'rootIndex'
	if (parent?.classList.contains('me-root__radicand')) return 'radicand'
	if (parent?.classList.contains('me-int__sub')) return 'integralSub'
	if (parent?.classList.contains('me-int__sup')) return 'integralSup'
	if (parent?.classList.contains('me-int__integrand')) return 'integrand'
	return 'text'
}

const getActiveSlot = (): ActiveSlotInfo | null => {
	const root = editorRef.value
	const selection = window.getSelection()
	if (!root || !selection || !selection.rangeCount) return null
	const range = selection.getRangeAt(0)
	const startAnchor =
		range.startContainer.nodeType === Node.ELEMENT_NODE
			? (range.startContainer as HTMLElement)
			: range.startContainer.parentElement
	const endAnchor =
		range.endContainer.nodeType === Node.ELEMENT_NODE
			? (range.endContainer as HTMLElement)
			: range.endContainer.parentElement
	const slot = (startAnchor?.closest('[contenteditable]') as HTMLElement | null) ?? null
	const endSlot = (endAnchor?.closest('[contenteditable]') as HTMLElement | null) ?? null
	if (!slot || !root.contains(slot) || slot !== endSlot) return null

	const before = range.cloneRange()
	before.selectNodeContents(slot)
	before.setEnd(range.startContainer, range.startOffset)
	const after = range.cloneRange()
	after.selectNodeContents(slot)
	after.setStart(range.endContainer, range.endOffset)

	return {
		slot,
		fraction: (slot.closest('.me-frac') as HTMLElement | null) ?? null,
		script: (slot.closest('.me-script') as HTMLElement | null) ?? null,
		rootNode: (slot.closest('.me-root') as HTMLElement | null) ?? null,
		integral: (slot.closest('.me-int') as HTMLElement | null) ?? null,
		role: getSlotRole(slot),
		atStart: stripPlaceholder(before.toString()).length === 0,
		atEnd: stripPlaceholder(after.toString()).length === 0,
		collapsed: selection.isCollapsed
	}
}

/** 取容器内最左/最右的可编辑槽位，分式/上下标会递归进入对应子容器 */
const getEdgeSlot = (container: HTMLElement, side: 'start' | 'end'): HTMLElement => {
	const children = Array.from(container.children) as HTMLElement[]
	const ordered = side === 'start' ? children : [...children].reverse()
	for (const child of ordered) {
		if (child.classList.contains('me-text-slot')) return child
		if (child.classList.contains('me-frac')) {
			const part = child.querySelector(
				side === 'start' ? ':scope > .me-frac__num' : ':scope > .me-frac__den'
			) as HTMLElement | null
			if (part) return getEdgeSlot(part, side)
		}
		if (child.classList.contains('me-script')) {
			const part = child.querySelector(
				side === 'start' ? ':scope > .me-script__sup' : ':scope > .me-script__sub'
			) as HTMLElement | null
			if (part) return getEdgeSlot(part, side)
			const fallback = child.querySelector(
				':scope > .me-script__sup, :scope > .me-script__sub'
			) as HTMLElement | null
			if (fallback) return getEdgeSlot(fallback, side)
		}
		if (child.classList.contains('me-root')) {
			const indexEl = child.querySelector(':scope > .me-root__index') as HTMLElement | null
			if (side === 'start' && indexEl) return getEdgeSlot(indexEl, side)
			const radicandEl = child.querySelector(':scope > .me-root__radicand') as HTMLElement | null
			if (radicandEl) return getEdgeSlot(radicandEl, side)
		}
		if (child.classList.contains('me-int')) {
			if (side === 'start') {
				const subEl = child.querySelector(':scope > .me-int__sub') as HTMLElement | null
				const supEl = child.querySelector(':scope > .me-int__sup') as HTMLElement | null
				const part = subEl ?? supEl
				if (part) return getEdgeSlot(part, side)
			}
			const integrandEl = child.querySelector(':scope > .me-int__integrand') as HTMLElement | null
			if (integrandEl) return getEdgeSlot(integrandEl, side)
		}
	}
	const slot = createTextSlot('')
	if (side === 'start') container.prepend(slot)
	else container.append(slot)
	return slot
}

/** 聚焦上下标节点内的槽位：优先上标，其次下标 */
const focusScriptSlot = (script: HTMLElement, prefer: 'sup' | 'sub' = 'sup', select = false): boolean => {
	const sup = script.querySelector(':scope > .me-script__sup') as HTMLElement | null
	const sub = script.querySelector(':scope > .me-script__sub') as HTMLElement | null
	const target = prefer === 'sub' ? (sub ?? sup) : (sup ?? sub)
	if (!target) return false
	focusSlot(getEdgeSlot(target, 'start'), select, 'start')
	return true
}

/** 聚焦根式节点内的槽位：优先根指数，其次被开方数 */
const focusRootSlot = (
	rootNode: HTMLElement,
	prefer: 'index' | 'radicand' = 'radicand',
	select = false
): boolean => {
	const indexEl = rootNode.querySelector(':scope > .me-root__index') as HTMLElement | null
	const radicandEl = rootNode.querySelector(':scope > .me-root__radicand') as HTMLElement | null
	const target = prefer === 'index' ? (indexEl ?? radicandEl) : (radicandEl ?? indexEl)
	if (!target) return false
	focusSlot(getEdgeSlot(target, 'start'), select, 'start')
	return true
}

/** 聚焦积分节点内的槽位：按 prefer 优先级选 sub / sup / integrand */
const focusIntegralSlot = (
	integral: HTMLElement,
	prefer: 'sub' | 'sup' | 'integrand' = 'integrand',
	select = false
): boolean => {
	const subEl = integral.querySelector(':scope > .me-int__sub') as HTMLElement | null
	const supEl = integral.querySelector(':scope > .me-int__sup') as HTMLElement | null
	const integrandEl = integral.querySelector(':scope > .me-int__integrand') as HTMLElement | null
	const pool: (HTMLElement | null)[] =
		prefer === 'sub'
			? [subEl, supEl, integrandEl]
			: prefer === 'sup'
				? [supEl, subEl, integrandEl]
				: [integrandEl, supEl, subEl]
	const target = pool.find(Boolean) ?? null
	if (!target) return false
	focusSlot(getEdgeSlot(target, 'start'), select, 'start')
	return true
}

/** 取容器内同级的文本槽（不进入嵌套分式），没有就在对应边缘创建一个 */
const ensureDirectTextSlot = (container: HTMLElement, side: 'start' | 'end'): HTMLElement => {
	const children = Array.from(container.children) as HTMLElement[]
	const edge = side === 'start' ? children[0] : children[children.length - 1]
	if (edge?.classList.contains('me-text-slot')) return edge
	const slot = createTextSlot('')
	if (side === 'start') container.prepend(slot)
	else container.append(slot)
	return slot
}

const isAtomElement = (element: HTMLElement): boolean =>
	element.classList.contains('me-frac') ||
	element.classList.contains('me-script') ||
	element.classList.contains('me-root') ||
	element.classList.contains('me-int')

/**
 * 在根级或分式的分子/分母容器内左右移动。
 * 公式在外部视为整体：从公式外按左右键会跨过整座公式，只有从公式内部向外移动时才落在它紧邻的位置。
 */
const moveSibling = (node: HTMLElement | null, direction: 'left' | 'right'): boolean => {
	const root = editorRef.value
	if (!root || !node) return false
	const parent = node.parentElement
	if (!parent) return false
	const isAtom = isAtomElement(node)

	const focusNumeratorEnd = (fraction: HTMLElement): boolean => {
		const numerator = fraction.querySelector(':scope > .me-frac__num') as HTMLElement | null
		if (!numerator) return false
		focusSlot(getEdgeSlot(numerator, 'end'), false, 'end')
		return true
	}

	const focusDenominatorStart = (fraction: HTMLElement): boolean => {
		const denominator = fraction.querySelector(':scope > .me-frac__den') as HTMLElement | null
		if (!denominator) return false
		focusSlot(getEdgeSlot(denominator, 'start'), false, 'start')
		return true
	}

	const focusRootIndexEnd = (rootNode: HTMLElement): boolean => {
		const indexEl = rootNode.querySelector(':scope > .me-root__index') as HTMLElement | null
		if (!indexEl) return false
		focusSlot(getEdgeSlot(indexEl, 'end'), false, 'end')
		return true
	}

	const focusRootRadicandStart = (rootNode: HTMLElement): boolean => {
		const radicandEl = rootNode.querySelector(':scope > .me-root__radicand') as HTMLElement | null
		if (!radicandEl) return false
		focusSlot(getEdgeSlot(radicandEl, 'start'), false, 'start')
		return true
	}

	const focusIntegralLimitsEnd = (integral: HTMLElement): boolean => {
		const supEl = integral.querySelector(':scope > .me-int__sup') as HTMLElement | null
		const subEl = integral.querySelector(':scope > .me-int__sub') as HTMLElement | null
		const target = supEl ?? subEl
		if (!target) return false
		focusSlot(getEdgeSlot(target, 'end'), false, 'end')
		return true
	}

	if (direction === 'left') {
		const previous = node.previousElementSibling as HTMLElement | null

		// 从公式内部向左跳出：落在公式左侧紧邻的位置
		if (isAtom) {
			if (previous?.classList.contains('me-text-slot')) {
				focusSlot(previous, false, 'end')
				return true
			}
			if (previous || parent === root) {
				const slot = createTextSlot('')
				node.before(slot)
				focusSlot(slot, false, 'end')
				return true
			}
			if (parent.classList.contains('me-frac__num') || parent.classList.contains('me-root__index')) {
				focusSlot(ensureDirectTextSlot(parent, 'start'), false, 'end')
				return true
			}
			if (parent.classList.contains('me-frac__den')) {
				return focusNumeratorEnd(parent.parentElement as HTMLElement)
			}
			if (parent.classList.contains('me-root__radicand')) {
				const rootNode = parent.parentElement as HTMLElement
				return focusRootIndexEnd(rootNode) || moveSibling(rootNode, 'left')
			}
			if (parent.classList.contains('me-int__integrand')) {
				const integral = parent.parentElement as HTMLElement
				return focusIntegralLimitsEnd(integral) || moveSibling(integral, 'left')
			}
			return moveSibling(parent.parentElement as HTMLElement, 'left')
		}

		// 已在公式外部：跨过相邻的整座公式，落到更左侧的文本槽
		let cursor = previous
		if (cursor) {
			while (cursor && isAtomElement(cursor)) {
				cursor = cursor.previousElementSibling as HTMLElement | null
			}
			if (cursor) {
				if (cursor.classList.contains('me-text-slot')) {
					focusSlot(cursor, false, 'end')
					return true
				}
				return false
			}
			if (parent === root) {
				const slot = createTextSlot('')
				parent.prepend(slot)
				focusSlot(slot, false, 'end')
				return true
			}
			if (parent.classList.contains('me-frac__num') || parent.classList.contains('me-root__index')) {
				focusSlot(ensureDirectTextSlot(parent, 'start'), false, 'end')
				return true
			}
			if (parent.classList.contains('me-frac__den')) {
				return focusNumeratorEnd(parent.parentElement as HTMLElement)
			}
			if (parent.classList.contains('me-root__radicand')) {
				const rootNode = parent.parentElement as HTMLElement
				return focusRootIndexEnd(rootNode) || moveSibling(rootNode, 'left')
			}
			if (parent.classList.contains('me-int__integrand')) {
				const integral = parent.parentElement as HTMLElement
				return focusIntegralLimitsEnd(integral) || moveSibling(integral, 'left')
			}
			return moveSibling(parent.parentElement as HTMLElement, 'left')
		}

	// 左侧没有节点
	if (parent === root) return false
	if (parent.classList.contains('me-frac__den')) {
		return focusNumeratorEnd(parent.parentElement as HTMLElement)
	}
	if (parent.classList.contains('me-root__radicand')) {
		const rootNode = parent.parentElement as HTMLElement
		return focusRootIndexEnd(rootNode) || moveSibling(rootNode, 'left')
	}
	if (parent.classList.contains('me-int__integrand')) {
		const integral = parent.parentElement as HTMLElement
		return focusIntegralLimitsEnd(integral) || moveSibling(integral, 'left')
	}
	return moveSibling(parent.parentElement as HTMLElement, 'left')
}

	const next = node.nextElementSibling as HTMLElement | null

	// 从公式内部向右跳出：落在公式右侧紧邻的位置
	if (isAtom) {
		if (next?.classList.contains('me-text-slot')) {
			focusSlot(next, false, 'start')
			return true
		}
		if (next || parent === root) {
			const slot = createTextSlot('')
			node.after(slot)
			focusSlot(slot, false, 'start')
			return true
		}
		if (parent.classList.contains('me-frac__num') || parent.classList.contains('me-root__index')) {
			focusSlot(ensureDirectTextSlot(parent, 'end'), false, 'start')
			return true
		}
		return moveSibling(parent.parentElement as HTMLElement, 'right')
	}

	// 已在公式外部：跨过相邻的整座公式，落到更右侧的文本槽
	let cursor = next
	if (cursor) {
		while (cursor && isAtomElement(cursor)) {
			cursor = cursor.nextElementSibling as HTMLElement | null
		}
		if (cursor) {
			if (cursor.classList.contains('me-text-slot')) {
				focusSlot(cursor, false, 'start')
				return true
			}
			return false
		}
		if (parent === root) {
			const slot = createTextSlot('')
			parent.append(slot)
			focusSlot(slot, false, 'start')
			return true
		}
		if (parent.classList.contains('me-frac__num') || parent.classList.contains('me-root__index')) {
			focusSlot(ensureDirectTextSlot(parent, 'end'), false, 'start')
			return true
		}
		return moveSibling(parent.parentElement as HTMLElement, 'right')
	}

	// 右侧没有节点
	if (parent === root) return false
	if (parent.classList.contains('me-frac__num')) {
		return focusDenominatorStart(parent.parentElement as HTMLElement)
	}
	if (parent.classList.contains('me-root__index')) {
		return focusRootRadicandStart(parent.parentElement as HTMLElement)
	}
	return moveSibling(parent.parentElement as HTMLElement, 'right')
}

const handleArrow = (key: string): boolean => {
	const info = getActiveSlot()
	if (!info || !info.collapsed) return false
	const { slot, fraction, role, atStart, atEnd } = info

	if (role === 'num' && fraction) {
		if (key === 'ArrowDown') {
			const denominator = fraction.querySelector(':scope > .me-frac__den') as HTMLElement | null
			focusSlot(denominator ? getEdgeSlot(denominator, 'start') : null, false, 'start')
			return Boolean(denominator)
		}
		if (key === 'ArrowRight' && atEnd) return moveSibling(slot, 'right')
		if (key === 'ArrowLeft' && atStart) return moveSibling(slot, 'left')
		if (key === 'ArrowUp') return moveSibling(fraction, 'left')
		return false
	}

	if (role === 'den' && fraction) {
		if (key === 'ArrowUp') {
			const numerator = fraction.querySelector(':scope > .me-frac__num') as HTMLElement | null
			focusSlot(numerator ? getEdgeSlot(numerator, 'end') : null, false, 'end')
			return Boolean(numerator)
		}
		if (key === 'ArrowLeft' && atStart) return moveSibling(slot, 'left')
		if (key === 'ArrowRight' && atEnd) return moveSibling(slot, 'right')
		if (key === 'ArrowDown') return moveSibling(fraction, 'right')
		return false
	}

	if ((role === 'rootIndex' || role === 'radicand') && info.rootNode) {
		if (role === 'rootIndex') {
			if (key === 'ArrowDown' || (key === 'ArrowRight' && atEnd)) {
				const radicandEl = info.rootNode.querySelector(
					':scope > .me-root__radicand'
				) as HTMLElement | null
				if (radicandEl) {
					focusSlot(getEdgeSlot(radicandEl, 'start'), false, 'start')
					return true
				}
			}
			if (key === 'ArrowUp') return moveSibling(info.rootNode, 'left')
			if (key === 'ArrowLeft' && atStart) return moveSibling(slot, 'left')
			return false
		}
		if (key === 'ArrowUp' || (key === 'ArrowLeft' && atStart)) {
			const indexEl = info.rootNode.querySelector(':scope > .me-root__index') as HTMLElement | null
			if (indexEl) {
				focusSlot(getEdgeSlot(indexEl, 'end'), false, 'end')
				return true
			}
			return moveSibling(info.rootNode, 'left')
		}
		if (key === 'ArrowDown') return moveSibling(info.rootNode, 'right')
		if (key === 'ArrowRight' && atEnd) return moveSibling(slot, 'right')
		return false
	}

	if ((role === 'sup' || role === 'sub') && info.script) {
		if (role === 'sup' && key === 'ArrowDown') {
			const sub = info.script.querySelector(':scope > .me-script__sub') as HTMLElement | null
			if (sub) {
				focusSlot(getEdgeSlot(sub, 'start'), false, 'start')
				return true
			}
		}
		if (role === 'sub' && key === 'ArrowUp') {
			const sup = info.script.querySelector(':scope > .me-script__sup') as HTMLElement | null
			if (sup) {
				focusSlot(getEdgeSlot(sup, 'end'), false, 'end')
				return true
			}
		}
		if (key === 'ArrowLeft' && atStart) return moveSibling(slot, 'left')
		if (key === 'ArrowRight' && atEnd) return moveSibling(slot, 'right')
		return false
	}

	if ((role === 'integralSub' || role === 'integralSup' || role === 'integrand') && info.integral) {
		const integral = info.integral
		const subEl = integral.querySelector(':scope > .me-int__sub') as HTMLElement | null
		const supEl = integral.querySelector(':scope > .me-int__sup') as HTMLElement | null
		const integrandEl = integral.querySelector(':scope > .me-int__integrand') as HTMLElement | null
		if (role === 'integralSub') {
			if (key === 'ArrowUp' && supEl) {
				focusSlot(getEdgeSlot(supEl, 'end'), false, 'end')
				return true
			}
			if (key === 'ArrowRight' && atEnd) {
				if (supEl) {
					focusSlot(getEdgeSlot(supEl, 'start'), false, 'start')
					return true
				}
				return moveSibling(slot, 'right')
			}
			if (key === 'ArrowDown' && integrandEl) {
				focusSlot(getEdgeSlot(integrandEl, 'start'), false, 'start')
				return true
			}
			if (key === 'ArrowLeft' && atStart) return moveSibling(slot, 'left')
			return false
		}
		if (role === 'integralSup') {
			if (key === 'ArrowDown') {
				if (subEl) {
					focusSlot(getEdgeSlot(subEl, 'start'), false, 'start')
					return true
				}
				if (integrandEl) {
					focusSlot(getEdgeSlot(integrandEl, 'start'), false, 'start')
					return true
				}
				return false
			}
			if (key === 'ArrowLeft' && atStart) {
				if (subEl) {
					focusSlot(getEdgeSlot(subEl, 'end'), false, 'end')
					return true
				}
				return moveSibling(slot, 'left')
			}
			if (key === 'ArrowRight' && atEnd && integrandEl) {
				focusSlot(getEdgeSlot(integrandEl, 'start'), false, 'start')
				return true
			}
			if (key === 'ArrowUp') return moveSibling(integral, 'left')
			return false
		}
		// 被积函数：↑/←开头回限界（优先上限），↓/→末尾跳出
		if (key === 'ArrowUp' || (key === 'ArrowLeft' && atStart)) {
			const target = supEl ?? subEl
			if (target) {
				focusSlot(getEdgeSlot(target, 'end'), false, 'end')
				return true
			}
			return moveSibling(integral, 'left')
		}
		if (key === 'ArrowDown') return moveSibling(integral, 'right')
		if (key === 'ArrowRight' && atEnd) return moveSibling(slot, 'right')
		return false
	}

	if (role === 'text') {
		if (key === 'ArrowLeft' && atStart) return moveSibling(slot, 'left')
		if (key === 'ArrowRight' && atEnd) return moveSibling(slot, 'right')
	}
	return false
}

/** 在分式旁找到或创建可落光标的文本槽，返回该槽位 */
const ensureAdjacentTextSlot = (reference: HTMLElement, side: 'before' | 'after'): HTMLElement => {
	const sibling = (
		side === 'before' ? reference.previousElementSibling : reference.nextElementSibling
	) as HTMLElement | null
	if (sibling?.classList.contains('me-text-slot')) return sibling
	const slot = createTextSlot('')
	if (side === 'before') reference.before(slot)
	else reference.after(slot)
	return slot
}

/** 删除整个分式 / 上下标节点，并把光标放到它前面或后面的文本槽 */
const removeAtomNode = (atom: HTMLElement, side: 'before' | 'after') => {
	const slot = ensureAdjacentTextSlot(atom, side)
	atom.remove()
	focusSlot(slot, false, side === 'before' ? 'end' : 'start')
	syncFromEditor()
}

/** 分式 / 上下标 / 根式本身不是 contenteditable，需要在槽位边界用退格 / Delete 整块删除 */
const handleDelete = (key: 'Backspace' | 'Delete'): boolean => {
	const info = getActiveSlot()
	if (!info || !info.collapsed) return false
	const { slot, fraction, script, rootNode, integral: integralEl, role, atStart, atEnd } = info

	if (role === 'num' && fraction && key === 'Backspace' && atStart) {
		removeAtomNode(fraction, 'before')
		return true
	}
	if (role === 'den' && fraction && key === 'Delete' && atEnd) {
		removeAtomNode(fraction, 'after')
		return true
	}
	if ((role === 'rootIndex' || role === 'radicand') && rootNode) {
		const hasIndex = Boolean(rootNode.querySelector(':scope > .me-root__index'))
		// 根指数开头或（无根指数时）被开方数开头按退格：整块删除
		if (key === 'Backspace' && atStart && (role === 'rootIndex' || !hasIndex)) {
			removeAtomNode(rootNode, 'before')
			return true
		}
		if (key === 'Delete' && atEnd && role === 'radicand') {
			removeAtomNode(rootNode, 'after')
			return true
		}
		return false
	}
	if ((role === 'integralSub' || role === 'integralSup' || role === 'integrand') && integralEl) {
		const hasLimits = Boolean(
			integralEl.querySelector(':scope > .me-int__sub, :scope > .me-int__sup')
		)
		// 限界开头退格整块删除；被积函数开头退格仅无限界时整块删除；被积函数末尾 Delete 整块删除
		if (
			key === 'Backspace' &&
			atStart &&
			((role === 'integralSub' || role === 'integralSup') || !hasLimits)
		) {
			removeAtomNode(integralEl, 'before')
			return true
		}
		if (key === 'Delete' && atEnd && role === 'integrand') {
			removeAtomNode(integralEl, 'after')
			return true
		}
		return false
	}
	if ((role === 'sup' || role === 'sub') && script) {
		if (key === 'Backspace' && atStart) {
			removeAtomNode(script, 'before')
			return true
		}
		if (key === 'Delete' && atEnd) {
			removeAtomNode(script, 'after')
			return true
		}
		return false
	}

	if (role === 'text') {
		if (key === 'Backspace' && atStart) {
			const previous = slot.previousElementSibling as HTMLElement | null
			if (previous?.matches('.me-frac, .me-script, .me-root, .me-int')) {
				previous.remove()
				focusSlot(slot, false, 'start')
				syncFromEditor()
				return true
			}
		}
		if (key === 'Delete' && atEnd) {
			const next = slot.nextElementSibling as HTMLElement | null
			if (next?.matches('.me-frac, .me-script, .me-root, .me-int')) {
				next.remove()
				focusSlot(slot, false, 'end')
				syncFromEditor()
				return true
			}
		}
	}
	return false
}

/** 点击编辑区空白处时，按点击位置决定光标落点，而不是固定跳到第一个槽位 */
const focusByPoint = (x: number) => {
	const root = editorRef.value
	if (!root) return
	const children = Array.from(root.children) as HTMLElement[]

	for (const child of children) {
		const rect = child.getBoundingClientRect()
		if (x < rect.left) {
			if (child.classList.contains('me-text-slot')) {
				focusSlot(child, false, 'start')
			} else {
				focusSlot(ensureAdjacentTextSlot(child, 'before'), false, 'end')
			}
			return
		}
		if (x <= rect.right) {
			if (child.classList.contains('me-text-slot')) {
				focusSlot(child, false, x < rect.left + rect.width / 2 ? 'start' : 'end')
			} else if (child.classList.contains('me-script')) {
				const part = child.querySelector(
					':scope > .me-script__sup, :scope > .me-script__sub'
				) as HTMLElement | null
				if (part) focusSlot(getEdgeSlot(part, 'start'), false, 'start')
			} else if (child.classList.contains('me-root')) {
				focusRootSlot(child, 'radicand')
			} else if (child.classList.contains('me-int')) {
				focusIntegralSlot(child, 'integrand')
			} else {
				const numerator = child.querySelector(':scope > .me-frac__num') as HTMLElement | null
				if (numerator) focusSlot(getEdgeSlot(numerator, 'end'), false, 'end')
			}
			return
		}
	}

	const last = children[children.length - 1]
	if (!last) {
		const slot = createTextSlot('')
		root.append(slot)
		focusSlot(slot)
		return
	}
	if (last.classList.contains('me-text-slot')) {
		focusSlot(last, false, 'end')
	} else {
		focusSlot(ensureAdjacentTextSlot(last, 'after'), false, 'start')
	}
}

const insertTextAtCaret = (value: string) => {
	const root = editorRef.value
	if (!root) return
	const selection = window.getSelection()
	const anchor =
		selection && selection.anchorNode
			? selection.anchorNode.nodeType === Node.ELEMENT_NODE
				? (selection.anchorNode as HTMLElement)
				: selection.anchorNode.parentElement
			: null
	const activeSlot = (anchor?.closest('[contenteditable]') as HTMLElement | null) ?? null

	if (selection && selection.rangeCount && activeSlot && root.contains(activeSlot)) {
		const range = selection.getRangeAt(0)
		range.deleteContents()
		const node = document.createTextNode(value)
		range.insertNode(node)
		range.setStartAfter(node)
		range.collapse(true)
		selection.removeAllRanges()
		selection.addRange(range)
	} else if (lastFocusedSlot && root.contains(lastFocusedSlot)) {
		lastFocusedSlot.textContent = (lastFocusedSlot.textContent ?? '') + value
		focusSlot(lastFocusedSlot)
	} else {
		const lastChild = root.lastElementChild
		let slot: HTMLElement
		if (lastChild?.classList.contains('me-text-slot')) {
			slot = lastChild as HTMLElement
		} else {
			slot = createTextSlot('')
			root.append(slot)
		}
		slot.textContent = (slot.textContent ?? '') + value
		focusSlot(slot)
	}
	syncFromEditor()
}

/** 把节点插入当前光标所在槽位：按光标切分文本槽，保留前后文本 */
const insertNodesAtCaret = (nodes: Node[]) => {
	const root = editorRef.value
	if (!root || !nodes.length) return
	const selection = window.getSelection()
	let slot: HTMLElement | null = null
	let range: Range | null = null

	if (selection?.rangeCount && selection.anchorNode) {
		const anchor =
			selection.anchorNode.nodeType === Node.ELEMENT_NODE
				? (selection.anchorNode as HTMLElement)
				: selection.anchorNode.parentElement
		const candidate = (anchor?.closest('[contenteditable]') as HTMLElement | null) ?? null
		if (candidate && root.contains(candidate)) {
			slot = candidate
			range = selection.getRangeAt(0)
		}
	}
	if (!slot && lastFocusedSlot && root.contains(lastFocusedSlot)) slot = lastFocusedSlot

	if (!slot) {
		root.append(...nodes)
		return
	}

	// 在当前槽位内部插入：分子/分母/上下标槽位会形成嵌套结构
	const hasRange = Boolean(
		range && slot.contains(range.startContainer) && slot.contains(range.endContainer)
	)
	// 选中内容时被新节点替换，避免留下空文本槽
	if (hasRange && range && !range.collapsed) range.deleteContents()
	const content = readSlotText(slot)
	let offset = content.length
	if (hasRange && range) {
		const beforeRange = range.cloneRange()
		beforeRange.selectNodeContents(slot)
		beforeRange.setEnd(range.startContainer, range.startOffset)
		offset = Math.min(stripPlaceholder(beforeRange.toString()).length, content.length)
	}
	const beforeValue = content.slice(0, offset)
	const afterValue = content.slice(offset)
	const parts: Node[] = []
	if (beforeValue) parts.push(createTextSlot(beforeValue))
	parts.push(...nodes)
	if (afterValue) parts.push(createTextSlot(afterValue))
	slot.replaceWith(...parts)
}

const insertFraction = (
	numerator: string,
	denominator: string,
	style: FractionStyle = 'normal'
) => {
	const fraction = createFractionElement(
		numerator ? [{ type: 'text', value: numerator }] : [],
		denominator ? [{ type: 'text', value: denominator }] : [],
		style
	)
	insertNodesAtCaret([fraction])
	syncFromEditor()
	const num = fraction.querySelector(':scope > .me-frac__num') as HTMLElement | null
	focusSlot(num ? getEdgeSlot(num, 'start') : null, true)
}

/** 插入上下标：以 x 为基底，按格式创建上标 / 下标 / 上下标 / 前置上下标 */
const insertScript = (format: ScriptFormatId) => {
	const script = createScriptElement(
		format === 'pre',
		format === 'sub' ? null : [],
		format === 'sup' ? null : []
	)
	const base = createTextSlot('x')
	insertNodesAtCaret(format === 'pre' ? [script, base] : [base, script])
	syncFromEditor()
	focusScriptSlot(script, format === 'sub' ? 'sub' : 'sup', true)
}

/** 插入根式：index 为 null 表示平方根，空字符串表示空的根指数槽 */
const insertRoot = (format: RootFormat) => {
	const hasIndex = format.index !== null
	const rootNode = createRootElement(
		hasIndex ? (format.index ? [{ type: 'text', value: format.index }] : []) : null,
		[]
	)
	insertNodesAtCaret([rootNode])
	syncFromEditor()
	focusRootSlot(rootNode, hasIndex ? 'index' : 'radicand', Boolean(format.index))
}

/** 插入积分：limits 决定限界槽位（none 仅被积函数 / sup 加上限 / both 加上下限） */
const insertIntegral = (format: IntegralFormat) => {
	const integral = createIntegralElement(
		format.sign,
		format.limits === 'both' ? [] : null,
		format.limits === 'none' ? null : [],
		[]
	)
	insertNodesAtCaret([integral])
	syncFromEditor()
	focusIntegralSlot(
		integral,
		format.limits === 'both' ? 'sub' : format.limits === 'sup' ? 'sup' : 'integrand'
	)
}

/** 聚焦插入节点中的第一个可编辑槽位（用于常用模板） */
const focusFirstEditable = (nodes: Node[]): boolean => {
	for (const node of nodes) {
		if (node.nodeType !== Node.ELEMENT_NODE) continue
		const element = node as HTMLElement
		const slot = element.matches('[contenteditable]')
			? element
			: (element.querySelector('[contenteditable]') as HTMLElement | null)
		if (slot) {
			focusSlot(slot, false, 'start')
			return true
		}
	}
	return false
}

const insertText = (value: string) => {
	insertTextAtCaret(value)
}

const onEditorKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Enter') {
		event.preventDefault()
		return
	}
	if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing && event.key.startsWith('Arrow')) {
		if (handleArrow(event.key)) {
			event.preventDefault()
			return
		}
	}
	if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
		if ((event.key === 'Backspace' || event.key === 'Delete') && handleDelete(event.key)) {
			event.preventDefault()
			return
		}
	}
	if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
	const mapped = symbolMap[event.key]
	if (!mapped) return
	event.preventDefault()
	insertTextAtCaret(mapped)
}

const onEditorClick = (event: MouseEvent) => {
	const root = editorRef.value
	if (!root) return
	const target = event.target as HTMLElement
	// 槽位自身负责光标定位
	if (target.closest('[contenteditable]')) return
	// 点在分子/分母、根指数/被开方数容器的留白上：落到该容器同级的文本槽（不进入嵌套结构）
	const part = target.closest(
		'.me-frac__num, .me-frac__den, .me-root__index, .me-root__radicand, .me-int__sub, .me-int__sup, .me-int__integrand'
	) as HTMLElement | null
	if (part) {
		const rect = part.getBoundingClientRect()
		const side = event.clientX < rect.left + rect.width / 2 ? 'start' : 'end'
		focusSlot(ensureDirectTextSlot(part, side), false, side)
		return
	}
	const fraction = target.closest('.me-frac') as HTMLElement | null
	if (fraction) {
		const numerator = fraction.querySelector(':scope > .me-frac__num') as HTMLElement | null
		focusSlot(numerator ? getEdgeSlot(numerator, 'end') : null, false, 'end')
		return
	}
	const script = target.closest('.me-script') as HTMLElement | null
	if (script) {
		focusScriptSlot(script)
		return
	}
	const rootNode = target.closest('.me-root') as HTMLElement | null
	if (rootNode) {
		focusRootSlot(rootNode, 'radicand')
		return
	}
	const integralNode = target.closest('.me-int') as HTMLElement | null
	if (integralNode) {
		focusIntegralSlot(integralNode, 'integrand')
		return
	}
	if (target !== root) return
	focusByPoint(event.clientX)
}

const onEditorFocusIn = (event: FocusEvent) => {
	const target = event.target as HTMLElement
	if (target.matches('[contenteditable]')) lastFocusedSlot = target
}

/** 失焦后清掉分子/分母里遗留的空槽，避免渲染出多余空白块 */
const onEditorFocusOut = (event: FocusEvent) => {
	const target = event.target as HTMLElement
	if (!target.matches('[contenteditable]')) return
	if (readSlotText(target)) return
	const parent = target.parentElement
	if (!parent || parent === editorRef.value) return
	if (!parent.classList.contains('me-frac__num') && !parent.classList.contains('me-frac__den')) return
	if (parent.children.length <= 1) return
	target.remove()
	syncFromEditor()
}

const focus = () => {
	const root = editorRef.value
	if (!root) return
	const slot =
		lastFocusedSlot && root.contains(lastFocusedSlot)
			? lastFocusedSlot
			: (root.querySelector('[contenteditable]') as HTMLElement | null)
	focusSlot(slot)
}

const clear = () => {
	renderEditor('')
	text.value = ''
	error.value = ''
	focus()
}

const onToolClick = (tool: Tool) => {
	if (tool.id === 'fraction') {
		fractionOpen.value = !fractionOpen.value
		scriptsOpen.value = false
		rootOpen.value = false
		integralOpen.value = false
		return
	}
	if (tool.id === 'scripts') {
		scriptsOpen.value = !scriptsOpen.value
		fractionOpen.value = false
		rootOpen.value = false
		integralOpen.value = false
		return
	}
	if (tool.id === 'radical') {
		rootOpen.value = !rootOpen.value
		fractionOpen.value = false
		scriptsOpen.value = false
		integralOpen.value = false
		return
	}
	if (tool.id === 'integral') {
		integralOpen.value = !integralOpen.value
		fractionOpen.value = false
		scriptsOpen.value = false
		rootOpen.value = false
		return
	}
	fractionOpen.value = false
	scriptsOpen.value = false
	rootOpen.value = false
	integralOpen.value = false
}

const pickFraction = (item: FractionChoice) => {
	fractionOpen.value = false
	if (item.fraction) {
		insertFraction(item.fraction.num, item.fraction.den, item.fraction.style)
	} else {
		insertTextAtCaret(item.latex)
	}
}

const pickScriptFormat = (item: ScriptFormat) => {
	scriptsOpen.value = false
	insertScript(item.id)
}

const pickCommonScript = (item: CommonScript) => {
	scriptsOpen.value = false
	const holder = document.createElement('span')
	appendNodes(holder, parseLatex(item.latex))
	const nodes = Array.from(holder.childNodes)
	const script = (Array.from(holder.children) as HTMLElement[]).find((el) =>
		el.classList.contains('me-script')
	)
	insertNodesAtCaret(nodes)
	syncFromEditor()
	if (script) focusScriptSlot(script)
}

const pickRootFormat = (item: RootFormat) => {
	rootOpen.value = false
	insertRoot(item)
}

const pickIntegralFormat = (item: IntegralFormat) => {
	integralOpen.value = false
	insertIntegral(item)
}

const pickCommonRoot = (item: CommonRoot) => {
	rootOpen.value = false
	const holder = document.createElement('span')
	appendNodes(holder, parseLatex(item.latex))
	const nodes = Array.from(holder.childNodes)
	insertNodesAtCaret(nodes)
	syncFromEditor()
	focusFirstEditable(nodes)
}

const onDocumentClick = (event: MouseEvent) => {
	if (!fractionOpen.value && !scriptsOpen.value && !rootOpen.value && !integralOpen.value) return
	if (toolbarRef.value?.contains(event.target as Node)) return
	fractionOpen.value = false
	scriptsOpen.value = false
	rootOpen.value = false
	integralOpen.value = false
}

onMounted(() => {
	renderEditor(props.modelValue ?? '')
	document.addEventListener('click', onDocumentClick)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

/** 校验输入，空内容时在组件内显示错误 */
const validate = () => {
	if (!text.value.trim()) {
		error.value = t('formula.emptyError')
		return false
	}
	error.value = ''
	return true
}

watch(
	() => props.modelValue,
	(value) => {
		error.value = ''
		const next = value ?? ''
		if (next === lastSerialized) return
		renderEditor(next)
	}
)

// 槽位是命令式创建的，切换语言时同步更新其 aria-label
watch(locale, () => {
	const root = editorRef.value
	if (!root) return
	root.querySelectorAll('.me-text-slot').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.text'))
	})
	root.querySelectorAll('.me-frac__num').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.numerator'))
	})
	root.querySelectorAll('.me-frac__den').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.denominator'))
	})
	root.querySelectorAll('.me-script__sup').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.sup'))
	})
	root.querySelectorAll('.me-script__sub').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.sub'))
	})
	root.querySelectorAll('.me-root__index').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.rootIndex'))
	})
	root.querySelectorAll('.me-root__radicand').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.radicand'))
	})
	root.querySelectorAll('.me-int__sub').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.integralSub'))
	})
	root.querySelectorAll('.me-int__sup').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.integralSup'))
	})
	root.querySelectorAll('.me-int__integrand').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.integrand'))
	})
})

defineExpose({ focus, validate, clear })
</script>

<style scoped>
.he-formula-toolbar-wrap {
	position: relative;
	margin-bottom: 12px;
	padding-bottom: 8px;
	border-bottom: 1px solid #eef0f3;
}

.he-formula-toolbar {
	display: flex;
	align-items: center;
	gap: 0;
	overflow-x: auto;
	scrollbar-width: none;
}

.he-formula-toolbar::-webkit-scrollbar {
	height: 0;
}

.he-formula-toolbar__item {
	flex: none;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	min-width: 54px;
	padding: 3px 2px;
	border: none;
	border-radius: 6px;
	background: transparent;
	color: #333;
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}

.he-formula-toolbar__item:hover {
	background: #eef3ff;
	color: #3b6ef5;
}

.he-formula-toolbar__icon {
	height: 26px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
	line-height: 1;
}

.he-formula-toolbar__label {
	display: flex;
	align-items: center;
	gap: 1px;
	font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
	font-size: 10px;
	line-height: 1.2;
	color: #666;
	white-space: nowrap;
}

.he-formula-toolbar__item:hover .he-formula-toolbar__label {
	color: #3b6ef5;
}

.he-formula-toolbar__chevron {
	font-size: 7px;
	line-height: 1;
	color: #aaa;
}

.he-formula-toolbar__icon :deep(sup),
.he-formula-toolbar__icon :deep(sub) {
	font-size: 0.55em;
	line-height: 0;
}

.he-formula-toolbar__icon :deep(.tb-frac) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	font-size: 13px;
	line-height: 1;
}

.he-formula-toolbar__icon :deep(.tb-frac span:first-child) {
	padding: 0 3px 1px;
	border-bottom: 1px solid currentColor;
}

.he-formula-toolbar__icon :deep(.tb-frac span:last-child) {
	padding-top: 1px;
}

.he-formula-toolbar__icon :deep(.tb-limits) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	line-height: 1;
}

.he-formula-toolbar__icon :deep(.tb-limits__sup),
.he-formula-toolbar__icon :deep(.tb-limits__sub) {
	font-size: 8px;
	line-height: 1.1;
}

.he-formula-toolbar__icon :deep(.tb-limits__main) {
	font-size: 18px;
	line-height: 1;
}

.he-formula-toolbar__icon :deep(.tb-matrix) {
	display: inline-flex;
	align-items: center;
	gap: 1px;
}

.he-formula-toolbar__icon :deep(.tb-matrix__bracket) {
	font-size: 22px;
	font-weight: 300;
	line-height: 1;
}

.he-formula-toolbar__icon :deep(.tb-matrix__grid) {
	display: inline-grid;
	grid-template-columns: repeat(2, 7px);
	grid-template-rows: repeat(2, 8px);
	gap: 1px;
	font-size: 8px;
	line-height: 1;
	text-align: center;
}

.he-formula-toolbar__icon :deep(.tb-matrix__grid i) {
	font-style: normal;
}

.he-tool-popover {
	position: absolute;
	top: calc(100% + 4px);
	left: 0;
	z-index: 40;
	width: 420px;
	max-width: calc(100vw - 40px);
	background: #fff;
	border: 1px solid #e3e8ef;
	border-radius: 8px;
	box-shadow: 0 12px 32px rgba(31, 35, 41, 0.16);
	overflow: hidden;
}

.he-tool-popover__header {
	padding: 8px 14px;
	border-bottom: 1px solid #eef0f3;
	font-size: 13px;
	font-weight: 600;
	color: #1f2329;
}

.he-tool-popover__body {
	padding: 10px 14px 12px;
}

.he-tool-popover__grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 8px;
}

/* 常用根式一行两张宽卡片 */
.he-tool-popover__grid--half {
	grid-template-columns: repeat(2, 1fr);
}

/* 积分格式 3×3 网格 */
.he-tool-popover__grid--thirds {
	grid-template-columns: repeat(3, 1fr);
}

.he-tool-popover__section {
	margin: 8px 0 6px;
	font-size: 12px;
	color: #666;
}

.he-tool-card {
	height: 68px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	border: 1px solid #d9dde3;
	border-radius: 4px;
	background: #fff;
	color: #333;
	cursor: pointer;
	transition: border-color 0.15s, background 0.15s;
}

.he-tool-card:hover {
	border-color: #3b6ef5;
	background: #f7f9ff;
}

/* 根式格式卡片更高，留出根号与空槽的展示空间 */
.he-tool-card--tall {
	height: 104px;
}

.he-tool-card--wide {
	height: 84px;
}

.he-tool-card__preview {
	font-size: 17px;
	line-height: 1.1;
}

.he-tool-card__preview :deep(.math-frac) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	line-height: 1.1;
}

.he-tool-card__preview :deep(.math-frac__num) {
	padding: 0 4px 2px;
	border-bottom: 1px solid currentColor;
}

.he-tool-card__preview :deep(.math-frac__den) {
	padding-top: 2px;
}

.he-tool-card__preview :deep(.math-frac--small) {
	font-size: 0.7em;
}

/* 根式预览：根号 + 上方横线 + 可选的根指数 */
.he-tool-card__preview :deep(.math-root) {
	display: inline-flex;
	align-items: stretch;
	line-height: 1.1;
}

.he-tool-card__preview :deep(.math-root__index) {
	align-self: flex-start;
	margin-right: -0.2em;
	padding-top: 2px;
	font-size: 0.55em;
	line-height: 1;
}

.he-tool-card__preview :deep(.math-root__sign) {
	align-self: stretch;
	display: inline-flex;
	align-items: flex-end;
	font-size: 1.25em;
	line-height: 0.9;
}

.he-tool-card__preview :deep(.math-root__radicand) {
	display: inline-flex;
	align-items: center;
	min-width: 18px;
	padding: 0 2px;
	border-top: 1px solid currentColor;
}

/* 虚线空槽：表示插入后可编辑的位置 */
.he-tool-card__preview :deep(.math-dash) {
	flex: none;
	width: 14px;
	height: 12px;
	border: 1px dashed #b9c0cc;
	border-radius: 2px;
}

/* 积分预览：积分号 + 右上上限/右下下限 + 被积函数空槽，网格区域布局 */
.he-tool-card__preview :deep(.math-int) {
	display: inline-grid;
	grid-template-areas:
		'sign sup integrand'
		'sign sub integrand';
	align-items: center;
	column-gap: 3px;
	line-height: 1.1;
}

.he-tool-card__preview :deep(.math-int__sign) {
	grid-area: sign;
	font-size: 1.6em;
	line-height: 0.9;
}

.he-tool-card__preview :deep(.math-int__sup) {
	grid-area: sup;
	align-self: end;
	padding-bottom: 1px;
	font-size: 0.55em;
	line-height: 1;
}

.he-tool-card__preview :deep(.math-int__sub) {
	grid-area: sub;
	align-self: start;
	padding-top: 1px;
	font-size: 0.55em;
	line-height: 1;
}

.he-tool-card__preview :deep(.math-int__integrand) {
	grid-area: integrand;
	display: inline-flex;
	align-items: center;
}

/* 上下标格式卡片：空白框表示待输入的上标 / 下标 */
.he-tool-card__preview :deep(.script-preview) {
	display: inline-flex;
	align-items: center;
	line-height: 1;
}

.he-tool-card__preview :deep(.script-preview--pre) {
	flex-direction: row-reverse;
}

.he-tool-card__preview :deep(.script-preview__stack) {
	display: inline-flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 3px;
	margin-left: 3px;
	font-size: 0.62em;
}

.he-tool-card__preview :deep(.script-preview--pre .script-preview__stack) {
	margin-left: 0;
	margin-right: 3px;
}

.he-tool-card__preview :deep(.script-preview__slot) {
	width: 13px;
	height: 10px;
	border: 1px dashed #b9c0cc;
	border-radius: 2px;
}

/* 常用上下标模板预览 */
.he-tool-card__preview :deep(.script-tpl sup),
.he-tool-card__preview :deep(.script-tpl sub) {
	font-size: 0.62em;
	line-height: 0;
}

.he-tool-card__preview :deep(.script-tpl__pre) {
	display: inline-flex;
	flex-direction: column;
	align-items: flex-start;
	margin-right: 1px;
	font-size: 0.62em;
	line-height: 1.1;
	vertical-align: middle;
}

.he-field-label {
	font-size: 12px;
	font-weight: 600;
	color: #555;
	margin-bottom: 6px;
}

.he-field-label--gap {
	margin-top: 14px;
}

.he-formula-editor__row {
	display: flex;
	align-items: center;
	gap: 8px;
}

.he-formula-source {
	width: 100%;
	box-sizing: border-box;
	padding: 8px 10px;
	border: 1px solid #e3e8ef;
	border-radius: 6px;
	background: #f5f7fa;
	font-family: Consolas, monospace;
	font-size: 12px;
	color: #555;
	word-break: break-all;
	line-height: 1.6;
	min-height: 38px;
	resize: vertical;
	outline: none;
	transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.he-formula-source:focus {
	border-color: #3b6ef5;
	background: #fff;
	box-shadow: 0 0 0 3px rgba(59, 110, 245, 0.12);
}

.he-formula-editable {
	flex: 1;
	min-width: 0;
	min-height: 64px;
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 6px 12px;
	border: 1px solid #e3e8ef;
	border-radius: 8px;
	background: #fafbfc;
	color: #1f2329;
	font-size: 28px;
	line-height: 1.4;
	cursor: text;
	outline: none;
	overflow-x: auto;
	transition: border-color 0.15s, box-shadow 0.15s;
}

.he-formula-editable:focus-within {
	border-color: #3b6ef5;
	box-shadow: 0 0 0 3px rgba(59, 110, 245, 0.12);
}

.he-formula-editable.is-empty::before {
	content: attr(data-placeholder);
	font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
	font-size: 13px;
	color: #bbb;
	pointer-events: none;
}

.he-formula-editable :deep(.me-text-slot) {
	display: inline-block;
	min-width: 4px;
	outline: none;
	white-space: pre;
	caret-color: #3b6ef5;
}

.he-formula-editable :deep(.me-text-slot:empty::before),
.he-formula-editable :deep(.me-frac .me-text-slot:empty::before) {
	content: '\200b';
}

.he-formula-editable :deep(.me-frac) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	margin: 0 2px;
	font-size: 0.62em;
	line-height: 1.1;
	vertical-align: middle;
}

.he-formula-editable :deep(.me-frac--small) {
	font-size: 0.5em;
}

.he-formula-editable :deep(.me-frac--skewed) {
	flex-direction: row;
	align-items: center;
	padding: 0.3em 0;
	font-size: 0.8em;
	line-height: 1.1;
}

.he-formula-editable :deep(.me-frac--skewed .me-frac__num) {
	min-width: 0;
	padding-bottom: 0;
	border-bottom: none;
	transform: translateY(-0.32em);
}

.he-formula-editable :deep(.me-frac--skewed .me-frac__den) {
	min-width: 0;
	padding-top: 0;
	transform: translateY(0.32em);
}

.he-formula-editable :deep(.me-frac__slash) {
	padding: 0 1px;
	color: #444;
}

/* 嵌套分式按父级比例逐层缩小，避免 0.62^3 过小 */
.he-formula-editable :deep(.me-frac .me-frac) {
	font-size: 0.82em;
}

.he-formula-editable :deep(.me-frac .me-frac--small) {
	font-size: 0.55em;
}

.he-formula-editable :deep(.me-frac__num),
.he-formula-editable :deep(.me-frac__den) {
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 18px;
	padding: 0 2px;
	text-align: center;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-frac__num) {
	padding-bottom: 1px;
	border-bottom: 1px solid currentColor;
}

.he-formula-editable :deep(.me-frac__den) {
	padding-top: 1px;
}

.he-formula-editable :deep(.me-frac__num:focus-within),
.he-formula-editable :deep(.me-frac__den:focus-within) {
	background: #eef3ff;
}

.he-formula-editable :deep(.me-script) {
	display: inline-flex;
	flex-direction: column;
	align-items: flex-start;
	margin: 0 1px;
	font-size: 0.62em;
	line-height: 1.05;
	vertical-align: middle;
}

.he-formula-editable :deep(.me-script--sup) {
	transform: translateY(-0.45em);
}

.he-formula-editable :deep(.me-script--sub) {
	transform: translateY(0.45em);
}

.he-formula-editable :deep(.me-script__sup),
.he-formula-editable :deep(.me-script__sub) {
	display: flex;
	align-items: center;
	min-width: 10px;
	padding: 0 1px;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-script__sup:focus-within),
.he-formula-editable :deep(.me-script__sub:focus-within) {
	background: #eef3ff;
}

/* 上下标里的嵌套上下标逐层缩小 */
.he-formula-editable :deep(.me-script .me-script) {
	font-size: 0.82em;
}

.he-formula-editable :deep(.me-root) {
	display: inline-flex;
	align-items: stretch;
	margin: 0 2px;
	vertical-align: middle;
}

.he-formula-editable :deep(.me-root__index) {
	align-self: flex-start;
	display: inline-flex;
	align-items: center;
	min-width: 8px;
	margin-right: -0.18em;
	padding-top: 0.1em;
	font-size: 0.5em;
	line-height: 1;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-root__sign) {
	align-self: stretch;
	display: inline-flex;
	align-items: flex-end;
	padding-right: 1px;
	font-size: 1.2em;
	line-height: 0.9;
}

.he-formula-editable :deep(.me-root__radicand) {
	display: flex;
	align-items: center;
	min-width: 14px;
	padding: 0 2px 0 1px;
	border-top: 1px solid currentColor;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-root__index:focus-within),
.he-formula-editable :deep(.me-root__radicand:focus-within) {
	background: #eef3ff;
}

/* 根式里的嵌套结构逐层缩小 */
.he-formula-editable :deep(.me-root .me-root) {
	font-size: 0.82em;
}

.he-formula-editable :deep(.me-int) {
	display: inline-grid;
	grid-template-areas:
		'sign sup integrand'
		'sign sub integrand';
	align-items: center;
	column-gap: 2px;
	margin: 0 2px;
	vertical-align: middle;
}

.he-formula-editable :deep(.me-int__sign) {
	grid-area: sign;
	font-size: 1.5em;
	line-height: 0.9;
}

.he-formula-editable :deep(.me-int__sup),
.he-formula-editable :deep(.me-int__sub) {
	display: inline-flex;
	align-items: center;
	min-width: 10px;
	padding: 0 1px;
	font-size: 0.55em;
	line-height: 1.1;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-int__sup) {
	grid-area: sup;
	align-self: end;
}

.he-formula-editable :deep(.me-int__sub) {
	grid-area: sub;
	align-self: start;
}

.he-formula-editable :deep(.me-int__integrand) {
	grid-area: integrand;
	display: flex;
	align-items: center;
	min-width: 14px;
	padding: 0 1px;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-int__sup:focus-within),
.he-formula-editable :deep(.me-int__sub:focus-within),
.he-formula-editable :deep(.me-int__integrand:focus-within) {
	background: #eef3ff;
}

/* 积分里的嵌套结构逐层缩小 */
.he-formula-editable :deep(.me-int .me-int) {
	font-size: 0.82em;
}

.he-formula-editor__clear {
	flex: none;
	height: 36px;
	padding: 0 14px;
	border: 1px solid #d9dde3;
	border-radius: 8px;
	background: #fff;
	font-size: 13px;
	color: #444;
	cursor: pointer;
	transition: background 0.15s;
}

.he-formula-editor__clear:hover {
	background: #f5f7fa;
}

.he-display-toggle {
	margin-left: 12px;
	font-size: 12px;
	font-weight: 400;
	color: #666;
	cursor: pointer;
}

.he-display-toggle input {
	margin-right: 4px;
	vertical-align: -1px;
}

.he-symbols {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.he-sym {
	border: 1px solid #d9dde3;
	background: #fff;
	border-radius: 6px;
	padding: 4px 10px;
	font-size: 13px;
	color: #333;
	cursor: pointer;
	transition: all 0.15s;
}

.he-sym:hover {
	border-color: #3b6ef5;
	color: #3b6ef5;
	background: #eef3ff;
}

.he-error {
	margin-top: 8px;
	font-size: 12px;
	color: #f56c6c;
}
</style>
