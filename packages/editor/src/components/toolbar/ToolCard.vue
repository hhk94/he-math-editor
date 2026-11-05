<template>
	<button
		class="he-tool-card"
		:class="{
			'he-tool-card--tall': tall,
			'he-tool-card--wide': wide,
			'he-tool-card--span2': span2
		}"
		type="button"
		:title="title"
		@mousedown.prevent
		@click="emit('pick')"
	>
		<span
			v-if="text !== undefined"
			class="he-tool-card__preview"
			:class="{ 'he-math-font': mathFont }"
			>{{ text }}</span
		>
		<span
			v-else
			class="he-tool-card__preview"
			:class="{ 'he-math-font': mathFont }"
			v-html="html"
		></span>
	</button>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		title: string
		html?: string
		text?: string
		tall?: boolean
		wide?: boolean
		span2?: boolean
		mathFont?: boolean
	}>(),
	{
		html: '',
		tall: false,
		wide: false,
		span2: false,
		mathFont: true
	}
)

const emit = defineEmits<{ (e: 'pick'): void }>()
</script>

<style scoped>
/* 卡片预览：v-html 注入的预览内容需要 :deep 才能命中作用域样式 */
/* 括号卡片预览：虚线空框 + 两侧定界符 */
.he-tool-card__preview :deep(.bracket-preview) {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 2px;
	line-height: 1;
}

.he-tool-card__preview :deep(.bracket-preview__delim) {
	font-size: 1.15em;
}

.he-tool-card__preview :deep(.bracket-preview__box) {
	display: inline-block;
	width: 22px;
	height: 18px;
	border: 1px dashed currentColor;
	border-radius: 2px;
	opacity: 0.45;
}

/* 函数卡片预览：直立函数名 + 虚线参数框 */
.he-tool-card__preview :deep(.func-preview) {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	line-height: 1;
}

.he-tool-card__preview :deep(.func-preview__name) {
	font-family: 'Times New Roman', 'KaTeX_Main', serif;
	font-style: normal;
	font-size: 1.05em;
}

/* 反函数预览的 −1 上标 */
.he-tool-card__preview :deep(.func-preview__name sup) {
	font-size: 0.62em;
	line-height: 0;
}

.he-tool-card__preview :deep(.func-preview__box) {
	display: inline-block;
	width: 26px;
	height: 18px;
	border: 1px dashed currentColor;
	border-radius: 2px;
	opacity: 0.45;
}

/* 常用函数模板预览的预填参数与等号 */
.he-tool-card__preview :deep(.func-preview__arg) {
	font-size: 0.95em;
}

/* 恒等式宽卡：tan θ、等号与分式纵向居中对齐（行内基线会把左侧压到分母一线） */
.he-tool-card__preview :deep(.func-preview__row) {
	display: inline-flex;
	align-items: center;
	line-height: 1;
}

.he-tool-card__preview :deep(.func-preview__eq) {
	margin: 0 2px;
}

/* 极限和对数卡片：下标在函数名右侧（log 底数）或正下方（lim / min / max），下方模式名称与下标纵向堆叠 */
.he-tool-card__preview :deep(.func-preview--under) {
	flex-direction: row;
	align-items: center;
	gap: 4px;
}

.he-tool-card__preview :deep(.func-preview__head) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	gap: 1px;
	line-height: 1;
}

.he-tool-card__preview :deep(.func-preview__sub-box) {
	display: inline-block;
	min-width: 22px;
	height: 10px;
	border: 1px dashed currentColor;
	border-radius: 2px;
	opacity: 0.45;
}

/* log 底数卡：下标框贴住函数名右下，不与参数框同一行 */
.he-tool-card__preview :deep(.func-preview:not(.func-preview--under) .func-preview__sub-box) {
	align-self: flex-end;
	margin-bottom: 3px;
}

.he-tool-card__preview :deep(.func-preview__sub) {
	font-size: 0.72em;
	line-height: 1;
}

/* 基本运算符卡片预览：def / m / △ 上置叠等号，记号在上、等号在下 */
.he-tool-card__preview :deep(.op-stack) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	line-height: 1;
}

.he-tool-card__preview :deep(.op-stack__top) {
	font-size: 0.7em;
	font-style: normal;
}

