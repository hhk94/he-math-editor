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
				class="he-fraction-popover"
				role="dialog"
				:aria-label="t('formula.fraction.panelTitle')"
			>
				<div class="he-fraction-popover__header">{{ t('formula.fraction.panelTitle') }}</div>
				<div class="he-fraction-popover__body">
					<div class="he-fraction-popover__grid">
						<button
							v-for="item in fractionFormats"
							:key="item.id"
							class="he-fraction-card"
							type="button"
							:title="`${t('formula.fraction.' + item.id)} ${item.latex}`"
							@mousedown.prevent
							@click="pickFraction(item)"
						>
							<span class="he-fraction-card__preview he-math-font" v-html="item.preview"></span>
						</button>
					</div>
					<div class="he-fraction-popover__section">{{ t('formula.fraction.commonTitle') }}</div>
					<div class="he-fraction-popover__grid">
						<button
							v-for="item in commonFractions"
							:key="item.label"
							class="he-fraction-card"
							type="button"
							:title="item.label"
							@mousedown.prevent
							@click="pickFraction(item)"
						>
							<span class="he-fraction-card__preview he-math-font" v-html="item.preview"></span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<div class="he-field-label">{{ t('formula.latexSource') }}</div>
		<div class="he-formula-source">{{ text || t('formula.empty') }}</div>

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

const toolbarRef = ref<HTMLElement>()
const fractionOpen = ref(false)

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

/** 工具栏按钮；分数按钮已接入弹窗，其余暂未绑定行为 */
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

