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
	resolve: {
		alias: {
			'@': resolve(__dirname, './src')
		}
	},
	server: {
		host: '0.0.0.0',
		port: 3100,
		open: false
	}
})
