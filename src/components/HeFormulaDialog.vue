<template>
	<Teleport to="body">
		<div v-if="modelValue" class="he-modal" @click.self="close">
			<div class="he-modal__panel">
				<div class="he-modal__header">
					<h3 class="he-modal__title">{{ title }}</h3>
					<button class="he-modal__close" type="button" @click="close">×</button>
				</div>

				<div class="he-modal__body">
					<div class="he-field-label">公式编辑区（所见即所得）</div>
					<HeMathInput ref="inputRef" v-model="latex" />

					<div class="he-field-label he-field-label--gap">
						实时预览
						<label class="he-display-toggle">
							<input v-model="displayMode" type="checkbox" />
							行间公式（独立成行）
						</label>
					</div>
					<HeMathPreview :latex="latex" :display="displayMode" />

					<div class="he-field-label he-field-label--gap">常用符号</div>
					<div class="he-symbols">
						<button v-for="s in symbols" :key="s.label" class="he-sym" type="button" @click="insertSym(s.value)">
							{{ s.label }}
						</button>
					</div>

					<div class="he-latex">LaTeX：{{ latex || '（空）' }}</div>
					<div v-if="error" class="he-error">{{ error }}</div>
				</div>

				<div class="he-modal__footer">
					<button class="he-btn" type="button" @click="close">{{ cancelText }}</button>
					<button class="he-btn he-btn--primary" type="button" @click="confirm">{{ confirmText }}</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import HeMathInput from './HeMathInput.vue'
import HeMathPreview from './HeMathPreview.vue'

/**
 * HeFormulaDialog —— 公式编辑器弹窗
 * 组合 HeMathInput（MathLive 输入）+ HeMathPreview（MathJax 预览）+ 符号面板
 * 打开时通过 latex / display 传入初始公式，确认后通过 confirm 事件回传 LaTeX 源码与是否行间
 */
const props = withDefaults(
	defineProps<{
		modelValue: boolean
		latex?: string
		/** 初始是否为行间公式（$$...$$） */
		display?: boolean
		title?: string
		confirmText?: string
		cancelText?: string
	}>(),
	{
		latex: '',
		display: false,
		title: '公式编辑',
		confirmText: '插入',
		cancelText: '取消'
	}
)

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void
	(e: 'confirm', latex: string, display: boolean): void
}>()

const latex = ref('')
const displayMode = ref(false)
const error = ref('')
const inputRef = ref<InstanceType<typeof HeMathInput>>()

const symbols = [
	{ label: 'a/b', value: '\\frac{a}{b}' },
	{ label: '√x', value: '\\sqrt{x}' },
	{ label: 'x²', value: 'x^{2}' },
	{ label: 'lim', value: '\\lim_{n \\to \\infty}' },
	{ label: '∫', value: '\\int_{a}^{b}' },
	{ label: 'Σ', value: '\\sum_{i=1}^{n}' },
	{ label: 'α', value: '\\alpha' },
	{ label: 'π', value: '\\pi' },
	{ label: '∞', value: '\\infty' }
]

watch(
	() => props.modelValue,
	(visible) => {
		if (!visible) return
		latex.value = props.latex ?? ''
		displayMode.value = props.display
		error.value = ''
		nextTick(() => inputRef.value?.focus())
	}
)

const insertSym = (sym: string) => {
	inputRef.value?.insert(sym)
}

const close = () => {
	emit('update:modelValue', false)
}

const confirm = () => {
	const text = latex.value.trim()
	if (!text) {
		error.value = '请先输入公式'
		return
	}
	emit('confirm', text, displayMode.value)
	emit('update:modelValue', false)
}
</script>

<style scoped>
.he-modal {
	position: fixed;
	inset: 0;
	z-index: 2000;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.45);
	backdrop-filter: blur(3px);
}

.he-modal__panel {
	width: 720px;
	max-width: 94vw;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	overflow: hidden;
}

.he-modal__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border-bottom: 1px solid #eef0f3;
}

.he-modal__title {
	font-size: 16px;
	font-weight: 600;
}

.he-modal__close {
	width: 30px;
	height: 30px;
	border: none;
	border-radius: 50%;
	background: #f5f6f8;
	color: #666;
	font-size: 18px;
	line-height: 1;
	cursor: pointer;
	transition: background 0.15s;
}

.he-modal__close:hover {
	background: #e8eaed;
}

.he-modal__body {
	padding: 18px 20px;
	overflow-y: auto;
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
	font-size: 12px;
	font-family: Consolas, monospace;
	color: #333;
	cursor: pointer;
	transition: all 0.15s;
}

.he-sym:hover {
	border-color: #3b6ef5;
	color: #3b6ef5;
	background: #eef3ff;
}

.he-latex {
	margin-top: 14px;
	padding: 8px 10px;
	border-radius: 6px;
	background: #f5f7fa;
	font-family: Consolas, monospace;
	font-size: 12px;
	color: #666;
	word-break: break-all;
}

.he-error {
	margin-top: 8px;
	font-size: 12px;
	color: #f56c6c;
}

.he-modal__footer {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	padding: 14px 20px;
	border-top: 1px solid #eef0f3;
}

.he-btn {
	padding: 8px 18px;
	border: 1px solid #d9dde3;
	border-radius: 6px;
	background: #fff;
	font-size: 13px;
	color: #444;
	cursor: pointer;
	transition: all 0.15s;
}

.he-btn:hover {
	background: #f5f7fa;
}

.he-btn--primary {
	background: #3b6ef5;
	border-color: #3b6ef5;
	color: #fff;
}

.he-btn--primary:hover {
	background: #2f5ee0;
}
</style>