const fractionCommands: { command: string; style: FractionStyle }[] = [
	{ command: '\\tfrac', style: 'small' },
	{ command: '\\frac', style: 'normal' }
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

/** 递归解析 \frac / \tfrac / 斜式：分子、分母里的分式会继续结构化，因此支持连分式嵌套 */
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

/** 把解析结果挂到容器上；空内容补一个空文本槽，保证光标有落点 */
const appendNodes = (container: HTMLElement, nodes: ParsedNode[]) => {
	if (!nodes.length) {
		container.append(createTextSlot(''))
		return
	}
	for (const node of nodes) {
		container.append(
			node.type === 'fraction'
				? createFractionElement(node.numerator, node.denominator, node.style)
				: createTextSlot(node.value)
		)
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
	for (const child of Array.from(container.children) as HTMLElement[]) {
		if (child.classList.contains('me-frac')) {
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
		} else if (child.classList.contains('me-text-slot')) {
			result += readSlotText(child)
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

type ActiveSlotInfo = {
	slot: HTMLElement
	fraction: HTMLElement | null
	role: 'num' | 'den' | 'text'
	atStart: boolean
	atEnd: boolean
	collapsed: boolean
}

/** 根据文本槽的父容器判断它属于分子、分母还是根级文本 */
const getSlotRole = (slot: HTMLElement): 'num' | 'den' | 'text' => {
	const parent = slot.parentElement
	if (parent?.classList.contains('me-frac__num')) return 'num'
	if (parent?.classList.contains('me-frac__den')) return 'den'
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
		role: getSlotRole(slot),
		atStart: stripPlaceholder(before.toString()).length === 0,
		atEnd: stripPlaceholder(after.toString()).length === 0,
		collapsed: selection.isCollapsed
	}
}

/** 取容器内最左/最右的可编辑槽位，分式会递归进入分子或分母 */
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
	}
	const slot = createTextSlot('')
	if (side === 'start') container.prepend(slot)
	else container.append(slot)
	return slot
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

/**
 * 在根级或分式的分子/分母容器内左右移动。
 * 公式在外部视为整体：从公式外按左右键会跨过整座公式，只有从公式内部向外移动时才落在它紧邻的位置。
 */
const moveSibling = (node: HTMLElement | null, direction: 'left' | 'right'): boolean => {
	const root = editorRef.value
	if (!root || !node) return false
	const parent = node.parentElement
	if (!parent) return false
	const isFraction = node.classList.contains('me-frac')

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

	if (direction === 'left') {
		const previous = node.previousElementSibling as HTMLElement | null

		// 从公式内部向左跳出：落在公式左侧紧邻的位置
		if (isFraction) {
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
			if (parent.classList.contains('me-frac__num')) {
				focusSlot(ensureDirectTextSlot(parent, 'start'), false, 'end')
				return true
			}
			if (parent.classList.contains('me-frac__den')) {
				return focusNumeratorEnd(parent.parentElement as HTMLElement)
			}
			return moveSibling(parent.parentElement as HTMLElement, 'left')
		}

		// 已在公式外部：跨过相邻的整座公式，落到更左侧的文本槽
		let cursor = previous
		if (cursor) {
			while (cursor && cursor.classList.contains('me-frac')) {
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
			if (parent.classList.contains('me-frac__num')) {
				focusSlot(ensureDirectTextSlot(parent, 'start'), false, 'end')
				return true
			}
			if (parent.classList.contains('me-frac__den')) {
				return focusNumeratorEnd(parent.parentElement as HTMLElement)
			}
			return moveSibling(parent.parentElement as HTMLElement, 'left')
		}

		// 左侧没有节点
		if (parent === root) return false
		if (parent.classList.contains('me-frac__den')) {
			return focusNumeratorEnd(parent.parentElement as HTMLElement)
		}
		return moveSibling(parent.parentElement as HTMLElement, 'left')
	}

	const next = node.nextElementSibling as HTMLElement | null

	// 从公式内部向右跳出：落在公式右侧紧邻的位置
	if (isFraction) {
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
		if (parent.classList.contains('me-frac__num')) {
			focusSlot(ensureDirectTextSlot(parent, 'end'), false, 'start')
			return true
		}
		return moveSibling(parent.parentElement as HTMLElement, 'right')
	}

	// 已在公式外部：跨过相邻的整座公式，落到更右侧的文本槽
	let cursor = next
	if (cursor) {
		while (cursor && cursor.classList.contains('me-frac')) {
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
		if (parent.classList.contains('me-frac__num')) {
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

/** 删除整个分式节点，并把光标放到它前面或后面的文本槽 */
const removeFractionNode = (fraction: HTMLElement, side: 'before' | 'after') => {
	const slot = ensureAdjacentTextSlot(fraction, side)
	fraction.remove()
	focusSlot(slot, false, side === 'before' ? 'end' : 'start')
	syncFromEditor()
}

/** 分式本身不是 contenteditable，需要在槽位边界用退格 / Delete 删除整个分式 */
const handleDelete = (key: 'Backspace' | 'Delete'): boolean => {
	const info = getActiveSlot()
	if (!info || !info.collapsed) return false
	const { slot, fraction, role, atStart, atEnd } = info

	if (role === 'num' && fraction && key === 'Backspace' && atStart) {
		removeFractionNode(fraction, 'before')
		return true
	}
	if (role === 'den' && fraction && key === 'Delete' && atEnd) {
		removeFractionNode(fraction, 'after')
		return true
	}

	if (role === 'text') {
		if (key === 'Backspace' && atStart) {
			const previous = slot.previousElementSibling as HTMLElement | null
			if (previous?.classList.contains('me-frac')) {
				previous.remove()
				focusSlot(slot, false, 'start')
				syncFromEditor()
				return true
			}
		}
		if (key === 'Delete' && atEnd) {
			const next = slot.nextElementSibling as HTMLElement | null
			if (next?.classList.contains('me-frac')) {
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

const insertFraction = (
	numerator: string,
	denominator: string,
	style: FractionStyle = 'normal'
) => {
	const root = editorRef.value
	if (!root) return
	const fraction = createFractionElement(
		numerator ? [{ type: 'text', value: numerator }] : [],
		denominator ? [{ type: 'text', value: denominator }] : [],
		style
	)
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

	if (slot) {
		// 在当前槽位内部插入：分子/分母槽位会形成嵌套分式
		const hasRange = Boolean(
			range && slot.contains(range.startContainer) && slot.contains(range.endContainer)
		)
		// 选中内容时被新分式替换，避免留下空文本槽
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
		const nodes: Node[] = []
		if (beforeValue) nodes.push(createTextSlot(beforeValue))
		nodes.push(fraction)
		if (afterValue) nodes.push(createTextSlot(afterValue))
		slot.replaceWith(...nodes)
	} else {
		root.append(fraction)
	}

	syncFromEditor()
	const num = fraction.querySelector(':scope > .me-frac__num') as HTMLElement | null
	focusSlot(num ? getEdgeSlot(num, 'start') : null, true)
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
	// 点在分子/分母容器的留白上：落到该容器同级的文本槽（不进入嵌套分式）
	const part = target.closest('.me-frac__num, .me-frac__den') as HTMLElement | null
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
		return
	}
	fractionOpen.value = false
}

const pickFraction = (item: FractionChoice) => {
	fractionOpen.value = false
	if (item.fraction) {
		insertFraction(item.fraction.num, item.fraction.den, item.fraction.style)
	} else {
		insertTextAtCaret(item.latex)
	}
}

const onDocumentClick = (event: MouseEvent) => {
	if (!fractionOpen.value) return
	if (toolbarRef.value?.contains(event.target as Node)) return
	fractionOpen.value = false
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

.he-fraction-popover {
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

.he-fraction-popover__header {
	padding: 8px 14px;
	border-bottom: 1px solid #eef0f3;
	font-size: 13px;
	font-weight: 600;
	color: #1f2329;
}

.he-fraction-popover__body {
	padding: 10px 14px 12px;
}

.he-fraction-popover__grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 8px;
}

.he-fraction-popover__section {
	margin: 8px 0 6px;
	font-size: 12px;
	color: #666;
}

.he-fraction-card {
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

.he-fraction-card:hover {
	border-color: #3b6ef5;
	background: #f7f9ff;
}

.he-fraction-card__preview {
	font-size: 17px;
	line-height: 1.1;
}

.he-fraction-card__preview :deep(.math-frac) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	line-height: 1.1;
}

.he-fraction-card__preview :deep(.math-frac__num) {
	padding: 0 4px 2px;
	border-bottom: 1px solid currentColor;
}

.he-fraction-card__preview :deep(.math-frac__den) {
	padding-top: 2px;
}

.he-fraction-card__preview :deep(.math-frac--small) {
	font-size: 0.7em;
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
	padding: 8px 10px;
	border-radius: 6px;
	background: #f5f7fa;
	font-family: Consolas, monospace;
	font-size: 12px;
	color: #555;
	word-break: break-all;
	white-space: pre-wrap;
	min-height: 20px;
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