.he-tool-card__preview :deep(.op-stack__eq) {
	font-size: 1.05em;
	line-height: 0.9;
}

/* 导数符号卡片预览：虚线参数框 + 上方/下方记号，多行括号夹在两个参数框之间 */
.he-tool-card__preview :deep(.accent-preview) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	line-height: 1;
}

.he-tool-card__preview :deep(.accent-preview__box) {
	width: 22px;
	height: 16px;
	border: 1px dashed currentColor;
	border-radius: 2px;
	opacity: 0.45;
}

.he-tool-card__preview :deep(.accent-preview__mark) {
	font-family: 'Cambria Math', 'Times New Roman', 'KaTeX_Main', serif;
	font-style: normal;
	line-height: 0.85;
}

/* 常用导数对象预览：参数内容左右留白，横线略宽于文字 */
.he-tool-card__preview :deep(.accent-preview__text) {
	padding: 0 5px;
	line-height: 1;
}

/* 带框公式预览：宽带卡在文本外包一圈实线边框 */
.he-tool-card__preview :deep(.accent-preview--boxed) {
	padding: 2px 6px;
	border: 1px solid currentColor;
	border-radius: 2px;
}

/* 顶线 / 底线预览：虚线参数框上方或下方加一条实线 */
.he-tool-card__preview :deep(.accent-preview--rule-over) {
	padding-top: 2px;
	border-top: 1px solid currentColor;
}

.he-tool-card__preview :deep(.accent-preview--rule-under) {
	padding-bottom: 2px;
	border-bottom: 1px solid currentColor;
}

/* 两列网格中横跨整行的宽卡（常用函数恒等式） */
.he-tool-card--span2 {
	grid-column: span 2;
}

/* 带分隔符的预览里空框更窄，给竖线留位置 */
.he-tool-card__preview :deep(.bracket-preview__sep) {
	font-size: 1.15em;
	opacity: 0.6;
}

.he-tool-card__preview :deep(.bracket-preview__sep) + .bracket-preview__box {
	width: 18px;
}

/* 堆栈卡片预览：竖向排列的虚线空框 + 可选左右定界符 */
.he-tool-card__preview :deep(.stack-preview) {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 2px;
	line-height: 1;
}

.he-tool-card__preview :deep(.stack-preview__delim) {
	font-size: 1.35em;
}

.he-tool-card__preview :deep(.stack-preview__rows) {
	display: inline-flex;
	flex-direction: column;
	gap: 2px;
}

.he-tool-card__preview :deep(.stack-preview__box) {
	display: block;
	width: 22px;
	height: 13px;
	border: 1px dashed currentColor;
	border-radius: 2px;
	opacity: 0.45;
}

.he-tool-card {
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

.he-tool-card:hover {
	border-color: #3b6ef5;
	background: #f7f9ff;
}

/* 根式格式卡片更高，留出根号与空槽的展示空间 */
.he-tool-card--tall {
	height: 104px;
}

.he-tool-card--wide {
	height: 84px;
}

.he-tool-card__preview {
	font-size: 17px;
	line-height: 1.1;
}

.he-tool-card__preview :deep(.math-frac) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	line-height: 1.1;
}

.he-tool-card__preview :deep(.math-frac__num) {
	padding: 0 4px 2px;
	border-bottom: 1px solid currentColor;
}

.he-tool-card__preview :deep(.math-frac__den) {
	padding-top: 2px;
}

.he-tool-card__preview :deep(.math-frac--small) {
	font-size: 0.7em;
}

/* 根式预览：根号 + 上方横线 + 可选的根指数 */
.he-tool-card__preview :deep(.math-root) {
	display: inline-flex;
	align-items: stretch;
	line-height: 1.1;
}

.he-tool-card__preview :deep(.math-root__index) {
	align-self: flex-start;
	margin-right: -0.2em;
	padding-top: 2px;
	font-size: 0.55em;
	line-height: 1;
}

.he-tool-card__preview :deep(.math-root__sign) {
	align-self: stretch;
	display: inline-flex;
	align-items: flex-end;
	font-size: 1.25em;
	line-height: 0.9;
}

