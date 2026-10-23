<template>
	<div class="app">
		<header class="app-header">
			<div class="app-header__inner">
				<a class="app-brand" href="#/">heMathEditor</a>
				<nav class="app-nav" :aria-label="t('nav.ariaLabel')">
					<a
						v-for="item in navItems"
						:key="item.key"
						class="app-nav__link"
						:class="{ 'is-active': current === item.key }"
						:href="item.href"
						:aria-current="current === item.key ? 'page' : undefined"
					>
						{{ item.label }}
					</a>
				</nav>
				<button
					class="app-lang"
					type="button"
					:title="locale === 'zh-CN' ? t('common.switchToEnglish') : t('common.switchToChinese')"
					:aria-label="locale === 'zh-CN' ? t('common.switchToEnglish') : t('common.switchToChinese')"
					@click="switchLanguage"
				>
					{{ locale === 'zh-CN' ? 'EN' : '中文' }}
				</button>
			</div>
		</header>

		<KeepAlive>
			<component :is="currentPage" />
		</KeepAlive>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import EditorPage from '@/pages/EditorPage.vue'
import InputPage from '@/pages/InputPage.vue'
import ViewerPage from '@/pages/ViewerPage.vue'
import WysiwygPage from '@/pages/WysiwygPage.vue'
import { setLocale } from '@/i18n'

const pages = {
	editor: EditorPage,
	input: InputPage,
	viewer: ViewerPage,
	wysiwyg: WysiwygPage
} as const

type PageKey = keyof typeof pages

const { t, locale } = useI18n()

const navItems = computed<{ key: PageKey; label: string; href: string }[]>(() => [
	{ key: 'editor', label: t('nav.editor'), href: '#/' },
	{ key: 'input', label: t('nav.input'), href: '#/input' },
	{ key: 'viewer', label: t('nav.viewer'), href: '#/viewer' },
	{ key: 'wysiwyg', label: t('nav.wysiwyg'), href: '#/wysiwyg' }
])

const pageTitles = computed<Record<PageKey, string>>(() => ({
	editor: t('pageTitles.editor'),
	input: t('pageTitles.input'),
	viewer: t('pageTitles.viewer'),
	wysiwyg: t('pageTitles.wysiwyg')
}))

/** 解析 hash 路由，未知路径回退到首页 */
const parseRoute = (): PageKey => {
	if (typeof window === 'undefined') return 'editor'
	const key = window.location.hash.replace(/^#\/?/, '')
	return key in pages ? (key as PageKey) : 'editor'
}

const current = ref<PageKey>(parseRoute())
const currentPage = computed(() => pages[current.value])

const applyDocumentTitle = () => {
	document.title = `${pageTitles.value[current.value]} · heMathEditor`
}

const applyRoute = () => {
	current.value = parseRoute()
	applyDocumentTitle()
	window.scrollTo({ top: 0 })
}

const switchLanguage = () => {
	setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
}

if (typeof document !== 'undefined') {
	applyDocumentTitle()
}

onMounted(() => {
	window.addEventListener('hashchange', applyRoute)
})

onBeforeUnmount(() => {
	window.removeEventListener('hashchange', applyRoute)
})

watch(locale, applyDocumentTitle)
</script>

<style scoped>
.app {
	min-height: 100vh;
}

.app-header {
	position: sticky;
	top: 0;
	z-index: 100;
	background: rgba(255, 255, 255, 0.94);
	backdrop-filter: blur(8px);
	border-bottom: 1px solid #eef0f3;
}

.app-header__inner {
	display: flex;
	align-items: center;
	gap: 24px;
	max-width: 1080px;
	margin: 0 auto;
	padding: 0 20px;
	height: 56px;
}

.app-brand {
	font-size: 16px;
	font-weight: 700;
	color: #1f2329;
	text-decoration: none;
}

.app-nav {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
}

.app-nav__link {
	padding: 6px 12px;
	border-radius: 8px;
	font-size: 13px;
	color: #555;
	text-decoration: none;
	transition: background 0.15s, color 0.15s;
}

.app-nav__link:hover {
	background: #f5f7fa;
	color: #1f2329;
}

.app-nav__link.is-active {
	background: #eef3ff;
	color: #3b6ef5;
	font-weight: 600;
}

.app-lang {
	margin-left: auto;
	min-width: 46px;
	height: 30px;
	padding: 0 10px;
	border: 1px solid #d9dde3;
	border-radius: 8px;
	background: #fff;
	font-size: 12px;
	color: #444;
	cursor: pointer;
	transition: all 0.15s;
}

.app-lang:hover {
	border-color: #3b6ef5;
	background: #eef3ff;
	color: #3b6ef5;
}
</style>
