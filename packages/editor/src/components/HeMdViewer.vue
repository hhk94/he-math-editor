<template>
	<div ref="containerRef" class="he-md-viewer he-markdown-body"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { renderMarkdownInto } from '../core/renderer'

/**
 * HeMdViewer —— 只读 Markdown + 公式展示
 * 仅依赖 core/renderer（markdown-it + MathJax），不引入 CodeMirror / MathLive。
 * 适用于展示后端返回的 Markdown 源码。
 */
const props = withDefaults(
	defineProps<{
		/** 后端返回的 Markdown 源码 */
		markdown?: string
		/** 内容为空时的占位文本 */
		emptyText?: string
	}>(),
	{
		markdown: '',
		emptyText: ''
	}
)

const containerRef = ref<HTMLElement>()

const render = async () => {
	const el = containerRef.value
	if (!el) return
	const source = props.markdown ?? ''
	if (!source.trim()) {
		el.innerHTML = ''
		if (props.emptyText) {
			const empty = document.createElement('p')
			empty.className = 'he-md-viewer__empty'
			empty.textContent = props.emptyText
			el.appendChild(empty)
		}
		return
	}
	await renderMarkdownInto(el, source)
}

onMounted(() => void render())
watch(() => [props.markdown, props.emptyText], () => void render())
</script>

<style scoped>
.he-md-viewer {
	width: 100%;
	min-height: 120px;
	padding: 16px 20px;
	border: 1px solid #e3e8ef;
	border-radius: 12px;
	background: #fff;
	overflow-wrap: break-word;
}

.he-md-viewer :deep(.he-md-viewer__empty) {
	margin: 0;
	font-size: 13px;
	color: #bbb;
}
</style>
