// MathJax 服务：按需加载本地 tex-svg.js 并对指定元素排版
declare global {
	interface Window {
		MathJax: any
	}
}

type RenderTask = {
	element: HTMLElement
	resolve: () => void
	reject: (error: unknown) => void
}

class MathJaxService {
	private isLoaded = false
	private pendingRenderQueue: RenderTask[] = []

	/** 本地 MathJax 3.2.2 构建产物，放在 public/mathjax 下 */
	private readonly localSource = `${import.meta.env.BASE_URL}mathjax/tex-svg.js`

	constructor() {
		this.loadMathJax()
	}

	private loadMathJax() {
		if (window.MathJax) {
			this.isLoaded = true
			this.processRenderQueue()
			return
		}

		const script = document.createElement('script')
		script.src = this.localSource
		script.async = true

		// 必须在脚本加载前写入配置
		window.MathJax = {
			tex: {
				inlineMath: [
					['$', '$'],
					['\\(', '\\)']
				],
				displayMath: [
					['$$', '$$'],
					['\\[', '\\]']
				],
				processEscapes: true,
				// 本地 MathJax 3.2.2 未内置 \oiint/\oiiint，用 ◯(U+25EF) 叠加 ∬/∭ 自定义，
				// 字形由该构建自带；偏移量按实测字宽（◯ 1.221em、∬ 1.169em、∭ 1.593em）计算
				macros: {
					oiint: ['\\mathop{\\rlap{\\bigcirc}\\iint}\\nolimits', 0],
					oiiint: ['\\mathop{\\rlap{\\hskip .19em\\bigcirc}\\iiint}\\nolimits', 0]
				}
			},
			svg: {
				fontCache: 'global'
			},
			startup: {
				typeset: false // 禁止自动渲染，改为手动按元素排版
			}
		}

		script.onload = () => {
			this.isLoaded = true
			this.processRenderQueue()
		}

		script.onerror = (error: unknown) => {
			console.error(`MathJax 加载失败: ${this.localSource}`, error)
		}

		document.head.appendChild(script)
	}

	private processRenderQueue() {
		while (this.pendingRenderQueue.length > 0) {
			const item = this.pendingRenderQueue.shift()
			if (item) {
				const { element, resolve, reject } = item
				this.renderElement(element).then(resolve).catch(reject)
			}
		}
	}

	public isMathJaxLoaded(): boolean {
		return this.isLoaded && !!window.MathJax
	}

	/** 对单个 DOM 元素排版，可在 MathJax 就绪前调用（自动入队） */
	public async renderElement(element: HTMLElement): Promise<void> {
		if (!this.isLoaded || !window.MathJax) {
			return new Promise((resolve, reject) => {
				this.pendingRenderQueue.push({ element, resolve, reject })
			})
		}

		try {
			// 清除该元素内旧的排版记录，支持同一元素重复渲染
			window.MathJax.typesetClear?.([element])
			await window.MathJax.typesetPromise([element])
		} catch (error) {
			console.error('MathJax 排版出错:', error)
		}
	}
}

/** 将 <span class="latex">...</span> 转换为 MathJax 内联公式分隔符 \(...\) */
export const renderTex = (html: string) =>
	html.replace(/<span class="latex">([\s\S]*?)<\/span>/g, (_m, tex) => `\\(${tex}\\)`)

export default new MathJaxService()
