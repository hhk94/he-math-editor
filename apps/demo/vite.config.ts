import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					// MathLive 的 <math-field> 是浏览器原生 Web Component，交给原生处理
					isCustomElement: (tag) => tag.startsWith('math-')
				}
			}
		})
	],
	// 复用库包的 public（MathJax 本地资源），避免 demo 维护重复副本
	publicDir: resolve(__dirname, '../../packages/editor/public'),
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
			// demo 直连库源码（跨包热更新即时生效；npm 用户走 dist-lib 产物）
			'he-math-editor': resolve(__dirname, '../../packages/editor/src/index.ts')
		}
	},
	server: {
		host: '0.0.0.0',
		port: 3100,
		open: false
	}
})
