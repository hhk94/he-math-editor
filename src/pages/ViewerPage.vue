<template>
	<div class="demo-page">
		<header class="demo-page__header">
			<h1 class="demo-page__title">HeMdViewer · 只读展示</h1>
			<p class="demo-page__sub">渲染后端返回的 Markdown 源码，不包含编辑器、工具栏与公式输入。</p>
		</header>

		<section class="card">
			<h2 class="card__title">只读渲染</h2>
			<p class="card__desc">仅依赖 markdown-it 与 MathJax，不会加载 CodeMirror 与 MathLive。</p>
			<HeMdViewer :markdown="viewerMarkdown" />
		</section>

		<section class="card">
			<h2 class="card__title">空状态</h2>
			<p class="card__desc">内容为空时可通过 emptyText 提供占位文案。</p>
			<HeMdViewer empty-text="暂无内容" />
		</section>
	</div>
</template>

<script setup lang="ts">
import { HeMdViewer } from '@/viewer'

const viewerMarkdown = [
	'## 只读展示',
	'',
	'这段内容来自后端返回的 Markdown，由 `HeMdViewer` 渲染，页面不提供编辑能力。',
	'',
	'### 支持的内容',
	'',
	'- 标题、列表、引用',
	'- 行内公式 $a^2 + b^2 = c^2$',
	'- 行间公式',
	'',
	'$$',
	'\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
	'$$',
	'',
	'| 模式 | 依赖 |',
	'| --- | --- |',
	'| 编辑 | CodeMirror + MathLive |',
	'| 展示 | markdown-it + MathJax |',
	'',
	'```ts',
	"const mode = 'viewer'",
	'```',
	'',
	'> 展示模式不加载 CodeMirror 与 MathLive。'
].join('\n')
</script>
