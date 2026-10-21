<template>
	<div class="demo-page">
		<header class="demo-page__header">
			<h1 class="demo-page__title">{{ t('inputPage.title') }}</h1>
			<p class="demo-page__sub">{{ t('inputPage.subtitle') }}</p>
		</header>

		<section class="card">
			<h2 class="card__title">HeFormulaEditor</h2>
			<p class="card__desc">{{ t('inputPage.cardDesc') }}</p>
			<HeFormulaEditor v-model="formula" v-model:display="display" />
		</section>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import HeFormulaEditor from '@/components/HeFormulaEditor.vue'

const { t } = useI18n()

const formula = ref('a+b=12×3')
const display = ref(true)
</script>
