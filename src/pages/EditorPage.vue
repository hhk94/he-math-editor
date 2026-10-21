<template>
	<div class="demo-page">
		<header class="demo-page__header">
			<h1 class="demo-page__title">{{ t('editorPage.title') }}</h1>
			<p class="demo-page__sub">{{ t('editorPage.subtitle') }}</p>
		</header>

		<!-- 1. 第一层：Markdown 编辑器（集成公式编辑弹窗） -->
		<section class="card">
			<h2 class="card__title">{{ t('editorPage.editorTitle') }}</h2>
			<p class="card__desc">{{ t('editorPage.editorDesc') }}</p>
			<HeMdEditor v-model="mdText" preview />
		</section>

		<!-- 2. 公式编辑弹窗 -->
		<section class="card">
			<h2 class="card__title">{{ t('editorPage.dialogTitle') }}</h2>
			<p class="card__desc">{{ t('editorPage.dialogDesc') }}</p>
			<div class="card__row">
				<button class="btn btn--primary" type="button" @click="openDialog">
					{{ t('editorPage.openDialog') }}
				</button>
				<span class="tag">{{ t('editorPage.currentLatex') }}{{ resultLatex || t('editorPage.notSet') }}</span>
			</div>
			<div class="card__block">
				<div class="card__label">{{ t('editorPage.renderResult') }}</div>
				<HeMathPreview :latex="resultLatex" :display="resultDisplay" />
			</div>
		</section>

		<!-- 3. 内嵌输入 + 实时预览 -->
		<section class="card">
			<h2 class="card__title">{{ t('editorPage.inlineTitle') }}</h2>
			<p class="card__desc">{{ t('editorPage.inlineDesc') }}</p>
			<div class="card__block">
				<div class="card__label">{{ t('editorPage.formulaArea') }}</div>
				<HeMathInput v-model="inlineLatex" />
			</div>
			<div class="card__block">
				<div class="card__label">{{ t('editorPage.livePreview') }}</div>
				<HeMathPreview :latex="inlineLatex" display />
			</div>
			<div class="card__label card__label--gap">{{ t('editorPage.commonSymbols') }}</div>
			<div class="symbols">
				<button v-for="s in symbols" :key="s.label" class="symbols__btn" type="button" @click="insertSymbol(s.value)">
					{{ s.label }}
				</button>
			</div>
		</section>

		<HeFormulaDialog v-model="dialogVisible" :latex="resultLatex" :display="resultDisplay" @confirm="onConfirm" />
	</div>
</template>

<script setup lang="ts">
import { onDeactivated, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import HeMdEditor from '@/components/HeMdEditor.vue'
import HeMathInput from '@/components/HeMathInput.vue'
import HeMathPreview from '@/components/HeMathPreview.vue'
import HeFormulaDialog from '@/components/HeFormulaDialog.vue'

const { t } = useI18n()

const mdText = ref(
	[
		'# 示例文档',
		'',
		'这是一段 **Markdown** 正文，行内公式 $E=mc^2$ 与行间公式：',
		'',
		'$$',
		'\\int_a^b f(x)\\,dx = F(b)-F(a)',
		'$$',
		'',
		'- 列表项一',
		'- 列表项二',
		'- [ ] 待办任务',
		'',
		'> 公式在正文中是整体标签，点击即可编辑。',
		'',
		'## 代码高亮',
		'',
		'```ts',
		'const openLocalOffice = (scheme: string, fileUrl: string) => {',
		'  console.log(`${scheme}:${OFFICE_URI_ACTION}|u|${encodeURIComponent(fileUrl)}`)',
		'  window.location.href = `${scheme}:${OFFICE_URI_ACTION}|u|${fileUrl}`',
		'}',
		'```',
		'',
		'代码中的 `$x^2$` 不会被当作公式。'
	].join('\n')
)

const dialogVisible = ref(false)

// 页面被 KeepAlive 缓存并切换走时，关闭通过 Teleport 挂在 body 上的弹窗
onDeactivated(() => {
	dialogVisible.value = false
})

const resultLatex = ref('')
const resultDisplay = ref(true)
const inlineLatex = ref('\\frac{1}{x} + \\lim_{n \\to \\infty} a_n')

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

const openDialog = () => {
	dialogVisible.value = true
}

const onConfirm = (latex: string, display: boolean) => {
	resultLatex.value = latex
	resultDisplay.value = display
}

const insertSymbol = (sym: string) => {
	inlineLatex.value = inlineLatex.value ? `${inlineLatex.value} ${sym}` : sym
}
</script>
