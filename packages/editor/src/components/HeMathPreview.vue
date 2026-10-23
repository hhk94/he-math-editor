<template>
	<div ref="containerRef" class="he-math-preview"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import mathJaxService from '../utils/mathjax'

/**
 * HeMathPreview —— 基于 MathJax 的 LaTeX 预览组件
 * display 为 true 时按行间公式渲染（\[...\]），否则按行内公式渲染（\(...\)）
 */
const props = withDefaults(
	defineProps<{
		latex?: string
		display?: boolean
	}>(),
	{
		latex: '',
		display: false
	}
)

const { t, locale } = useI18n()

const containerRef = ref<HTMLElement>()

const render = async () => {
	const el = containerRef.value
	if (!el) return
	const text = (props.latex ?? '').trim()
	if (!text) {
		el.innerHTML = `<span class="he-math-preview__empty">${t('formula.previewEmpty')}</span>`
		return
	}
	el.textContent = props.display ? `\\[${text}\\]` : `\\(${text}\\)`
	await mathJaxService.renderElement(el)
}

onMounted(render)
watch(() => [props.latex, props.display], render)
watch(locale, render)
</script>

<style scoped>
.he-math-preview {
	min-height: 56px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 12px 16px;
	border: 1px solid #e3e8ef;
	border-radius: 8px;
	background: #fff;
	font-size: 1.4rem;
	overflow-x: auto;
}

.he-math-preview :deep(.he-math-preview__empty) {
	font-size: 13px;
	color: #bbb;
}
</style>
