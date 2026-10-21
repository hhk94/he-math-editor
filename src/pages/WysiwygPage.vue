<template>
	<div class="demo-page">
		<header class="demo-page__header">
			<h1 class="demo-page__title">{{ t('wysiwygPage.title') }}</h1>
			<p class="demo-page__sub">{{ t('wysiwygPage.subtitle') }}</p>
		</header>

		<section class="card">
			<h2 class="card__title">
				{{ t('wysiwygPage.cardTitle') }}
				<span class="tag tag--warning">{{ t('wysiwygPage.badge') }}</span>
			</h2>
			<p class="card__desc">{{ t('wysiwygPage.desc') }}</p>
			<div class="wysiwyg-placeholder">
				<div class="wysiwyg-placeholder__title">{{ t('wysiwygPage.plannedTitle') }}</div>
				<ul class="wysiwyg-placeholder__list">
					<li>{{ t('wysiwygPage.plannedStyles') }}</li>
					<li>{{ t('wysiwygPage.plannedBlocks') }}</li>
					<li>{{ t('wysiwygPage.plannedFormula') }}</li>
					<li>{{ t('wysiwygPage.plannedMarkers') }}</li>
				</ul>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// 单栏所见即所得编辑器尚未实现，此页仅保留导航入口与计划说明。
const { t } = useI18n()
</script>