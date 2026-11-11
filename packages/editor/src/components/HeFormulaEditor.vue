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
				v-if="activeTool === 'fraction'"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.fraction.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.fraction.panelTitle') }}</div>
				<div class="he-tool-popover__body">
					<div class="he-tool-popover__grid">
						<ToolCard
							v-for="item in fractionFormats"
							:key="item.id"
							:title="`${t('formula.fraction.' + item.id)} ${item.latex}`"
							:html="item.preview"
							@pick="pickFraction(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.fraction.commonTitle') }}</div>
					<div class="he-tool-popover__grid">
						<ToolCard
							v-for="item in commonFractions"
							:key="item.label"
							:title="item.label"
							:html="item.preview"
							@pick="pickFraction(item)"
						/>
					</div>
				</div>
			</div>

			<div
				v-if="activeTool === 'scripts'"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.script.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.script.panelTitle') }}</div>
				<div class="he-tool-popover__body">
					<div class="he-tool-popover__grid">
						<ToolCard
							v-for="item in scriptFormats"
							:key="item.id"
							:title="t('formula.script.' + item.id)"
							:html="item.preview"
							@pick="pickScriptFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.script.commonTitle') }}</div>
					<div class="he-tool-popover__grid">
						<ToolCard
							v-for="item in commonScripts"
							:key="item.label"
							:title="item.label"
							:html="item.preview"
							@pick="pickCommonScript(item)"
						/>
					</div>
				</div>
			</div>

			<div
				v-if="activeTool === 'radical'"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.root.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.root.panelTitle') }}</div>
				<div class="he-tool-popover__body">
					<div class="he-tool-popover__grid">
						<ToolCard
							v-for="item in rootFormats"
							:key="item.id"
							:title="t('formula.root.' + item.id)"
							:html="item.preview"
							:tall="true"
							@pick="pickRootFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.root.commonTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--half">
						<ToolCard
							v-for="item in commonRoots"
							:key="item.label"
							:title="item.label"
							:html="item.preview"
							:wide="true"
							@pick="pickCommonRoot(item)"
						/>
					</div>
				</div>
			</div>

			<div
				v-if="activeTool === 'integral'"
				class="he-tool-popover he-tool-popover--wide"
				role="dialog"
				:aria-label="t('formula.integral.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.integral.panelTitle') }}</div>
				<div class="he-tool-popover__body">
					<div class="he-tool-popover__body--columns">
					<div class="he-tool-popover__col">
						<div class="he-tool-popover__section">{{ t('formula.integral.panelTitle') }}</div>
						<div class="he-tool-popover__grid he-tool-popover__grid--thirds">
							<ToolCard
								v-for="item in integralFormats"
								:key="item.id"
								:title="t('formula.integral.' + item.id)"
								:html="item.preview"
								:tall="true"
								@pick="pickIntegralFormat(item)"
							/>
						</div>
					</div>
					<div class="he-tool-popover__col">
						<div class="he-tool-popover__section">{{ t('formula.integral.contourPanelTitle') }}</div>
						<div class="he-tool-popover__grid he-tool-popover__grid--thirds">
							<ToolCard
								v-for="item in contourFormats"
								:key="item.id"
								:title="t('formula.integral.' + item.id)"
								:html="item.preview"
								:tall="true"
								@pick="pickIntegralFormat(item)"
							/>
						</div>
					</div>
				</div>
				<div class="he-tool-popover__section">{{ t('formula.integral.differentialPanelTitle') }}</div>
				<div class="he-tool-popover__grid he-tool-popover__grid--thirds">
					<ToolCard
						v-for="item in differentialFormats"
						:key="item.id"
						:title="t('formula.integral.' + item.id)"
						:text="item.latex"
						:tall="true"
						@pick="pickDifferentialFormat(item)"
					/>
				</div>
			</div>
			</div>

			<div
				v-if="activeTool === 'largeOperator'"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.bigOperator.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.bigOperator.panelTitle') }}</div>
				<div class="he-tool-popover__body">
					<div class="he-tool-popover__section">{{ t('formula.bigOperator.summationTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--fifths">
						<ToolCard
							v-for="item in sumFormats"
							:key="item.id"
							:title="t('formula.bigOperator.' + item.id)"
							:html="item.preview"
							:tall="true"
							@pick="pickBigOpFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.bigOperator.productCoproductTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--fifths">
						<ToolCard
							v-for="item in productFormats"
							:key="item.id"
							:title="t('formula.bigOperator.' + item.id)"
							:html="item.preview"
							:tall="true"
							@pick="pickBigOpFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.bigOperator.unionIntersectionTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--fifths">
						<ToolCard
							v-for="item in unionFormats"
							:key="item.id"
							:title="t('formula.bigOperator.' + item.id)"
							:html="item.preview"
							:tall="true"
							@pick="pickBigOpFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.bigOperator.otherTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--fifths">
						<ToolCard
							v-for="item in otherFormats"
							:key="item.id"
							:title="t('formula.bigOperator.' + item.id)"
							:html="item.preview"
							:tall="true"
							@pick="pickBigOpFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.bigOperator.commonTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--thirds">
						<ToolCard
							v-for="item in commonBigOps"
							:key="item.id"
							:title="t('formula.bigOperator.' + item.id)"
							:html="item.preview"
							:wide="true"
							@pick="pickCommonBigOp(item)"
						/>
					</div>
				</div>
			</div>

			<div
				v-if="activeTool === 'bracket'"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.bracket.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.bracket.panelTitle') }}</div>
				<div class="he-tool-popover__body he-tool-popover__body--scroll">
					<div class="he-tool-popover__grid he-tool-popover__grid--quarters">
						<ToolCard
							v-for="item in bracketFormats"
							:key="item.id"
							:title="t('formula.bracket.' + item.id)"
							:html="item.preview"
							@pick="pickBracket(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.bracket.separatorTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--quarters">
						<ToolCard
							v-for="item in separatorBracketFormats"
							:key="item.id"
							:title="t('formula.bracket.' + item.id)"
							:html="item.preview"
							@pick="pickSeparatorBracket(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.bracket.singleTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--quarters">
						<ToolCard
							v-for="item in singleBracketFormats"
							:key="item.id"
							:title="t('formula.bracket.' + item.id)"
							:html="item.preview"
							@pick="pickBracket(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.bracket.casesTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--quarters">
						<ToolCard
							v-for="item in stackFormats"
							:key="item.id"
							:title="t('formula.bracket.' + item.id)"
							:html="item.preview"
							:tall="true"
							@pick="pickStackFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.bracket.commonTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--thirds">
						<ToolCard
							v-for="item in commonBracketFormulas"
							:key="item.id"
							:title="t('formula.bracket.' + item.id)"
							:html="item.preview"
							:wide="true"
							@pick="pickCommonBracket(item)"
						/>
					</div>
				</div>
			</div>

			<div
				v-if="activeTool === 'function'"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.function.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.function.panelTitle') }}</div>
				<div class="he-tool-popover__body he-tool-popover__body--scroll">
					<div class="he-tool-popover__section">{{ t('formula.function.trigTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--thirds">
						<ToolCard
							v-for="item in functionFormats"
							:key="item.id"
							:title="t('formula.function.' + item.id)"
							:html="item.preview"
							@pick="pickFunctionFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.function.inverseTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--thirds">
						<ToolCard
							v-for="item in inverseFunctionFormats"
							:key="item.id"
							:title="t('formula.function.' + item.id)"
							:html="item.preview"
							@pick="pickFunctionFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.function.hyperbolicTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--thirds">
						<ToolCard
							v-for="item in hyperbolicFunctionFormats"
							:key="item.id"
							:title="t('formula.function.' + item.id)"
							:html="item.preview"
							@pick="pickFunctionFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.function.inverseHyperbolicTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--thirds">
						<ToolCard
							v-for="item in inverseHyperbolicFunctionFormats"
							:key="item.id"
							:title="t('formula.function.' + item.id)"
							:html="item.preview"
							@pick="pickFunctionFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.function.commonTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--half">
						<ToolCard
							v-for="item in commonFunctions"
							:key="item.id"
							:title="t('formula.function.' + item.id)"
							:html="item.preview"
							:wide="item.wide"
							:span2="item.wide"
							@pick="pickCommonFunction(item)"
						/>
					</div>
				</div>
			</div>

			<div
				v-if="activeTool === 'derivative'"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.deriv.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.deriv.panelTitle') }}</div>
				<div class="he-tool-popover__body he-tool-popover__body--scroll">
					<div class="he-tool-popover__grid he-tool-popover__grid--quarters">
						<ToolCard
							v-for="item in derivFormats"
							:key="item.id"
							:title="t('formula.deriv.' + item.id)"
							:html="item.preview"
							@pick="pickDerivFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.deriv.boxedTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--quarters">
						<ToolCard
							v-for="item in derivBoxedFormats"
							:key="item.id"
							:title="t('formula.deriv.' + item.id)"
							:html="item.preview"
							:span2="item.wide"
							@pick="pickDerivFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.deriv.lineTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--quarters">
						<ToolCard
							v-for="item in derivLineFormats"
							:key="item.id"
							:title="t('formula.deriv.' + item.id)"
							:html="item.preview"
							@pick="pickDerivFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.deriv.objectTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--quarters">
						<ToolCard
							v-for="item in derivObjectFormats"
							:key="item.id"
							:title="t('formula.deriv.' + item.id)"
							:html="item.preview"
							:span2="item.wide"
							@pick="pickDerivFormat(item)"
						/>
					</div>
				</div>
			</div>

			<div
				v-if="activeTool === 'limitLog'"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.limitLog.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.limitLog.panelTitle') }}</div>
				<div class="he-tool-popover__body">
					<div class="he-tool-popover__section">{{ t('formula.limitLog.basicTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--thirds">
						<ToolCard
							v-for="item in limitLogFormats"
							:key="item.id"
							:title="t('formula.limitLog.' + item.id)"
							:html="item.preview"
							@pick="pickLimitLogFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.limitLog.commonTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--half">
						<ToolCard
							v-for="item in commonLimitLogs"
							:key="item.id"
							:title="t('formula.limitLog.' + item.id)"
							:html="item.preview"
							@pick="pickCommonLimitLog(item)"
						/>
					</div>
				</div>
			</div>

			<div
				v-if="activeTool === 'operator'"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.operator.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.operator.panelTitle') }}</div>
				<div class="he-tool-popover__body he-tool-popover__body--scroll">
					<div class="he-tool-popover__section">{{ t('formula.operator.basicTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--quarters">
						<ToolCard
							v-for="item in operatorFormats"
							:key="item.id"
							:title="t('formula.operator.' + item.id)"
							:html="item.preview"
							@pick="pickOperatorFormat(item)"
						/>
					</div>
					<div class="he-tool-popover__section">{{ t('formula.operator.structureTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--quarters">
						<ToolCard
							v-for="item in arrowFormats"
							:key="item.id"
							:title="t('formula.operator.' + item.id)"
							:html="arrowPreview(item.kind, item.label)"
							:math-font="false"
							:tall="true"
							@pick="pickArrowFormat(item)"
						/>
					</div>
				</div>
			</div>

			<div
				v-if="activeTool === 'matrix'"
				class="he-tool-popover"
				role="dialog"
				:aria-label="t('formula.matrix.panelTitle')"
			>
				<div class="he-tool-popover__header">{{ t('formula.matrix.panelTitle') }}</div>
				<div class="he-tool-popover__body">
					<div class="he-tool-popover__section">{{ t('formula.matrix.emptyTitle') }}</div>
					<div class="he-tool-popover__grid he-tool-popover__grid--quarters">
						<ToolCard
							v-for="item in matrixFormats"
							:key="item.id"
							:title="t('formula.matrix.' + item.id)"
							:html="item.preview"
							:math-font="false"
							:tall="true"
							@pick="pickMatrixFormat(item)"
						/>
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
import ToolCard from './toolbar/ToolCard.vue'
import type {
	ArrowFormat,
	BigOpFormat,
	BracketFormat,
	CommonBigOp,
	CommonBracketFormula,
	CommonFunction,
	CommonRoot,
	CommonScript,
	DerivFormat,
	DifferentialFormat,
	FractionChoice,
	FractionStyle,
	FunctionFormat,
	FunctionFormatId,
	IntegralFormat,
	MatrixFormat,
	OperatorFormat,
	RootFormat,
	ScriptFormat,
	ScriptFormatId,
	SeparatorBracketFormat,
	StackFormat,
	Tool,
	ToolId
} from './toolbar/catalog'
import {
	arrowFormats,
	arrowPreview,
	bracketFormatById,
	bracketFormats,
	commonBigOps,
	commonBracketFormulas,
	commonFractions,
	commonFunctions,
	commonLimitLogs,
	commonRoots,
	commonScripts,
	contourFormats,
	derivBoxedFormats,
	derivFormats,
	derivLineFormats,
	derivObjectFormats,
	differentialFormats,
	fractionFormats,
	functionFormats,
	hyperbolicFunctionFormats,
	inverseFunctionFormats,
	inverseHyperbolicFunctionFormats,
	integralFormats,
	limitLogFormats,
	matrixFormats,
	operatorFormats,
	otherFormats,
	popoverToolIds,
	productFormats,
	rootFormats,
	scriptFormats,
	separatorBracketFormats,
	singleBracketFormats,
	stackFormats,
	sumFormats,
	symbolMap,
	symbols,
	tools,
	unionFormats
} from './toolbar/catalog'
import { functionCommandById } from './formula/commands'
import { bigOpAriaKey, bigOpSignOf, getBracketContents, getMatrixCells, getStackRows, readSlotText, stripPlaceholder } from './formula/dom'
import { parseLatex } from './formula/parser'
import { createFormulaRenderer } from './formula/renderer'
import { serializeNodes } from './formula/serializer'
import type { ParsedNode } from './formula/types'

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

const toolbarRef = ref<HTMLElement>()
const activeTool = ref<ToolId | null>(null)

const {
	createTextSlot,
	createFractionElement,
	createScriptElement,
	createRootElement,
	createIntegralElement,
	createBigOpElement,
	createFunctionElement,
	createDerivElement,
	createOpElement,
	createArrowElement,
	createBracketElement,
	createStackElement,
	createMatrixElement,
	appendNodes,
	renderInto
} = createFormulaRenderer((key) => t(key))

const renderEditor = (source: string) => {
	const root = editorRef.value
	if (!root) return
	root.replaceChildren()
	renderInto(root, source)
	lastSerialized = source
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
	| 'bigopSub'
	| 'bigopSup'
	| 'bigopOperand'
	| 'bracketContent'
	| 'stackRow'
	| 'matrixCell'
	| 'funcSub'
	| 'funcArg'
	| 'derivArg'
	| 'derivLabel'
	| 'opTop'
	| 'arrowAbove'
	| 'arrowBelow'
	| 'text'

type ActiveSlotInfo = {
	slot: HTMLElement
	fraction: HTMLElement | null
	script: HTMLElement | null
	rootNode: HTMLElement | null
	integral: HTMLElement | null
	bigop: HTMLElement | null
	bracket: HTMLElement | null
	/** 光标所在的内容段序号与总段数（带分隔符的括号按段切分，普通括号恒为 0 / 1） */
	bracketGroup: number
	bracketGroups: number
	stack: HTMLElement | null
	/** 光标所在的堆栈行序号与总行数 */
	stackRow: number
	stackRows: number
	matrix: HTMLElement | null
	/** 光标所在的矩阵单元格（跨格导航的基准格） */
	matrixCellEl: HTMLElement | null
	/** 光标所在矩阵单元格的行 / 列序号与总行 / 总列数 */
	matrixRow: number
	matrixRows: number
	matrixCol: number
	matrixCols: number
	func: HTMLElement | null
	deriv: HTMLElement | null
	op: HTMLElement | null
	arrow: HTMLElement | null
	role: SlotRole
	atStart: boolean
	atEnd: boolean
	collapsed: boolean
}

/** 文本槽父容器类名 → 槽位角色：渲染、导航与删除共用同一份声明 */
const SLOT_ROLE_BY_CLASS: Record<string, SlotRole> = {
	'me-frac__num': 'num',
	'me-frac__den': 'den',
	'me-script__sup': 'sup',
	'me-script__sub': 'sub',
	'me-root__index': 'rootIndex',
	'me-root__radicand': 'radicand',
	'me-int__sub': 'integralSub',
	'me-int__sup': 'integralSup',
	'me-int__integrand': 'integrand',
	'me-bigop__sub': 'bigopSub',
	'me-bigop__sup': 'bigopSup',
	'me-bigop__operand': 'bigopOperand',
	'me-bracket__content': 'bracketContent',
	'me-stack__row': 'stackRow',
	'me-matrix__cell': 'matrixCell',
	'me-func__sub': 'funcSub',
	'me-func__arg': 'funcArg',
	'me-deriv__arg': 'derivArg',
	'me-deriv__label': 'derivLabel',
	'me-op__top': 'opTop',
	'me-arrow__above': 'arrowAbove',
	'me-arrow__below': 'arrowBelow'
}

/** 根据文本槽的父容器判断它属于分子、分母、上标、下标、根指数、被开方数、积分限界/被积函数还是根级文本 */
const getSlotRole = (slot: HTMLElement): SlotRole => {
	const parent = slot.parentElement
	if (!parent) return 'text'
	for (const className of Array.from(parent.classList)) {
		const role = SLOT_ROLE_BY_CLASS[className]
		if (role) return role
	}
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

	const bracketEl = (slot.closest('.me-bracket') as HTMLElement | null) ?? null
	const contents = bracketEl ? getBracketContents(bracketEl) : []
	const groupIndex = contents.findIndex((el) => el.contains(slot))
	const stackEl = (slot.closest('.me-stack') as HTMLElement | null) ?? null
	const stackRows = stackEl ? getStackRows(stackEl) : []
	const stackRowIndex = stackRows.findIndex((el) => el.contains(slot))
	const matrixEl = (slot.closest('.me-matrix') as HTMLElement | null) ?? null
	const matrixCells = matrixEl ? getMatrixCells(matrixEl) : []
	const matrixCellEl = matrixCells.find((el) => el.contains(slot)) ?? null

	return {
		slot,
		fraction: (slot.closest('.me-frac') as HTMLElement | null) ?? null,
		script: (slot.closest('.me-script') as HTMLElement | null) ?? null,
		rootNode: (slot.closest('.me-root') as HTMLElement | null) ?? null,
		integral: (slot.closest('.me-int') as HTMLElement | null) ?? null,
		bigop: (slot.closest('.me-bigop') as HTMLElement | null) ?? null,
		bracket: bracketEl,
		bracketGroup: groupIndex >= 0 ? groupIndex : 0,
		bracketGroups: contents.length,
		stack: stackEl,
		stackRow: stackRowIndex >= 0 ? stackRowIndex : 0,
		stackRows: stackRows.length,
		matrix: matrixEl,
		matrixCellEl,
		matrixRow: matrixCellEl ? Number(matrixCellEl.dataset.row ?? 1) : 0,
		matrixRows: matrixEl ? new Set(matrixCells.map((el) => Number(el.dataset.row ?? 1))).size : 0,
		matrixCol: matrixCellEl ? Number(matrixCellEl.dataset.col ?? 1) : 0,
		matrixCols: matrixEl ? new Set(matrixCells.map((el) => Number(el.dataset.col ?? 1))).size : 0,
		func: (slot.closest('.me-func') as HTMLElement | null) ?? null,
		deriv: (slot.closest('.me-deriv') as HTMLElement | null) ?? null,
		op: (slot.closest('.me-op') as HTMLElement | null) ?? null,
		arrow: (slot.closest('.me-arrow') as HTMLElement | null) ?? null,
		role: getSlotRole(slot),
		atStart: stripPlaceholder(before.toString()).length === 0,
		atEnd: stripPlaceholder(after.toString()).length === 0,
		collapsed: selection.isCollapsed
	}
}

/** 结构化节点顶层类名：外部左右键与退格 / Delete 都按整块处理 */
const ATOM_CLASSES = [
	'me-frac',
	'me-script',
	'me-root',
	'me-int',
	'me-bigop',
	'me-bracket',
	'me-stack',
	'me-matrix',
	'me-func',
	'me-deriv',
	'me-op',
	'me-arrow'
]

const ATOM_SELECTOR = ATOM_CLASSES.map((name) => '.' + name).join(', ')

/** 边缘槽查询：`first` 按优先级取第一个存在的子容器，`list` 按 DOM 顺序取首 / 末段 */
type EdgeQuery =
	| { kind: 'first'; selectors: string[] }
	| { kind: 'list'; selector: string }

const firstEdge = (...selectors: string[]): EdgeQuery => ({ kind: 'first', selectors })
const listEdge = (selector: string): EdgeQuery => ({ kind: 'list', selector })

/** 各结构化节点在最左 / 最右边缘优先进入的子容器 */
const EDGE_PARTS: Record<string, { start: EdgeQuery; end: EdgeQuery }> = {
	'me-frac': {
		start: firstEdge('.me-frac__num'),
		end: firstEdge('.me-frac__den')
	},
	'me-script': {
		start: firstEdge('.me-script__sup', '.me-script__sub'),
		end: firstEdge('.me-script__sub', '.me-script__sup')
	},
	'me-root': {
		start: firstEdge('.me-root__index', '.me-root__radicand'),
		end: firstEdge('.me-root__radicand')
	},
	'me-int': {
		start: firstEdge('.me-int__sub', '.me-int__sup', '.me-int__integrand'),
		end: firstEdge('.me-int__integrand')
	},
	'me-bigop': {
		start: firstEdge('.me-bigop__sub', '.me-bigop__sup', '.me-bigop__operand'),
		end: firstEdge('.me-bigop__operand')
	},
	'me-bracket': {
		start: listEdge(':scope > .me-bracket__content'),
		end: listEdge(':scope > .me-bracket__content')
	},
	'me-stack': {
		start: listEdge(':scope > .me-stack__rows > .me-stack__row'),
		end: listEdge(':scope > .me-stack__rows > .me-stack__row')
	},
	'me-matrix': {
		start: listEdge(':scope > .me-matrix__grid > .me-matrix__cell'),
		end: listEdge(':scope > .me-matrix__grid > .me-matrix__cell')
	},
	'me-func': {
		start: firstEdge('.me-func__sub', '.me-func__arg'),
		end: firstEdge('.me-func__arg')
	},
	'me-deriv': {
		start: listEdge(':scope > .me-deriv__arg, :scope > .me-deriv__label'),
		end: listEdge(':scope > .me-deriv__arg, :scope > .me-deriv__label')
	},
	'me-op': {
		start: firstEdge('.me-op__top'),
		end: firstEdge('.me-op__top')
	},
	'me-arrow': {
		start: firstEdge('.me-arrow__above', '.me-arrow__below'),
		end: firstEdge('.me-arrow__below', '.me-arrow__above')
	}
}

const resolveEdgePart = (
	atom: HTMLElement,
	query: EdgeQuery,
	side: 'start' | 'end'
): HTMLElement | null => {
	if (query.kind === 'first') {
		for (const selector of query.selectors) {
			const part = atom.querySelector(`:scope > ${selector}`) as HTMLElement | null
			if (part) return part
		}
		return null
	}
	const parts = Array.from(atom.querySelectorAll(query.selector)) as HTMLElement[]
	return (side === 'start' ? parts[0] : parts[parts.length - 1]) ?? null
}

/** 取容器内最左/最右的可编辑槽位，分式/上下标会递归进入对应子容器 */
const getEdgeSlot = (container: HTMLElement, side: 'start' | 'end'): HTMLElement => {
	const children = Array.from(container.children) as HTMLElement[]
	const ordered = side === 'start' ? children : [...children].reverse()
	for (const child of ordered) {
		if (child.classList.contains('me-text-slot')) return child
		const atomClass = ATOM_CLASSES.find((name) => child.classList.contains(name))
		if (!atomClass) continue
		const parts = EDGE_PARTS[atomClass]
		if (!parts) continue
		const part = resolveEdgePart(child, parts[side], side)
		if (part) return getEdgeSlot(part, side)
	}
	const slot = createTextSlot('')
	if (side === 'start') container.prepend(slot)
	else container.append(slot)
	return slot
}

/** 聚焦节点内第一个存在的子容器（按 selectors 优先级），并把光标落到指定边缘 */
const focusPart = (
	atom: HTMLElement,
	selectors: string[],
	side: 'start' | 'end' = 'start',
	select = false
): boolean => {
	for (const selector of selectors) {
		const part = atom.querySelector(`:scope > ${selector}`) as HTMLElement | null
		if (part) {
			focusSlot(getEdgeSlot(part, side), select, side)
			return true
		}
	}
	return false
}

/** 聚焦上下标节点内的槽位：优先上标，其次下标 */
const focusScriptSlot = (script: HTMLElement, prefer: 'sup' | 'sub' = 'sup', select = false): boolean =>
	focusPart(
		script,
		prefer === 'sub' ? ['.me-script__sub', '.me-script__sup'] : ['.me-script__sup', '.me-script__sub'],
		'start',
		select
	)

/** 聚焦根式节点内的槽位：优先根指数，其次被开方数 */
const focusRootSlot = (
	rootNode: HTMLElement,
	prefer: 'index' | 'radicand' = 'radicand',
	select = false
): boolean =>
	focusPart(
		rootNode,
		prefer === 'index' ? ['.me-root__index', '.me-root__radicand'] : ['.me-root__radicand', '.me-root__index'],
		'start',
		select
	)

/** 聚焦积分节点内的槽位：按 prefer 优先级选 sub / sup / integrand */
const focusIntegralSlot = (
	integral: HTMLElement,
	prefer: 'sub' | 'sup' | 'integrand' = 'integrand',
	select = false
): boolean =>
	focusPart(
		integral,
		prefer === 'sub'
			? ['.me-int__sub', '.me-int__sup', '.me-int__integrand']
			: prefer === 'sup'
				? ['.me-int__sup', '.me-int__sub', '.me-int__integrand']
				: ['.me-int__integrand', '.me-int__sup', '.me-int__sub'],
		'start',
		select
	)

/** 聚焦求和节点内的槽位：按 prefer 优先级选 sub / sup / operand */
const focusBigOpSlot = (
	bigop: HTMLElement,
	prefer: 'sub' | 'sup' | 'operand' = 'operand',
	select = false
): boolean =>
	focusPart(
		bigop,
		prefer === 'sub'
			? ['.me-bigop__sub', '.me-bigop__sup', '.me-bigop__operand']
			: prefer === 'sup'
				? ['.me-bigop__sup', '.me-bigop__sub', '.me-bigop__operand']
				: ['.me-bigop__operand', '.me-bigop__sup', '.me-bigop__sub'],
		'start',
		select
	)

/** 聚焦括号内容槽：带分隔符时按 group 定位到对应段 */
const focusBracketSlot = (bracket: HTMLElement, select = false, group = 0): boolean => {
	const contents = getBracketContents(bracket)
	const contentEl = contents[Math.min(Math.max(group, 0), contents.length - 1)]
	if (!contentEl) return false
	focusSlot(getEdgeSlot(contentEl, 'start'), select, 'start')
	return true
}

/** 聚焦堆栈的某一行：按 row 定位，越界时钳制到首/末行 */
const focusStackRow = (stack: HTMLElement, row: number, select = false): boolean => {
	const rows = getStackRows(stack)
	const rowEl = rows[Math.min(Math.max(row, 0), rows.length - 1)]
	if (!rowEl) return false
	focusSlot(getEdgeSlot(rowEl, 'start'), select, 'start')
	return true
}

/** 矩阵跨格导航：rowDelta 跨行取同列（该行缺列时钳到末格），colDelta 沿行主序扁平序列移动；越界返回 false 交给调用方跳出矩阵 */
const focusMatrixCell = (cell: HTMLElement, rowDelta: number, colDelta: number): boolean => {
	const matrix = cell.closest('.me-matrix') as HTMLElement | null
	if (!matrix) return false
	const cells = getMatrixCells(matrix)
	if (rowDelta !== 0) {
		const row = Number(cell.dataset.row ?? 1) + rowDelta
		const rowCells = cells.filter((el) => Number(el.dataset.row ?? 1) === row)
		if (!rowCells.length) return false
		const col = Number(cell.dataset.col ?? 1)
		const target =
			rowCells.find((el) => Number(el.dataset.col ?? 1) === col) ?? rowCells[rowCells.length - 1]
		focusSlot(getEdgeSlot(target, 'start'), false, 'start')
		return true
	}
	const target = cells[cells.indexOf(cell) + colDelta]
	if (!target) return false
	const edge = colDelta < 0 ? 'end' : 'start'
	focusSlot(getEdgeSlot(target, edge), false, edge)
	return true
}

/** 聚焦函数的下标槽（底数 / 极限条件） */
const focusFunctionSub = (
	func: HTMLElement,
	side: 'start' | 'end' = 'start',
	select = false
): boolean => focusPart(func, ['.me-func__sub'], side, select)

/** 聚焦函数的槽位：prefer 决定优先落在下标（底数 / 极限条件）还是参数；没下标时回退到参数 */
const focusFunctionSlot = (
	func: HTMLElement,
	prefer: 'arg' | 'sub' = 'arg',
	select = false
): boolean =>
	focusPart(
		func,
		prefer === 'sub' ? ['.me-func__sub', '.me-func__arg'] : ['.me-func__arg', '.me-func__sub'],
		'start',
		select
	)

/** 聚焦导数节点的参数槽 */
const focusDerivSlot = (
	deriv: HTMLElement,
	select = false,
	side: 'start' | 'end' = 'start'
): boolean => focusPart(deriv, ['.me-deriv__arg'], side, select)

/** 聚焦带标记花括号的标签槽 */
const focusDerivLabel = (
	deriv: HTMLElement,
	side: 'start' | 'end' = 'start',
	select = false
): boolean => focusPart(deriv, ['.me-deriv__label'], side, select)

/** 聚焦上置叠等号节点的记号槽 */
const focusOpSlot = (op: HTMLElement, side: 'start' | 'end' = 'start'): boolean =>
	focusPart(op, ['.me-op__top'], side)

/** 聚焦箭头标注节点的槽位：优先标注槽本身，否则退到唯一槽（上方 / 下方） */
const focusArrowSlot = (
	arrow: HTMLElement,
	slot: 'above' | 'below' = 'above',
	side: 'start' | 'end' = 'start'
): boolean =>
	focusPart(
		arrow,
		slot === 'above' ? ['.me-arrow__above', '.me-arrow__below'] : ['.me-arrow__below', '.me-arrow__above'],
		side
	)

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

/** 结构化节点内部承载内容的槽位容器：嵌套节点向外移动时先停在容器这一层 */
const SLOT_CONTAINER_SELECTOR = Object.keys(SLOT_ROLE_BY_CLASS)
	.map((name) => '.' + name)
	.join(', ')

const isSlotContainer = (element: HTMLElement): boolean =>
	element.matches(SLOT_CONTAINER_SELECTOR)

const isAtomElement = (element: HTMLElement): boolean => element.matches(ATOM_SELECTOR)

/**
 * 在同级节点之间左右移动，嵌套结构按槽位容器逐层进出。
 * 公式在外部视为整体：从公式外按左右键会跨过整座公式，只有从公式内部向外移动时才落在它紧邻的位置。
 */
const moveSibling = (node: HTMLElement | null, direction: 'left' | 'right'): boolean => {
	const root = editorRef.value
	if (!root || !node) return false
	const parent = node.parentElement
	if (!parent) return false
	const isAtom = isAtomElement(node)
	const owner = parent.parentElement

	/** 嵌套节点向左退出槽位容器：先回到外层节点的前一个槽位，再整块跳出 */
	const exitLeft = (nestedSlot: boolean, directSlot: boolean): boolean => {
		if (
			directSlot &&
			(parent.classList.contains('me-frac__num') || parent.classList.contains('me-root__index'))
		) {
			focusSlot(ensureDirectTextSlot(parent, 'start'), false, 'end')
			return true
		}
		if (parent.classList.contains('me-frac__den')) {
			return owner ? focusPart(owner, ['.me-frac__num'], 'end') : false
		}
		if (parent.classList.contains('me-root__radicand')) {
			return (
				(owner ? focusPart(owner, ['.me-root__index'], 'end') : false) ||
				(owner ? moveSibling(owner, 'left') : false)
			)
		}
		if (parent.classList.contains('me-int__integrand')) {
			return (
				(owner ? focusPart(owner, ['.me-int__sup', '.me-int__sub'], 'end') : false) ||
				(owner ? moveSibling(owner, 'left') : false)
			)
		}
		if (parent.classList.contains('me-bigop__operand')) {
			return (
				(owner ? focusPart(owner, ['.me-bigop__sup', '.me-bigop__sub'], 'end') : false) ||
				(owner ? moveSibling(owner, 'left') : false)
			)
		}
		// 嵌套节点先退到所在槽位容器这一层，再按一次才离开外层节点
		if (nestedSlot && isSlotContainer(parent)) {
			const slot = createTextSlot('')
			node.before(slot)
			focusSlot(slot, false, 'end')
			return true
		}
		return owner ? moveSibling(owner, 'left') : false
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
			return exitLeft(true, true)
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
			return exitLeft(false, true)
		}

		// 左侧没有节点
		if (parent === root) return false
		return exitLeft(false, false)
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
		// 嵌套节点先退到所在槽位容器这一层，再按一次才离开外层节点
		if (isSlotContainer(parent)) {
			const slot = createTextSlot('')
			node.after(slot)
			focusSlot(slot, false, 'start')
			return true
		}
		return owner ? moveSibling(owner, 'right') : false
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
		return owner ? moveSibling(owner, 'right') : false
	}

	// 右侧没有节点
	if (parent === root) return false
	if (parent.classList.contains('me-frac__num')) {
		return owner ? focusPart(owner, ['.me-frac__den'], 'start') : false
	}
	if (parent.classList.contains('me-root__index')) {
		return owner ? focusPart(owner, ['.me-root__radicand'], 'start') : false
	}
	return owner ? moveSibling(owner, 'right') : false
}

type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
type NavEdge = 'start' | 'end'
type NavOwner =
	| 'fraction'
	| 'script'
	| 'rootNode'
	| 'integral'
	| 'bigop'
	| 'bracket'
	| 'stack'
	| 'matrix'
	| 'func'
	| 'deriv'
	| 'op'
	| 'arrow'
type NavCondition = (info: ActiveSlotInfo) => boolean
type NavTarget =
	| { kind: 'slot'; selector: string; edge: NavEdge }
	| { kind: 'atom'; direction: 'left' | 'right' }
	| { kind: 'sibling'; direction: 'left' | 'right' }
	| { kind: 'bracketGroup'; delta: number }
	| { kind: 'stackRow'; delta: number }
	| { kind: 'matrixCell'; rowDelta: number; colDelta: number }
type ArrowRule = { key: ArrowKey; when?: NavCondition; targets: NavTarget[] }
type ArrowSpec = { owner?: NavOwner; rules: ArrowRule[] }

const atStart: NavCondition = (info) => info.atStart
const atEnd: NavCondition = (info) => info.atEnd
const derivUnder: NavCondition = (info) => Boolean(info.deriv?.classList.contains('me-deriv--under'))
const derivLabeled: NavCondition = (info) => Boolean(info.deriv?.classList.contains('me-deriv--labeled'))

const slotTo = (selector: string, edge: NavEdge = 'start'): NavTarget => ({
	kind: 'slot',
	selector,
	edge
})
const atomTo = (direction: 'left' | 'right'): NavTarget => ({ kind: 'atom', direction })
const siblingTo = (direction: 'left' | 'right'): NavTarget => ({ kind: 'sibling', direction })
const bracketGroupTo = (delta: number): NavTarget => ({ kind: 'bracketGroup', delta })
const stackRowTo = (delta: number): NavTarget => ({ kind: 'stackRow', delta })
const matrixCellTo = (rowDelta: number, colDelta: number): NavTarget => ({
	kind: 'matrixCell',
	rowDelta,
	colDelta
})

const focusNavTarget = (
	info: ActiveSlotInfo,
	owner: HTMLElement | null,
	target: NavTarget
): boolean => {
	switch (target.kind) {
		case 'slot': {
			const part = owner?.querySelector(`:scope > ${target.selector}`) as HTMLElement | null
			if (!part) return false
			focusSlot(getEdgeSlot(part, target.edge), false, target.edge)
			return true
		}
		case 'atom':
			return owner ? moveSibling(owner, target.direction) : false
		case 'sibling':
			return moveSibling(info.slot, target.direction)
		case 'bracketGroup': {
			const group = info.bracketGroup + target.delta
			if (!info.bracket || group < 0 || group >= info.bracketGroups) return false
			return focusBracketSlot(info.bracket, false, group)
		}
		case 'stackRow': {
			const row = info.stackRow + target.delta
			if (!info.stack || row < 0 || row >= info.stackRows) return false
			return focusStackRow(info.stack, row)
		}
		case 'matrixCell': {
			if (!info.matrixCellEl) return false
			return focusMatrixCell(info.matrixCellEl, target.rowDelta, target.colDelta)
		}
	}
}

/** 方向键导航表：每个槽位角色声明「键 → 目标序列」，首个可用目标胜出 */
const ARROW_NAV: Partial<Record<SlotRole, ArrowSpec>> = {
	num: {
		owner: 'fraction',
		rules: [
			{ key: 'ArrowDown', targets: [slotTo('.me-frac__den')] },
			{ key: 'ArrowRight', when: atEnd, targets: [siblingTo('right')] },
			{ key: 'ArrowLeft', when: atStart, targets: [siblingTo('left')] },
			{ key: 'ArrowUp', targets: [atomTo('left')] }
		]
	},
	den: {
		owner: 'fraction',
		rules: [
			{ key: 'ArrowUp', targets: [slotTo('.me-frac__num', 'end')] },
			{ key: 'ArrowLeft', when: atStart, targets: [siblingTo('left')] },
			{ key: 'ArrowRight', when: atEnd, targets: [siblingTo('right')] },
			{ key: 'ArrowDown', targets: [atomTo('right')] }
		]
	},
	rootIndex: {
		owner: 'rootNode',
		rules: [
			{ key: 'ArrowDown', targets: [slotTo('.me-root__radicand')] },
			{ key: 'ArrowRight', when: atEnd, targets: [slotTo('.me-root__radicand')] },
			{ key: 'ArrowUp', targets: [atomTo('left')] },
			{ key: 'ArrowLeft', when: atStart, targets: [siblingTo('left')] }
		]
	},
	radicand: {
		owner: 'rootNode',
		rules: [
			{ key: 'ArrowUp', targets: [slotTo('.me-root__index', 'end'), atomTo('left')] },
			{
				key: 'ArrowLeft',
				when: atStart,
				targets: [slotTo('.me-root__index', 'end'), atomTo('left')]
			},
			{ key: 'ArrowDown', targets: [atomTo('right')] },
			{ key: 'ArrowRight', when: atEnd, targets: [siblingTo('right')] }
		]
	},
	sup: {
		owner: 'script',
		rules: [
			{ key: 'ArrowDown', targets: [slotTo('.me-script__sub')] },
			{ key: 'ArrowLeft', when: atStart, targets: [siblingTo('left')] },
			{ key: 'ArrowRight', when: atEnd, targets: [siblingTo('right')] }
		]
	},
	sub: {
		owner: 'script',
		rules: [
			{ key: 'ArrowUp', targets: [slotTo('.me-script__sup', 'end')] },
			{ key: 'ArrowLeft', when: atStart, targets: [siblingTo('left')] },
			{ key: 'ArrowRight', when: atEnd, targets: [siblingTo('right')] }
		]
	},
	integralSub: {
		owner: 'integral',
		rules: [
			{ key: 'ArrowUp', targets: [slotTo('.me-int__sup', 'end')] },
			{
				key: 'ArrowRight',
				when: atEnd,
				targets: [slotTo('.me-int__sup'), siblingTo('right')]
			},
			{ key: 'ArrowDown', targets: [slotTo('.me-int__integrand')] },
			{ key: 'ArrowLeft', when: atStart, targets: [siblingTo('left')] }
		]
	},
	integralSup: {
		owner: 'integral',
		rules: [
			{ key: 'ArrowDown', targets: [slotTo('.me-int__sub'), slotTo('.me-int__integrand')] },
			{
				key: 'ArrowLeft',
				when: atStart,
				targets: [slotTo('.me-int__sub', 'end'), siblingTo('left')]
			},
			{ key: 'ArrowRight', when: atEnd, targets: [slotTo('.me-int__integrand')] },
			{ key: 'ArrowUp', targets: [atomTo('left')] }
		]
	},
	integrand: {
		owner: 'integral',
		rules: [
			{
				key: 'ArrowUp',
				targets: [slotTo('.me-int__sup', 'end'), slotTo('.me-int__sub', 'end'), atomTo('left')]
			},
			{
				key: 'ArrowLeft',
				when: atStart,
				targets: [slotTo('.me-int__sup', 'end'), slotTo('.me-int__sub', 'end'), atomTo('left')]
			},
			{ key: 'ArrowDown', targets: [atomTo('right')] },
			{ key: 'ArrowRight', when: atEnd, targets: [siblingTo('right')] }
		]
	},
	bigopSub: {
		owner: 'bigop',
		rules: [
			{ key: 'ArrowUp', targets: [slotTo('.me-bigop__sup', 'end')] },
			{
				key: 'ArrowRight',
				when: atEnd,
				targets: [slotTo('.me-bigop__sup'), slotTo('.me-bigop__operand'), siblingTo('right')]
			},
			{ key: 'ArrowDown', targets: [slotTo('.me-bigop__operand')] },
			{ key: 'ArrowLeft', when: atStart, targets: [siblingTo('left')] }
		]
	},
	bigopSup: {
		owner: 'bigop',
		rules: [
			{
				key: 'ArrowDown',
				targets: [slotTo('.me-bigop__sub'), slotTo('.me-bigop__operand')]
			},
			{
				key: 'ArrowLeft',
				when: atStart,
				targets: [slotTo('.me-bigop__sub', 'end'), siblingTo('left')]
			},
			{ key: 'ArrowRight', when: atEnd, targets: [slotTo('.me-bigop__operand')] },
			{ key: 'ArrowUp', targets: [atomTo('left')] }
		]
	},
	bigopOperand: {
		owner: 'bigop',
		rules: [
			{
				key: 'ArrowUp',
				targets: [
					slotTo('.me-bigop__sup', 'end'),
					slotTo('.me-bigop__sub', 'end'),
					atomTo('left')
				]
			},
			{
				key: 'ArrowLeft',
				when: atStart,
				targets: [
					slotTo('.me-bigop__sup', 'end'),
					slotTo('.me-bigop__sub', 'end'),
					atomTo('left')
				]
			},
			{ key: 'ArrowDown', targets: [atomTo('right')] },
			{ key: 'ArrowRight', when: atEnd, targets: [siblingTo('right')] }
		]
	},
	bracketContent: {
		owner: 'bracket',
		rules: [
			{
				key: 'ArrowLeft',
				when: atStart,
				targets: [bracketGroupTo(-1), atomTo('left')]
			},
			{ key: 'ArrowRight', when: atEnd, targets: [bracketGroupTo(1), atomTo('right')] },
			{ key: 'ArrowUp', targets: [atomTo('left')] },
			{ key: 'ArrowDown', targets: [atomTo('right')] }
		]
	},
	stackRow: {
		owner: 'stack',
		rules: [
			{ key: 'ArrowUp', targets: [stackRowTo(-1), atomTo('left')] },
			{ key: 'ArrowDown', targets: [stackRowTo(1), atomTo('right')] },
			{ key: 'ArrowLeft', when: atStart, targets: [siblingTo('left')] },
			{ key: 'ArrowRight', when: atEnd, targets: [siblingTo('right')] }
		]
	},
	matrixCell: {
		owner: 'matrix',
		rules: [
			{ key: 'ArrowUp', targets: [matrixCellTo(-1, 0), atomTo('left')] },
			{ key: 'ArrowDown', targets: [matrixCellTo(1, 0), atomTo('right')] },
			{ key: 'ArrowLeft', when: atStart, targets: [matrixCellTo(0, -1), atomTo('left')] },
			{ key: 'ArrowRight', when: atEnd, targets: [matrixCellTo(0, 1), atomTo('right')] }
		]
	},
	funcSub: {
		owner: 'func',
		rules: [
			{ key: 'ArrowRight', when: atEnd, targets: [slotTo('.me-func__arg'), slotTo('.me-func__sub')] },
			{ key: 'ArrowDown', when: atEnd, targets: [slotTo('.me-func__arg'), slotTo('.me-func__sub')] },
			{ key: 'ArrowUp', targets: [atomTo('left')] },
			{ key: 'ArrowLeft', when: atStart, targets: [atomTo('left')] }
		]
	},
	funcArg: {
		owner: 'func',
		rules: [
			{ key: 'ArrowUp', targets: [slotTo('.me-func__sub', 'end'), atomTo('left')] },
			{
				key: 'ArrowLeft',
				when: atStart,
				targets: [slotTo('.me-func__sub', 'end'), atomTo('left')]
			},
			{ key: 'ArrowDown', targets: [atomTo('right')] },
			{ key: 'ArrowRight', when: atEnd, targets: [atomTo('right')] }
		]
	},
	derivArg: {
		owner: 'deriv',
		rules: [
			{
				key: 'ArrowUp',
				when: (info) => derivLabeled(info) && !derivUnder(info),
				targets: [slotTo('.me-deriv__label', 'end')]
			},
			{
				key: 'ArrowDown',
				when: (info) => derivLabeled(info) && derivUnder(info) && info.atEnd,
				targets: [slotTo('.me-deriv__label')]
			},
			{ key: 'ArrowUp', targets: [atomTo('left')] },
			{ key: 'ArrowLeft', when: atStart, targets: [atomTo('left')] },
			{ key: 'ArrowDown', targets: [atomTo('right')] },
			{ key: 'ArrowRight', when: atEnd, targets: [atomTo('right')] }
		]
	},
	derivLabel: {
		owner: 'deriv',
		rules: [
			{ key: 'ArrowDown', when: (info) => !derivUnder(info), targets: [slotTo('.me-deriv__arg')] },
			{ key: 'ArrowUp', when: derivUnder, targets: [slotTo('.me-deriv__arg', 'end')] },
			{ key: 'ArrowUp', targets: [atomTo('left')] },
			{ key: 'ArrowLeft', when: atStart, targets: [atomTo('left')] },
			{ key: 'ArrowDown', targets: [atomTo('right')] },
			{ key: 'ArrowRight', when: atEnd, targets: [atomTo('right')] }
		]
	},
	opTop: {
		owner: 'op',
		rules: [
			{ key: 'ArrowUp', targets: [atomTo('left')] },
			{ key: 'ArrowLeft', when: atStart, targets: [atomTo('left')] },
			{ key: 'ArrowDown', targets: [atomTo('right')] },
			{ key: 'ArrowRight', when: atEnd, targets: [atomTo('right')] }
		]
	},
	arrowAbove: {
		owner: 'arrow',
		rules: [
			{ key: 'ArrowDown', targets: [slotTo('.me-arrow__below'), atomTo('right')] },
			{ key: 'ArrowUp', targets: [atomTo('left')] },
			{ key: 'ArrowLeft', when: atStart, targets: [atomTo('left')] },
			{ key: 'ArrowRight', when: atEnd, targets: [atomTo('right')] }
		]
	},
	arrowBelow: {
		owner: 'arrow',
		rules: [
			{ key: 'ArrowUp', targets: [slotTo('.me-arrow__above', 'end'), atomTo('left')] },
			{ key: 'ArrowDown', targets: [atomTo('right')] },
			{ key: 'ArrowLeft', when: atStart, targets: [atomTo('left')] },
			{ key: 'ArrowRight', when: atEnd, targets: [atomTo('right')] }
		]
	},
	text: {
		rules: [
			{ key: 'ArrowLeft', when: atStart, targets: [siblingTo('left')] },
			{ key: 'ArrowRight', when: atEnd, targets: [siblingTo('right')] }
		]
	}
}

const handleArrow = (key: string): boolean => {
	const info = getActiveSlot()
	if (!info || !info.collapsed) return false
	const spec = ARROW_NAV[info.role]
	if (!spec) return false
	const owner = spec.owner ? info[spec.owner] : null
	for (const rule of spec.rules) {
		if (rule.key !== key) continue
		if (rule.when && !rule.when(info)) continue
		return rule.targets.some((target) => focusNavTarget(info, owner, target))
	}
	return false
}

/** 光标移到槽位内的指定字符偏移处 */
const focusSlotAt = (slot: HTMLElement | null, offset: number) => {
	if (!slot) return
	slot.focus()
	lastFocusedSlot = slot
	const range = document.createRange()
	const textNode = slot.firstChild
	if (textNode && textNode.nodeType === Node.TEXT_NODE) {
		range.setStart(textNode, Math.min(offset, (textNode.textContent ?? '').length))
	} else {
		range.setStart(slot, 0)
	}
	range.collapse(true)
	const selection = window.getSelection()
	selection?.removeAllRanges()
	selection?.addRange(range)
}

/** 把相邻的两个文本槽拼成一个，返回合并后的槽位和拼接处偏移 */
const mergeTextSlots = (left: HTMLElement, right: HTMLElement): { slot: HTMLElement; offset: number } => {
	const leftText = readSlotText(left)
	left.textContent = leftText + readSlotText(right) || '\u200b'
	right.remove()
	return { slot: left, offset: leftText.length }
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

type DeleteKey = 'Backspace' | 'Delete'
type DeleteAction =
	| { kind: 'remove'; side: 'before' | 'after' }
	| { kind: 'focus'; targets: NavTarget[] }
	| { kind: 'focusOrRemove'; targets: NavTarget[]; side: 'before' | 'after' }
type DeleteRule = { key: DeleteKey; when?: NavCondition; action: DeleteAction }
type DeleteSpec = { owner?: NavOwner; rules: DeleteRule[] }

const hasChild = (owner: HTMLElement | null, selector: string): boolean =>
	Boolean(owner?.querySelector(`:scope > ${selector}`))

const rootHasIndex: NavCondition = (info) => hasChild(info.rootNode, '.me-root__index')
const integralHasLimits: NavCondition = (info) =>
	hasChild(info.integral, '.me-int__sub') || hasChild(info.integral, '.me-int__sup')
const bigopHasLimits: NavCondition = (info) =>
	hasChild(info.bigop, '.me-bigop__sub') || hasChild(info.bigop, '.me-bigop__sup')

const removeBefore: DeleteAction = { kind: 'remove', side: 'before' }
const removeAfter: DeleteAction = { kind: 'remove', side: 'after' }
const focusTo = (...targets: NavTarget[]): DeleteAction => ({ kind: 'focus', targets })
const focusOrRemove = (side: 'before' | 'after', ...targets: NavTarget[]): DeleteAction => ({
	kind: 'focusOrRemove',
	targets,
	side
})

const runDeleteAction = (
	info: ActiveSlotInfo,
	owner: HTMLElement | null,
	action: DeleteAction
): boolean => {
	if (action.kind === 'remove') {
		if (!owner) return false
		removeAtomNode(owner, action.side)
		return true
	}
	if (action.targets.some((target) => focusNavTarget(info, owner, target))) return true
	if (action.kind === 'focus') return false
	if (!owner) return false
	removeAtomNode(owner, action.side)
	return true
}

/** 退格 / Delete 表：每个槽位角色声明「键 + 条件 → 跳槽或整块删除」 */
const DELETE_NAV: Partial<Record<SlotRole, DeleteSpec>> = {
	num: {
		owner: 'fraction',
		rules: [{ key: 'Backspace', when: atStart, action: removeBefore }]
	},
	den: {
		owner: 'fraction',
		rules: [{ key: 'Delete', when: atEnd, action: removeAfter }]
	},
	rootIndex: {
		owner: 'rootNode',
		rules: [{ key: 'Backspace', when: atStart, action: removeBefore }]
	},
	radicand: {
		owner: 'rootNode',
		rules: [
			{ key: 'Backspace', when: (info) => info.atStart && !rootHasIndex(info), action: removeBefore },
			{ key: 'Delete', when: atEnd, action: removeAfter }
		]
	},
	integralSub: {
		owner: 'integral',
		rules: [{ key: 'Backspace', when: atStart, action: removeBefore }]
	},
	integralSup: {
		owner: 'integral',
		rules: [{ key: 'Backspace', when: atStart, action: removeBefore }]
	},
	integrand: {
		owner: 'integral',
		rules: [
			{ key: 'Backspace', when: (info) => info.atStart && !integralHasLimits(info), action: removeBefore },
			{ key: 'Delete', when: atEnd, action: removeAfter }
		]
	},
	bigopSub: {
		owner: 'bigop',
		rules: [{ key: 'Backspace', when: atStart, action: removeBefore }]
	},
	bigopSup: {
		owner: 'bigop',
		rules: [{ key: 'Backspace', when: atStart, action: removeBefore }]
	},
	bigopOperand: {
		owner: 'bigop',
		rules: [
			{ key: 'Backspace', when: (info) => info.atStart && !bigopHasLimits(info), action: removeBefore },
			{ key: 'Delete', when: atEnd, action: removeAfter }
		]
	},
	bracketContent: {
		owner: 'bracket',
		rules: [
			{ key: 'Backspace', when: atStart, action: focusOrRemove('before', bracketGroupTo(-1)) },
			{ key: 'Delete', when: atEnd, action: focusOrRemove('after', bracketGroupTo(1)) }
		]
	},
	stackRow: {
		owner: 'stack',
		rules: [
			{ key: 'Backspace', when: atStart, action: focusOrRemove('before', stackRowTo(-1)) },
			{ key: 'Delete', when: atEnd, action: focusOrRemove('after', stackRowTo(1)) }
		]
	},
	matrixCell: {
		owner: 'matrix',
		rules: [
			{ key: 'Backspace', when: atStart, action: focusOrRemove('before', matrixCellTo(0, -1)) },
			{ key: 'Delete', when: atEnd, action: focusOrRemove('after', matrixCellTo(0, 1)) }
		]
	},
	funcSub: {
		owner: 'func',
		rules: [
			{ key: 'Backspace', when: atStart, action: removeBefore },
			{ key: 'Delete', when: atEnd, action: focusTo(slotTo('.me-func__arg'), slotTo('.me-func__sub')) }
		]
	},
	funcArg: {
		owner: 'func',
		rules: [
			{ key: 'Backspace', when: atStart, action: focusOrRemove('before', slotTo('.me-func__sub', 'end')) },
			{ key: 'Delete', when: atEnd, action: removeAfter }
		]
	},
	derivArg: {
		owner: 'deriv',
		rules: [
			{ key: 'Backspace', when: atStart, action: removeBefore },
			{ key: 'Delete', when: atEnd, action: removeAfter }
		]
	},
	derivLabel: {
		owner: 'deriv',
		rules: [
			{ key: 'Backspace', when: atStart, action: removeBefore },
			{ key: 'Delete', when: atEnd, action: removeAfter }
		]
	},
	opTop: {
		owner: 'op',
		rules: [
			{ key: 'Backspace', when: atStart, action: removeBefore },
			{ key: 'Delete', when: atEnd, action: removeAfter }
		]
	},
	arrowAbove: {
		owner: 'arrow',
		rules: [
			{ key: 'Backspace', when: atStart, action: focusOrRemove('before', slotTo('.me-arrow__below', 'end')) },
			{ key: 'Delete', when: atEnd, action: removeAfter }
		]
	},
	arrowBelow: {
		owner: 'arrow',
		rules: [
			{ key: 'Backspace', when: atStart, action: removeBefore },
			{ key: 'Delete', when: atEnd, action: focusOrRemove('after', slotTo('.me-arrow__above')) }
		]
	},
	sup: {
		owner: 'script',
		rules: [
			{ key: 'Backspace', when: atStart, action: removeBefore },
			{ key: 'Delete', when: atEnd, action: removeAfter }
		]
	},
	sub: {
		owner: 'script',
		rules: [
			{ key: 'Backspace', when: atStart, action: removeBefore },
			{ key: 'Delete', when: atEnd, action: removeAfter }
		]
	}
}

/** 分式 / 上下标 / 根式本身不是 contenteditable，需要在槽位边界用退格 / Delete 整块删除 */
const handleDelete = (key: 'Backspace' | 'Delete'): boolean => {
	const info = getActiveSlot()
	if (!info) return false
	const { slot, role, atStart, atEnd } = info

	// 插入符号后槽位内容常被整段选中，选区里只有零宽占位符时浏览器原生删除是空操作，
	// 这里先自行处理非折叠选区，避免按一次退格没有任何反应
	if (!info.collapsed) {
		const selection = window.getSelection()
		const range = selection?.getRangeAt(0)
		if (!selection || !range) return false
		const placeholderOnly = stripPlaceholder(range.toString()) === '' && atStart && atEnd
		if (!placeholderOnly) {
			range.deleteContents()
			const empty = readSlotText(slot) === ''
			if (empty) slot.textContent = '\u200b'
			focusSlot(slot, false, empty ? 'start' : 'end')
			syncFromEditor()
			return true
		}
		// 占位符被选中：折叠成光标后按边界规则整块删除
		focusSlot(slot, false, key === 'Backspace' ? 'start' : 'end')
	}

	const spec = DELETE_NAV[role]
	if (spec) {
		const owner = spec.owner ? info[spec.owner] : null
		for (const rule of spec.rules) {
			if (rule.key !== key) continue
			if (rule.when && !rule.when(info)) continue
			return runDeleteAction(info, owner, rule.action)
		}
		return false
	}

	if (role === 'text') {
		if (key === 'Backspace' && atStart) {
			let previous = slot.previousElementSibling as HTMLElement | null
			// 先回收相邻空槽，避免历史残留的空槽挡住后续退格
			while (previous?.classList.contains('me-text-slot') && readSlotText(previous) === '') {
				previous.remove()
				previous = slot.previousElementSibling as HTMLElement | null
			}
			if (previous?.matches(ATOM_SELECTOR)) {
				const target = ensureAdjacentTextSlot(previous, 'before')
				previous.remove()
				if (readSlotText(slot) === '') {
					slot.remove()
					focusSlot(target, false, 'end')
				} else {
					// 原子节点删掉后当前槽与前面的文本槽要合成一个，否则会残留相邻空槽导致退格失效
					const merged = mergeTextSlots(target, slot)
					focusSlotAt(merged.slot, merged.offset)
				}
				syncFromEditor()
				return true
			}
			if (previous?.classList.contains('me-text-slot')) {
				// 相邻文本槽是两个独立编辑宿主，浏览器原生退格无法跨槽，这里手动删掉前一个槽的末字符
				previous.textContent = readSlotText(previous).slice(0, -1) || '\u200b'
				if (readSlotText(slot) === '') {
					slot.remove()
					focusSlot(previous, false, 'end')
				} else {
					const merged = mergeTextSlots(previous, slot)
					focusSlotAt(merged.slot, merged.offset)
				}
				syncFromEditor()
				return true
			}
		}
		if (key === 'Delete' && atEnd) {
			let next = slot.nextElementSibling as HTMLElement | null
			while (next?.classList.contains('me-text-slot') && readSlotText(next) === '') {
				next.remove()
				next = slot.nextElementSibling as HTMLElement | null
			}
			if (next?.matches(ATOM_SELECTOR)) {
				const target = ensureAdjacentTextSlot(next, 'after')
				next.remove()
				if (readSlotText(slot) === '') {
					slot.remove()
					focusSlot(target, false, 'start')
				} else {
					const merged = mergeTextSlots(slot, target)
					focusSlotAt(merged.slot, merged.offset)
				}
				syncFromEditor()
				return true
			}
			if (next?.classList.contains('me-text-slot')) {
				next.textContent = readSlotText(next).slice(1) || '\u200b'
				if (readSlotText(slot) === '') {
					slot.remove()
					focusSlot(next, false, 'start')
				} else {
					const merged = mergeTextSlots(slot, next)
					focusSlotAt(merged.slot, merged.offset)
				}
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
			} else if (child.classList.contains('me-bigop')) {
				focusBigOpSlot(child, 'operand')
			} else if (child.classList.contains('me-bracket')) {
				focusBracketSlotAt(child, x)
			} else if (child.classList.contains('me-stack')) {
				focusStackRow(child, 0)
			} else if (child.classList.contains('me-matrix')) {
				const cells = getMatrixCells(child)
				if (cells.length) focusSlot(getEdgeSlot(cells[0], 'start'), false, 'start')
			} else if (child.classList.contains('me-func')) {
				focusFunctionSlot(child)
			} else if (child.classList.contains('me-deriv')) {
				focusDerivSlot(child)
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

/** 按横向坐标聚焦括号内最近的段（点击定位用） */
const focusBracketSlotAt = (bracket: HTMLElement, x: number) => {
	const contents = getBracketContents(bracket)
	if (!contents.length) return
	let target = 0
	let best = Number.POSITIVE_INFINITY
	contents.forEach((el, index) => {
		const rect = el.getBoundingClientRect()
		const dist = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0
		if (dist < best) {
			best = dist
			target = index
		}
	})
	focusBracketSlot(bracket, false, target)
}

/** 点击堆栈留白时按纵向位置选最近的一行 */
const focusStackRowAt = (stack: HTMLElement, y: number) => {
	const rows = getStackRows(stack)
	if (!rows.length) return
	let target = 0
	let best = Number.POSITIVE_INFINITY
	rows.forEach((el, index) => {
		const rect = el.getBoundingClientRect()
		const dist = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0
		if (dist < best) {
			best = dist
			target = index
		}
	})
	focusStackRow(stack, target)
}

/** 点击矩阵留白时按平面位置选最近的单元格 */
const focusMatrixCellAt = (matrix: HTMLElement, x: number, y: number) => {
	const cells = getMatrixCells(matrix)
	if (!cells.length) return
	let target = 0
	let best = Number.POSITIVE_INFINITY
	cells.forEach((el, index) => {
		const rect = el.getBoundingClientRect()
		const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0
		const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0
		const dist = dx * dx + dy * dy
		if (dist < best) {
			best = dist
			target = index
		}
	})
	const edge = cells[target].dataset.col === '1' ? 'start' : 'end'
	focusSlot(getEdgeSlot(cells[target], edge), false, edge)
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

/** 插入大型运算符：limits 决定限界槽位，inline 行内式限界排右上/右下 */
const insertBigOp = (format: BigOpFormat) => {
	const sub = format.limits === 'both' || format.limits === 'sub' ? [] : null
	const sup = format.limits === 'both' || format.limits === 'sup' ? [] : null
	const bigop = createBigOpElement(format.sign, format.inline, sub, sup, [])
	insertNodesAtCaret([bigop])
	syncFromEditor()
	focusBigOpSlot(bigop, format.limits === 'none' ? 'operand' : 'sub')
}

/** 插入函数：函数名固定，参数占一个空槽位；带下标的卡片（log 底数 / lim / min / max）先聚焦下标 */
const insertFunction = (format: FunctionFormat) => {
	// 反函数卡 id 就是节点名（arcsin 等），只有 logBase 这类卡片 id 需要回退到函数名
	const name = functionCommandById.has(format.id as FunctionFormatId)
		? (format.id as FunctionFormatId)
		: (format.name ?? (format.id as FunctionFormatId))
	const sub = format.sub === undefined ? null : format.sub ? parseLatex(format.sub) : []
	const func = createFunctionElement(name, [], sub)
	insertNodesAtCaret([func])
	syncFromEditor()
	focusFunctionSlot(func, sub && sub.length === 0 ? 'sub' : 'arg')
}

/** 插入导数符号：记号固定，参数占一个空槽位；带标记的花括号再带一个标签槽，双横线卡片插入两层嵌套的 \bar */
const insertDeriv = (format: DerivFormat) => {
	const argument = format.latex ? parseLatex(format.latex) : []
	const deriv = createDerivElement(format.node, argument, format.labeled ? [] : null)
	if (format.nested) {
		const argEl = deriv.querySelector(':scope > .me-deriv__arg') as HTMLElement | null
		if (argEl) {
			argEl.replaceChildren(createDerivElement(format.node, []))
		}
	}
	insertNodesAtCaret([deriv])
	syncFromEditor()
	if (format.latex) {
		// 预填内容末尾可能是上下标等原子节点，直接在参数顶层补文本槽，避免光标钻进去
		const argEl = deriv.querySelector(':scope > .me-deriv__arg') as HTMLElement | null
		if (argEl) focusSlot(ensureDirectTextSlot(argEl, 'end'), false, 'end')
		else focusDerivSlot(deriv)
	} else {
		focusDerivSlot(deriv)
	}
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
	const part = target.closest(SLOT_CONTAINER_SELECTOR) as HTMLElement | null
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
	const bigopNode = target.closest('.me-bigop') as HTMLElement | null
	if (bigopNode) {
		focusBigOpSlot(bigopNode, 'operand')
		return
	}
	const bracketNode = target.closest('.me-bracket') as HTMLElement | null
	if (bracketNode) {
		focusBracketSlotAt(bracketNode, event.clientX)
		return
	}
	const stackNode = target.closest('.me-stack') as HTMLElement | null
	if (stackNode) {
		focusStackRowAt(stackNode, event.clientY)
		return
	}
	const matrixNode = target.closest('.me-matrix') as HTMLElement | null
	if (matrixNode) {
		focusMatrixCellAt(matrixNode, event.clientX, event.clientY)
		return
	}
	const funcNode = target.closest('.me-func') as HTMLElement | null
	if (funcNode) {
		focusFunctionSlot(funcNode)
		return
	}
	const derivNode = target.closest('.me-deriv') as HTMLElement | null
	if (derivNode) {
		focusDerivSlot(derivNode)
		return
	}
	const opNode = target.closest('.me-op') as HTMLElement | null
	if (opNode) {
		focusOpSlot(opNode)
		return
	}
	const arrowNode = target.closest('.me-arrow') as HTMLElement | null
	if (arrowNode) {
		focusArrowSlot(arrowNode)
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
	if (!popoverToolIds.has(tool.id)) {
		activeTool.value = null
		return
	}
	activeTool.value = activeTool.value === tool.id ? null : tool.id
}

const pickFraction = (item: FractionChoice) => {
	activeTool.value = null
	if (item.fraction) {
		insertFraction(item.fraction.num, item.fraction.den, item.fraction.style)
	} else {
		insertTextAtCaret(item.latex)
	}
}

const pickScriptFormat = (item: ScriptFormat) => {
	activeTool.value = null
	insertScript(item.id)
}

const pickCommonScript = (item: CommonScript) => {
	activeTool.value = null
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
	activeTool.value = null
	insertRoot(item)
}

const pickIntegralFormat = (item: IntegralFormat) => {
	activeTool.value = null
	insertIntegral(item)
}

const pickDifferentialFormat = (item: DifferentialFormat) => {
	activeTool.value = null
	insertTextAtCaret(item.latex)
}

/** 基本运算符：纯文本插入当前光标所在槽位 */
/** 插入上置叠等号：记号槽预填内容，插入后聚焦记号槽 */
const insertOp = (format: { variant: 'stackrel' | 'triangleq'; top: string }) => {
	const op = createOpElement(format.variant, parseLatex(format.top))
	insertNodesAtCaret([op])
	syncFromEditor()
	focusOpSlot(op)
}

/** 插入箭头标注：标注槽按卡片位置创建（上方 / 下方），插入后聚焦标注槽 */
const insertArrow = (format: ArrowFormat) => {
	const arrow = createArrowElement(
		format.kind,
		format.label === 'above' ? parseLatex('') : null,
		format.label === 'below' ? parseLatex('') : null
	)
	insertNodesAtCaret([arrow])
	syncFromEditor()
	focusArrowSlot(arrow, format.label)
}

const pickArrowFormat = (item: ArrowFormat) => {
	activeTool.value = null
	insertArrow(item)
}

const pickOperatorFormat = (item: OperatorFormat) => {
	activeTool.value = null
	if ('latex' in item) {
		insertTextAtCaret(item.latex)
	} else {
		insertOp(item)
	}
}

const pickBigOpFormat = (item: BigOpFormat) => {
	activeTool.value = null
	insertBigOp(item)
}

const pickFunctionFormat = (item: FunctionFormat) => {
	activeTool.value = null
	insertFunction(item)
}

const pickCommonFunction = (item: CommonFunction) => {
	activeTool.value = null
	const holder = document.createElement('span')
	appendNodes(holder, parseLatex(item.latex))
	const nodes = Array.from(holder.childNodes)
	insertNodesAtCaret(nodes)
	syncFromEditor()
	// 常用模板全部预填，聚焦首个可编辑槽
	focusFirstEditable(nodes)
}

const pickDerivFormat = (item: DerivFormat) => {
	activeTool.value = null
	insertDeriv(item)
}

const pickLimitLogFormat = (item: FunctionFormat) => {
	activeTool.value = null
	insertFunction(item)
}

/** 插入常用极限模板：解析成结构化函数节点，聚焦参数槽（预填内容） */
const pickCommonLimitLog = (item: CommonFunction) => {
	activeTool.value = null
	const holder = document.createElement('span')
	appendNodes(holder, parseLatex(item.latex))
	const nodes = Array.from(holder.childNodes)
	insertNodesAtCaret(nodes)
	syncFromEditor()
	const func = nodes.find(
		(node) => node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList.contains('me-func')
	) as HTMLElement | undefined
	if (func && focusFunctionSlot(func)) return
	focusFirstEditable(nodes)
}

const pickBracket = (item: BracketFormat) => {
	activeTool.value = null
	const bracket = createBracketElement(item, [[]])
	insertNodesAtCaret([bracket])
	syncFromEditor()
	focusBracketSlot(bracket)
}

const pickSeparatorBracket = (item: SeparatorBracketFormat) => {
	activeTool.value = null
	const format = bracketFormatById.get(item.format)
	if (!format) return
	const groups = Array.from({ length: item.groups }, () => [] as ParsedNode[])
	const bracket = createBracketElement(format, groups)
	insertNodesAtCaret([bracket])
	syncFromEditor()
	focusBracketSlot(bracket)
}

/** 插入事例与堆栈模板：style 为 matrix 时是 rows×1 的矩阵节点，按 wrap 决定是否再套一层配对括号 */
const pickStackFormat = (item: StackFormat) => {
	activeTool.value = null
	if (item.style === 'matrix') {
		const grid = Array.from({ length: item.rows }, () => [[] as ParsedNode[]])
		const matrix = createMatrixElement(grid)
		let inserted: HTMLElement = matrix
		if (item.wrap) {
			const format = bracketFormatById.get(item.wrap)
			if (format) {
				const bracket = createBracketElement(format, [[]])
				const content = getBracketContents(bracket)[0]
				if (content) {
					content.textContent = ''
					content.append(matrix)
				}
				inserted = bracket
			}
		}
		insertNodesAtCaret([inserted])
		syncFromEditor()
		const first = getMatrixCells(matrix)[0]
		if (first) focusSlot(getEdgeSlot(first, 'start'), false, 'start')
		return
	}
	const rows = Array.from({ length: item.rows }, () => [] as ParsedNode[])
	const stack = createStackElement(item.style, rows)
	let inserted: HTMLElement = stack
	if (item.wrap) {
		const format = bracketFormatById.get(item.wrap)
		if (format) {
			const bracket = createBracketElement(format, [[]])
			const content = getBracketContents(bracket)[0]
			if (content) {
				content.textContent = ''
				content.append(stack)
			}
			inserted = bracket
		}
	}
	insertNodesAtCaret([inserted])
	syncFromEditor()
	focusStackRow(stack, 0)
}

/** 插入空矩阵模板：rows × cols 的空单元格网格，插入后聚焦左上角单元格 */
const pickMatrixFormat = (item: MatrixFormat) => {
	activeTool.value = null
	const grid = Array.from({ length: item.rows }, () =>
		Array.from({ length: item.cols }, () => [] as ParsedNode[])
	)
	const matrix = createMatrixElement(grid)
	insertNodesAtCaret([matrix])
	syncFromEditor()
	const first = getMatrixCells(matrix)[0]
	if (first) focusSlot(getEdgeSlot(first, 'start'), true)
}

/** 插入常用方括号公式：解析成结构化节点，填入后聚焦首个空槽（全部预填时聚焦堆栈首行） */
const pickCommonBracket = (item: CommonBracketFormula) => {
	activeTool.value = null
	const holder = document.createElement('span')
	appendNodes(holder, parseLatex(item.latex))
	const nodes = Array.from(holder.childNodes)
	const stack = holder.querySelector('.me-stack') as HTMLElement | null
	insertNodesAtCaret(nodes)
	syncFromEditor()
	for (const node of nodes) {
		if (node.nodeType !== Node.ELEMENT_NODE) continue
		const slots = Array.from((node as HTMLElement).querySelectorAll('[contenteditable]')) as HTMLElement[]
		const empty = slots.find((slot) => readSlotText(slot) === '')
		if (empty) {
			focusSlot(empty, false, 'start')
			return
		}
	}
	if (stack) focusStackRow(stack, 0)
	else focusFirstEditable(nodes)
}

const pickCommonBigOp = (item: CommonBigOp) => {
	activeTool.value = null
	const holder = document.createElement('span')
	appendNodes(holder, parseLatex(item.latex))
	const nodes = Array.from(holder.childNodes)
	insertNodesAtCaret(nodes)
	syncFromEditor()
	// 优先聚焦模板预留的空槽（如带上下限求和的空表达式），全部预填时退回首槽
	for (const node of nodes) {
		if (node.nodeType !== Node.ELEMENT_NODE) continue
		const slots = Array.from((node as HTMLElement).querySelectorAll('[contenteditable]')) as HTMLElement[]
		const empty = slots.find((slot) => readSlotText(slot) === '')
		if (empty) {
			focusSlot(empty, false, 'start')
			return
		}
	}
	focusFirstEditable(nodes)
}

const pickCommonRoot = (item: CommonRoot) => {
	activeTool.value = null
	const holder = document.createElement('span')
	appendNodes(holder, parseLatex(item.latex))
	const nodes = Array.from(holder.childNodes)
	insertNodesAtCaret(nodes)
	syncFromEditor()
	focusFirstEditable(nodes)
}

const onDocumentClick = (event: MouseEvent) => {
	if (activeTool.value === null) return
	if (toolbarRef.value?.contains(event.target as Node)) return
	activeTool.value = null
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
	root.querySelectorAll('.me-bigop__sub').forEach((el) => {
		el.setAttribute('aria-label', t(bigOpAriaKey(bigOpSignOf(el), 'Sub')))
	})
	root.querySelectorAll('.me-bigop__sup').forEach((el) => {
		el.setAttribute('aria-label', t(bigOpAriaKey(bigOpSignOf(el), 'Sup')))
	})
	root.querySelectorAll('.me-bigop__operand').forEach((el) => {
		el.setAttribute('aria-label', t(bigOpAriaKey(bigOpSignOf(el), 'Operand')))
	})
	root.querySelectorAll('.me-stack__row').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.stackRow'))
	})
	root.querySelectorAll('.me-matrix__cell').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.matrixCell'))
	})
	root.querySelectorAll('.me-func__sub').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.funcSub'))
	})
	root.querySelectorAll('.me-func__arg').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.funcArg'))
	})
	root.querySelectorAll('.me-deriv__arg').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.derivArg'))
	})
	root.querySelectorAll('.me-deriv__label').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.derivLabel'))
	})
	root.querySelectorAll('.me-op__top').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.opTop'))
	})
	root.querySelectorAll('.me-arrow__above').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.arrowAbove'))
	})
	root.querySelectorAll('.me-arrow__below').forEach((el) => {
		el.setAttribute('aria-label', t('formula.aria.arrowBelow'))
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

/* 积分弹层双栏（普通积分 + 围道积分）更宽 */
.he-tool-popover--wide {
	width: 560px;
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

/* 括号弹层共 4 个分区，限制高度并允许滚动 */
.he-tool-popover__body--scroll {
	max-height: min(520px, calc(100vh - 160px));
	overflow-y: auto;
}

/* 积分弹层双栏：普通积分居左、围道积分居右 */
.he-tool-popover__body--columns {
	display: flex;
	gap: 14px;
}

.he-tool-popover__col {
	flex: 1;
	min-width: 0;
}

.he-tool-popover__col .he-tool-popover__section {
	margin-top: 0;
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

/* 求和格式一行五张卡片 */
.he-tool-popover__grid--fifths {
	grid-template-columns: repeat(5, 1fr);
}

/* 括号模板 4 列 × 3 行 */
.he-tool-popover__grid--quarters {
	grid-template-columns: repeat(4, minmax(0, 1fr));
}


.he-tool-popover__section:first-child {
	margin-top: 0;
}

.he-tool-popover__section {
	margin: 8px 0 6px;
	font-size: 12px;
	color: #666;
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

/* 选中文本的高亮：浏览器默认的淡蓝在浅色底上几乎看不出 */
.he-formula-editable :deep(::selection) {
	background: rgba(59, 110, 245, 0.38);
	color: inherit;
}

.he-formula-editable :deep(::-moz-selection) {
	background: rgba(59, 110, 245, 0.38);
	color: inherit;
}

/* flex 项不收缩：文本槽不换行，被压缩时文字会溢出画到相邻节点上造成错位 */
.he-formula-editable :deep(> *) {
	flex: 0 0 auto;
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
	flex-shrink: 0;
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
	background: #d9e6ff;
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
	background: #d9e6ff;
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
	background: #d9e6ff;
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
	background: #d9e6ff;
}

/* 积分里的嵌套结构逐层缩小 */
.he-formula-editable :deep(.me-int .me-int) {
	font-size: 0.82em;
}

/* 求和：堆叠式限界位于 Σ 正上/正下，行内式排右上/右下 */
.he-formula-editable :deep(.me-bigop) {
	display: inline-grid;
	grid-template-areas:
		'sup operand'
		'sign operand'
		'sub operand';
	/* 缺省上限或下限时仍保留该行高度，保证 Σ 恒在垂直中轴 */
	grid-template-rows: minmax(0.62em, auto) auto minmax(0.62em, auto);
	align-items: center;
	row-gap: 1px;
	margin: 0 2px;
	vertical-align: middle;
}

.he-formula-editable :deep(.me-bigop__sign) {
	grid-area: sign;
	font-size: 1.5em;
	line-height: 0.9;
	text-align: center;
}

.he-formula-editable :deep(.me-bigop__sup),
.he-formula-editable :deep(.me-bigop__sub) {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 10px;
	padding: 0 1px;
	font-size: 0.55em;
	line-height: 1.1;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-bigop__sup) {
	grid-area: sup;
}

.he-formula-editable :deep(.me-bigop__sub) {
	grid-area: sub;
}

.he-formula-editable :deep(.me-bigop__operand) {
	grid-area: operand;
	display: flex;
	align-items: center;
	min-width: 14px;
	padding: 0 1px;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-bigop__sub:focus-within),
.he-formula-editable :deep(.me-bigop__sup:focus-within),
.he-formula-editable :deep(.me-bigop__operand:focus-within) {
	background: #d9e6ff;
}

.he-formula-editable :deep(.me-bigop--inline) {
	grid-template-areas:
		'sign sup operand'
		'sign sub operand';
	grid-template-rows: auto auto;
	column-gap: 2px;
}

.he-formula-editable :deep(.me-bigop--inline .me-bigop__sup),
.he-formula-editable :deep(.me-bigop--inline .me-bigop__sub) {
	justify-content: flex-start;
}

/* 求和里的嵌套结构逐层缩小 */
.he-formula-editable :deep(.me-bigop .me-bigop) {
	font-size: 0.82em;
}

/* 括号：定界符不可编辑，内容区可落光标 */
.he-formula-editable :deep(.me-bracket) {
	display: inline-flex;
	align-items: center;
	vertical-align: middle;
}

.he-formula-editable :deep(.me-bracket__delim) {
	font-size: 1.15em;
	line-height: 1;
	user-select: none;
	pointer-events: none;
}

/* 单侧括号的空定界符不占位 */
.he-formula-editable :deep(.me-bracket__delim--empty) {
	display: none;
}

.he-formula-editable :deep(.me-bracket__content) {
	display: inline-flex;
	align-items: center;
	min-width: 6px;
	padding: 0 1px;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-bracket__content:focus-within) {
	background: #d9e6ff;
}

/* 括号里的嵌套结构逐层缩小 */
.he-formula-editable :deep(.me-bracket .me-bracket) {
	font-size: 0.9em;
}

/* 内容段之间的竖线分隔符，与定界符一样不可编辑 */
.he-formula-editable :deep(.me-bracket__sep) {
	margin: 0 3px;
	font-size: 1.15em;
	line-height: 1;
	user-select: none;
	pointer-events: none;
}

/* 堆栈：竖排多行，每行可独立落光标；cases 左侧花括号随行数高度拉伸 */
.he-formula-editable :deep(.me-stack) {
	display: inline-flex;
	align-items: center;
	gap: 2px;
	margin: 0 2px;
	vertical-align: middle;
}

.he-formula-editable :deep(.me-stack__brace) {
	font-size: 2.2em;
	line-height: 1;
	user-select: none;
	pointer-events: none;
}

.he-formula-editable :deep(.me-stack__rows) {
	display: inline-flex;
	flex-direction: column;
	gap: 1px;
}

.he-formula-editable :deep(.me-stack__row) {
	display: flex;
	align-items: center;
	min-height: 1.2em;
	min-width: 12px;
	padding: 0 1px;
	border-radius: 2px;
	white-space: nowrap;
}

.he-formula-editable :deep(.me-stack__row:focus-within) {
	background: #d9e6ff;
}

/* 堆栈里嵌套的结构逐层缩小 */
.he-formula-editable :deep(.me-stack .me-stack) {
	font-size: 0.9em;
}

/* 矩阵：网格布局，单元格可独立落光标；行列数参差时按显式定位对齐 */
.he-formula-editable :deep(.me-matrix) {
	display: inline-flex;
	margin: 0 2px;
	vertical-align: middle;
}

.he-formula-editable :deep(.me-matrix__grid) {
	display: inline-grid;
	gap: 2px 14px;
	align-items: center;
	justify-items: center;
	padding: 2px 4px;
}

.he-formula-editable :deep(.me-matrix__cell) {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 1.2em;
	min-width: 12px;
	padding: 0 1px;
	border-radius: 2px;
	white-space: nowrap;
}

.he-formula-editable :deep(.me-matrix__cell:focus-within) {
	background: #d9e6ff;
}

/* 矩阵里嵌套的结构逐层缩小 */
.he-formula-editable :deep(.me-matrix .me-matrix) {
	font-size: 0.9em;
}

/* 函数：函数名直立且不可编辑，参数槽可落光标 */
.he-formula-editable :deep(.me-func) {
	display: inline-flex;
	align-items: baseline;
	margin: 0 1px;
	vertical-align: baseline;
}

.he-formula-editable :deep(.me-func__name) {
	font-family: 'KaTeX_Main', 'Times New Roman', 'PingFang SC', 'Microsoft YaHei', serif;
	font-style: normal;
	line-height: 1;
	user-select: none;
}

/* 反函数的 −1 上标 */
.he-formula-editable :deep(.me-func__sup) {
	font-size: 0.68em;
	line-height: 0;
	margin-left: 1px;
}

/* 函数下标：log 底数排在函数名右下；lim / min / max 的条件排在函数名正下方（网格两行，参数横跨右侧） */
.he-formula-editable :deep(.me-func__sub) {
	display: inline-flex;
	align-items: center;
	min-width: 10px;
	padding: 0 1px;
	font-size: 0.72em;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-func__sub:focus-within) {
	background: #d9e6ff;
}

.he-formula-editable :deep(.me-func--with-sub:not(.me-func--sub-under)) {
	align-items: baseline;
}

.he-formula-editable :deep(.me-func--with-sub:not(.me-func--sub-under) .me-func__sub) {
	align-self: flex-end;
	margin-bottom: 1px;
}

.he-formula-editable :deep(.me-func--sub-under) {
	display: inline-grid;
	grid-template-columns: auto auto;
	grid-template-rows: auto auto;
	align-items: center;
	column-gap: 2px;
}

.he-formula-editable :deep(.me-func--sub-under .me-func__name) {
	grid-column: 1;
	grid-row: 1;
	justify-self: center;
}

.he-formula-editable :deep(.me-func--sub-under .me-func__sub) {
	grid-column: 1;
	grid-row: 2;
	justify-self: center;
}

.he-formula-editable :deep(.me-func--sub-under .me-func__arg) {
	grid-column: 2;
	grid-row: 1 / span 2;
	align-self: center;
}

.he-formula-editable :deep(.me-func__arg) {
	display: inline-flex;
	align-items: center;
	min-width: 10px;
	margin-left: 2px;
	padding: 0 1px;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-func__arg:focus-within) {
	background: #d9e6ff;
}

/* 导数符号：记号在参数上方或下方，标记不可编辑 */
.he-formula-editable :deep(.me-deriv) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	margin: 0 1px;
	vertical-align: middle;
}

.he-formula-editable :deep(.me-deriv__mark) {
	font-family: 'Cambria Math', 'KaTeX_Main', 'Times New Roman', 'PingFang SC', 'Microsoft YaHei', serif;
	font-size: 0.75em;
	font-style: normal;
	line-height: 0.8;
	user-select: none;
}

/* 带标记花括号的标签槽：在记号外侧，字号略小 */
.he-formula-editable :deep(.me-deriv__label) {
	display: inline-flex;
	align-items: center;
	min-width: 10px;
	padding: 0 1px;
	border-radius: 2px;
	font-size: 0.8em;
}

.he-formula-editable :deep(.me-deriv__label:focus-within) {
	background: #d9e6ff;
}

.he-formula-editable :deep(.me-deriv__arg) {
	display: inline-flex;
	align-items: center;
	min-width: 10px;
	padding: 0 1px;
	border-radius: 2px;
}

.he-formula-editable :deep(.me-deriv__arg:focus-within) {
	background: #d9e6ff;
}

/* 带框公式：参数外包一圈边框，没有记号 */
.he-formula-editable :deep(.me-deriv--boxed) {
	padding: 0 5px;
	border: 1px solid currentColor;
	border-radius: 2px;
}

/* 顶线 / 底线：横线随参数宽度拉伸 */
.he-formula-editable :deep(.me-deriv__mark--rule) {
	display: block;
	align-self: stretch;
	width: 100%;
	height: 0;
	border-top: 1px solid currentColor;
	line-height: 0;
}

/* 上置叠等号：记号在上方居中，等号底座固定不可编辑 */
.he-formula-editable :deep(.me-op) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	line-height: 1.1;
	margin: 0 1px;
	vertical-align: middle;
}

.he-formula-editable :deep(.me-op__top) {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 12px;
	padding: 0 1px;
	border-radius: 2px;
	font-size: 0.6em;
	line-height: 1.2;
}

.he-formula-editable :deep(.me-op__top:focus-within) {
	background: #d9e6ff;
}

.he-formula-editable :deep(.me-op__base) {
	line-height: 1;
	user-select: none;
}

/* 箭头标注：上 / 下方标注槽居中，箭头符号底座固定不可编辑 */
.he-formula-editable :deep(.me-arrow) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	line-height: 1.1;
	margin: 0 1px;
	vertical-align: middle;
}

.he-formula-editable :deep(.me-arrow__above),
.he-formula-editable :deep(.me-arrow__below) {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 14px;
	padding: 0 1px;
	border-radius: 2px;
	font-size: 0.6em;
	line-height: 1.2;
}

.he-formula-editable :deep(.me-arrow__above:focus-within),
.he-formula-editable :deep(.me-arrow__below:focus-within) {
	background: #d9e6ff;
}

.he-formula-editable :deep(.me-arrow__sign) {
	line-height: 1;
	user-select: none;
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
