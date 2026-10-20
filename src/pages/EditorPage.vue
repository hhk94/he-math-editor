<template>
	<div class="demo-page">
		<header class="demo-page__header">
			<h1 class="demo-page__title">HeMdEditor · 分栏编辑</h1>
			<p class="demo-page__sub">左侧编写 Markdown，右侧实时渲染排版与公式；公式以整体标签嵌入正文。</p>
		</header>

		<!-- 1. 第一层：Markdown 编辑器（集成公式编辑弹窗） -->
		<section class="card">
			<h2 class="card__title">Markdown 编辑器 HeMdEditor</h2>
			<p class="card__desc">
				工具栏覆盖常用 Markdown 语法；公式以整体标签嵌入正文，点击标签打开公式编辑器，正文中无法修改公式局部。
			</p>
			<HeMdEditor v-model="mdText" preview />
		</section>

		<!-- 2. 公式编辑弹窗 -->
		<section class="card">
			<h2 class="card__title">公式编辑弹窗 HeFormulaDialog</h2>
			<p class="card__desc">点击按钮打开弹窗，编辑完成后确认，结果 LaTeX 会回传到页面。</p>
			<div class="card__row">
				<button class="btn btn--primary" type="button" @click="openDialog">打开公式编辑器</button>
				<span class="tag">当前 LaTeX：{{ resultLatex || '（未设置）' }}</span>
			</div>
			<div class="card__block">
				<div class="card__label">MathJax 渲染结果</div>
				<HeMathPreview :latex="resultLatex" :display="resultDisplay" />
			</div>
		</section>

		<!-- 3. 内嵌输入 + 实时预览 -->
		<section class="card">
			<h2 class="card__title">内嵌输入 HeMathInput + 实时预览 HeMathPreview</h2>
			<p class="card__desc">两个组件都支持直接复用：输入框通过 v-model 绑定 LaTeX，预览组件用 MathJax 排版。</p>
			<div class="card__block">
				<div class="card__label">公式编辑区</div>
				<HeMathInput v-model="inlineLatex" />
			</div>
			<div class="card__block">
				<div class="card__label">实时预览</div>
				<HeMathPreview :latex="inlineLatex" display />
			</div>
			<div class="card__label card__label--gap">常用符号</div>
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
import { ref } from 'vue'
import HeMdEditor from '@/components/HeMdEditor.vue'
import HeMathInput from '@/components/HeMathInput.vue'
import HeMathPreview from '@/components/HeMathPreview.vue'
import HeFormulaDialog from '@/components/HeFormulaDialog.vue'

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
const resultLatex = ref('')
const resultDisplay = ref(false)
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
