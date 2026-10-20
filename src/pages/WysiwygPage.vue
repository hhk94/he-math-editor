<template>
	<div class="demo-page">
		<header class="demo-page__header">
			<h1 class="demo-page__title">HeMdWysiwyg · 单栏所见即所得</h1>
			<p class="demo-page__sub">在编辑区直接渲染标题、列表、加粗等样式，光标所在行显示 Markdown 标记。</p>
		</header>

		<section class="card">
			<h2 class="card__title">
				单栏编辑模式
				<span class="tag tag--warning">开发中</span>
			</h2>
			<p class="card__desc">
				该模式将复用 HeMdEditor 的 CodeMirror 内核与公式原子化能力，通过装饰器隐藏 Markdown 标记并渲染块级样式，当前尚未实现。
			</p>
			<div class="wysiwyg-placeholder">
				<div class="wysiwyg-placeholder__title">计划能力</div>
				<ul class="wysiwyg-placeholder__list">
					<li>标题、加粗、斜体、删除线、行内代码的即时样式</li>
					<li>有序 / 无序列表、引用、代码块的行级排版</li>
					<li>公式标签与 HeFormulaDialog 弹窗复用同一套内核</li>
					<li>光标进入所在行时恢复 Markdown 标记，便于精确编辑</li>
				</ul>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
// 单栏所见即所得编辑器尚未实现，此页仅保留导航入口与计划说明。
</script>

<style scoped>
.wysiwyg-placeholder {
	padding: 24px;
	border: 1px dashed #d9dde3;
	border-radius: 10px;
	background: #fafbfc;
}

.wysiwyg-placeholder__title {
	margin-bottom: 12px;
	font-size: 14px;
	font-weight: 600;
	color: #1f2329;
}

.wysiwyg-placeholder__list {
	margin: 0;
	padding-left: 20px;
	font-size: 13px;
	line-height: 2;
	color: #666;
}
</style>
