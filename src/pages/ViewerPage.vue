<template>
	<div class="demo-page">
		<header class="demo-page__header">
			<h1 class="demo-page__title">{{ t('viewerPage.title') }}</h1>
			<p class="demo-page__sub">{{ t('viewerPage.subtitle') }}</p>
		</header>

		<section class="card">
			<h2 class="card__title">{{ t('viewerPage.cardTitle') }}</h2>
			<p class="card__desc">{{ t('viewerPage.cardDesc') }}</p>
			<HeMdViewer :markdown="viewerMarkdown" />
		</section>

		<section class="card">
			<h2 class="card__title">{{ t('viewerPage.emptyTitle') }}</h2>
			<p class="card__desc">{{ t('viewerPage.emptyDesc') }}</p>
			<HeMdViewer :empty-text="t('viewerPage.emptyText')" />
		</section>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { HeMdViewer } from '@/viewer'

const { t } = useI18n()

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
