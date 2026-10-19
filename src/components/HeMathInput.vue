<template>
	<math-field ref="fieldRef" class="he-math-input" @input="onInput" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { MathfieldElement } from 'mathlive'
// 注册 <math-field> 自定义元素并加载 MathLive 数学字体
import 'mathlive'
import 'mathlive/fonts.css'

/**
 * HeMathInput —— MathLive 所见即所得数学输入框
 * 支持 v-model 双向绑定 LaTeX 源码
 */
const props = defineProps<{
	modelValue?: string
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: string): void
}>()

const fieldRef = ref<MathfieldElement>()

const onInput = () => {
	emit('update:modelValue', fieldRef.value?.value ?? '')
}

/** 外部值变化时同步到输入框（避免与自身输入形成回环） */
const syncValue = (value?: string) => {
	const field = fieldRef.value
	if (!field) return
	const next = value ?? ''
	if (next !== field.value) field.value = next
}

onMounted(() => syncValue(props.modelValue))
watch(() => props.modelValue, syncValue)

/** 聚焦到输入框 */
const focus = () => fieldRef.value?.focus()

/** 在光标处插入一段 LaTeX 片段 */
const insert = (latex: string) => {
	const field = fieldRef.value
	if (!field) return
	field.focus()
	field.insert(latex)
	emit('update:modelValue', field.value)
}

const getValue = () => fieldRef.value?.value ?? ''

defineExpose({ focus, insert, getValue })
</script>

<style scoped>
.he-math-input {
	display: block;
	width: 100%;
	min-height: 72px;
	padding: 8px;
	font-size: 1.3rem;
	border: 1px solid #e3e8ef;
	border-radius: 8px;
	background: #fafbfc;
	transition: border-color 0.15s, box-shadow 0.15s;
}

.he-math-input:focus-within {
	border-color: #3b6ef5;
	box-shadow: 0 0 0 3px rgba(59, 110, 245, 0.12);
}
</style>
