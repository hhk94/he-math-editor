import { i18n } from 'he-math-editor'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

/** 把 demo 专属文案（导航、页面说明）合并进库的 i18n 实例 */
export const installDemoMessages = () => {
	i18n.global.mergeLocaleMessage('zh-CN', zhCN)
	i18n.global.mergeLocaleMessage('en-US', enUS)
}

export { i18n, setLocale, getLocale, toggleLocale } from 'he-math-editor'