.he-tool-card__preview :deep(.math-root__radicand) {
	display: inline-flex;
	align-items: center;
	min-width: 18px;
	padding: 0 2px;
	border-top: 1px solid currentColor;
}

/* 虚线空槽：表示插入后可编辑的位置 */
.he-tool-card__preview :deep(.math-dash) {
	flex: none;
	width: 14px;
	height: 12px;
	border: 1px dashed #b9c0cc;
	border-radius: 2px;
}

/* 积分预览：积分号 + 右上上限/右下下限 + 被积函数空槽，网格区域布局 */
.he-tool-card__preview :deep(.math-int) {
	display: inline-grid;
	grid-template-areas:
		'sign sup integrand'
		'sign sub integrand';
	align-items: center;
	column-gap: 3px;
	line-height: 1.1;
}

.he-tool-card__preview :deep(.math-int__sign) {
	grid-area: sign;
	align-self: center;
	font-size: 1.2em;
}

.he-tool-card__preview :deep(.math-int__sup) {
	grid-area: sup;
}

.he-tool-card__preview :deep(.math-int__sub) {
	grid-area: sub;
}

.he-tool-card__preview :deep(.math-int__integrand) {
	grid-area: integrand;
}

.he-tool-card__preview :deep(.math-bigop) {
	display: inline-grid;
	grid-template-areas:
		'sup'
		'sign'
		'sub'
		'operand';
	justify-items: center;
	align-items: center;
	line-height: 1;
}

.he-tool-card__preview :deep(.math-bigop__sign) {
	grid-area: sign;
	font-size: 1.3em;
}

.he-tool-card__preview :deep(.math-bigop__sup),
.he-tool-card__preview :deep(.math-bigop__sub) {
	font-size: 0.62em;
	line-height: 1;
}

.he-tool-card__preview :deep(.math-bigop__sup) {
	grid-area: sup;
}

.he-tool-card__preview :deep(.math-bigop__sub) {
	grid-area: sub;
}

.he-tool-card__preview :deep(.math-bigop__operand) {
	grid-area: operand;
}

.he-tool-card__preview :deep(.math-bigop--inline) {
	grid-template-areas: 'sign operand';
	grid-template-columns: auto auto;
	column-gap: 2px;
	justify-items: start;
}

.he-tool-card__preview :deep(.math-bigop--inline .math-bigop__sup) {
	display: none;
}

.he-tool-card__preview :deep(.math-bigop--inline .math-bigop__sub) {
	display: none;
}

/* 上下标格式卡片：空白框表示待输入的上标 / 下标 */
.he-tool-card__preview :deep(.script-preview) {
	display: inline-flex;
	align-items: center;
	line-height: 1;
}

.he-tool-card__preview :deep(.script-preview--pre) {
	flex-direction: row;
}

.he-tool-card__preview :deep(.script-preview__stack) {
	display: inline-flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 1px;
	margin: 0 2px;
}

.he-tool-card__preview :deep(.script-preview--pre .script-preview__stack) {
	order: -1;
}

.he-tool-card__preview :deep(.script-preview__slot) {
	width: 13px;
	height: 10px;
	border: 1px dashed #b9c0cc;
	border-radius: 2px;
}

/* 常用上下标模板预览 */
.he-tool-card__preview :deep(.script-tpl sup),
.he-tool-card__preview :deep(.script-tpl sub) {
	font-size: 0.62em;
	line-height: 0;
}

.he-tool-card__preview :deep(.script-tpl__pre) {
	display: inline-flex;
	flex-direction: column;
	align-items: flex-start;
	margin-right: 1px;
	font-size: 0.62em;
	line-height: 1.1;
	vertical-align: middle;
}

/* 运算符结构卡预览：虚线方形标注框 + 箭头 */
.he-tool-card__preview :deep(.arrow-preview) {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	line-height: 1;
}

.he-tool-card__preview :deep(.arrow-preview__label) {
	display: inline-block;
	width: 16px;
	height: 16px;
	border: 1px dashed currentColor;
	border-radius: 2px;
	opacity: 0.45;
}

.he-tool-card__preview :deep(.arrow-preview__sign) {
	font-size: 15px;
	line-height: 1;
}
</style>
