import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

/**
 * tex-svg.js 外置资产插件：
 * vite 对 .js?url 的导入一律 inline 成 data URI（不遵循 assetsInlineLimit），
 * 这里改为 emit 独立资产文件 mathjax/tex-svg.js，并在模块中导出其运行时 URL。
 * 宿主构建器（vite / webpack 5）按 new URL 资产模式处理，会随包一起部署。
 */
const externalTexSvg = (): Plugin => ({
	name: 'hemath-external-tex-svg',
	resolveId(id) {
		if (id === 'virtual:hemath-tex-svg') return '\0hemath-tex-svg'
		return null
	},
	load(id) {
		if (id !== '\0hemath-tex-svg') return null
		const source = readFileSync(resolve(__dirname, 'public/mathjax/tex-svg.js'))
		this.emitFile({ type: 'asset', fileName: 'mathjax/tex-svg.js', source })
		return 'export default new URL("mathjax/tex-svg.js", import.meta.url).href'
	}
})

/**
 * 库模式构建配置 —— 核心编辑器整体打包（npm 包产物）
 * 双入口：index = 默认（MathJax 运行时走 CDN）；full = 内置 MathJax（离线可用）。
 *
 * 用法：npm run build:lib → dist-lib/
 *   - dist-lib/index.js        主入口（不含 MathJax）
 *   - dist-lib/full.js         完整入口（引用包内 mathjax/tex-svg.js）
 *   - dist-lib/mathjax/...     MathJax 3.2.2 tex-svg 构建（full 入口专用）
 *   - dist-lib/style.css       全部样式（组件 scoped 样式 + MathLive 字体）
 *
 * external 策略：
 *   - vue / vue-i18n → peerDependencies，由宿主项目提供
 *   - codemirror 系 / markdown-it / mathlive / highlight.js → dependencies，
 *     打包时保持外部引用，由 npm 在安装时解析（避免产物体积膨胀与版本重复）
 */
export default defineConfig({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					// MathLive 的 <math-field> 是浏览器原生 Web Component，交给原生处理
					isCustomElement: (tag) => tag.startsWith('math-')
				}
			}
		}),
		externalTexSvg(),
		// 生成 TypeScript 类型声明（.vue 组件由 volar 管线处理）
		dts({
			entryRoot: 'src',
			outDir: 'dist-lib'
		})
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src')
		}
	},
	build: {
		outDir: 'dist-lib',
		cssCodeSplit: false,
		lib: {
			entry: {
				index: resolve(__dirname, 'src/index.ts'),
				full: resolve(__dirname, 'src/full.ts')
			},
			name: 'HeMathEditor',
			fileName: (_format, entryName) => entryName + '.js',
			formats: ['es']
		},
		rollupOptions: {
			// 样式（mathlive/fonts.css 等）打进产物 style.css；其余依赖外部化
			external: (id) =>
				!id.endsWith('.css') &&
				!id.startsWith('.') &&
				!id.startsWith('@/') &&
				!id.startsWith('/') &&
				/^(vue|vue-i18n|@codemirror\/|codemirror|markdown-it|mathlive|highlight\.js)/.test(id),
			output: {
				// 单一 css 产物固定命名 style.css，包内导出为 he-math-editor/style.css
				assetFileNames: 'style.css'
			}
		}
	}
})