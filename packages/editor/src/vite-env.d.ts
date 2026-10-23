/// <reference types="vite/client" />

/** full 入口的内置 MathJax 资产地址（由 vite.lib.config.ts 的虚拟模块在构建时提供） */
declare module 'virtual:hemath-tex-svg' {
	export default string
}
declare module '*.vue' {
	import type { DefineComponent } from 'vue'
	const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
	export default component
}
