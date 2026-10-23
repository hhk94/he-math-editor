import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

/** 默认语言：可按部署环境修改，用户切换后的选择会写入 localStorage */
export const DEFAULT_LOCALE: AppLocale = 'zh-CN'

const STORAGE_KEY = 'hemath-editor:locale'

const isAppLocale = (value: string | null): value is AppLocale => value === 'zh-CN' || value === 'en-US'

const detectLocale = (): AppLocale => {
	if (typeof window === 'undefined') return DEFAULT_LOCALE
	const saved = window.localStorage.getItem(STORAGE_KEY)
	return isAppLocale(saved) ? saved : DEFAULT_LOCALE
}

export const i18n = createI18n({
	legacy: false,
	locale: detectLocale(),
	fallbackLocale: DEFAULT_LOCALE,
	messages: {
		'zh-CN': zhCN,
		'en-US': enUS
	}
})

export const getLocale = (): AppLocale => i18n.global.locale.value as AppLocale

/** 切换语言并持久化，同时同步 <html lang> */
export const setLocale = (locale: AppLocale) => {
	i18n.global.locale.value = locale
	if (typeof document !== 'undefined') document.documentElement.lang = locale
	if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, locale)
}

/** 在中文与英文之间切换，返回切换后的语言 */
export const toggleLocale = (): AppLocale => {
	const next: AppLocale = getLocale() === 'zh-CN' ? 'en-US' : 'zh-CN'
	setLocale(next)
	return next
}

setLocale(getLocale())
