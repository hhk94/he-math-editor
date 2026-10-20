<template>
	<div class="app">
		<header class="app-header">
			<div class="app-header__inner">
				<a class="app-brand" href="#/">heMathEditor</a>
				<nav class="app-nav" aria-label="展示页导航">
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
			</div>
		</header>

		<KeepAlive>
			<component :is="currentPage" />
		</KeepAlive>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import EditorPage from '@/pages/EditorPage.vue'
import ViewerPage from '@/pages/ViewerPage.vue'
import WysiwygPage from '@/pages/WysiwygPage.vue'

const pages = {
	editor: EditorPage,
	viewer: ViewerPage,
	wysiwyg: WysiwygPage
} as const

type PageKey = keyof typeof pages

const navItems: { key: PageKey; label: string; href: string }[] = [
	{ key: 'editor', label: 'HeMdEditor', href: '#/' },
	{ key: 'viewer', label: 'HeMdViewer', href: '#/viewer' },
	{ key: 'wysiwyg', label: 'HeMdWysiwyg', href: '#/wysiwyg' }
]

const pageTitles: Record<PageKey, string> = {
	editor: 'HeMdEditor · 分栏编辑',
	viewer: 'HeMdViewer · 只读展示',
	wysiwyg: 'HeMdWysiwyg · 单栏所见即所得'
}

/** 解析 hash 路由，未知路径回退到首页 */
const parseRoute = (): PageKey => {
	if (typeof window === 'undefined') return 'editor'
	const key = window.location.hash.replace(/^#\/?/, '')
	return key in pages ? (key as PageKey) : 'editor'
}

const current = ref<PageKey>(parseRoute())
const currentPage = computed(() => pages[current.value])

const applyRoute = () => {
	current.value = parseRoute()
	document.title = `${pageTitles[current.value]} · heMathEditor`
	window.scrollTo({ top: 0 })
}

if (typeof document !== 'undefined') {
	document.title = `${pageTitles[current.value]} · heMathEditor`
}

onMounted(() => {
	window.addEventListener('hashchange', applyRoute)
})

onBeforeUnmount(() => {
	window.removeEventListener('hashchange', applyRoute)
})
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
</style>
