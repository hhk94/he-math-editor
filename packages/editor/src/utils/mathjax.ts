// MathJax 服务：按需加载 tex-svg.js 并对指定元素排版
// 加载来源三种方式（优先级从高到低）：
// 1. mathJaxService.configure({ source }) —— 自托管 / 私有 CDN 地址
// 2. he-math-editor/full 入口 —— 包内置 tex-svg.js（离线可用），import 时自动 configure
// 3. 默认 —— 开发环境用本地 public/mathjax（demo），库/生产环境用公网 CDN
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

/** MathJax 3.2.2 tex-svg 构建（npmmirror CDN，与本地 public/mathjax 同版本，字形行为一致） */
const CDN_SOURCE = 'https://registry.npmmirror.com/mathjax/3.2.2/files/es5/tex-svg.js'

const resolveDefaultSource = (): string => {
	// 开发环境（demo 站）优先用本地 public/mathjax，避免开发时依赖外网
	if (import.meta.env.DEV) return `${import.meta.env.BASE_URL}mathjax/tex-svg.js`
	return CDN_SOURCE
}

class MathJaxService {
	private isLoaded = false
	private loadStarted = false
	private pendingRenderQueue: RenderTask[] = []
	private source = resolveDefaultSource()

	/**
	 * 配置 MathJax 脚本地址（自托管 / 私有 CDN / 包内置资源）。
	 * 必须在首次渲染前调用才生效：脚本加载是懒执行的（首次 renderElement 才开始），
	 * 加载已开始后调用会被忽略，保证来源稳定不中途切换。
	 */
	public configure(options: { source: string }) {
		if (this.loadStarted || this.isLoaded) return
		this.source = options.source
	}

	/** 当前生效的脚本地址 */
	public getSource(): string {
		return this.source
	}

	/** 首次渲染时才真正加载脚本，让 configure 有机会在加载前介入 */
	private ensureLoaded() {
		if (this.isLoaded) return
		// 宿主项目自己已加载过完整 MathJax（typesetPromise 存在）时直接复用。
		// 注意 loadMathJax 会先写入配置占位对象（无 typesetPromise），不能作为就绪依据。
		if (window.MathJax?.typesetPromise) {
			this.isLoaded = true
			this.processRenderQueue()
			return
		}
		if (this.loadStarted) return
		this.loadStarted = true
		this.loadMathJax()
	}

	private loadMathJax() {
		const script = document.createElement('script')
		script.src = this.source
		script.async = true

		// 必须在脚本加载前写入配置
		window.MathJax = {
			tex: {
				// 仅识别 \(...\) / \[...\] 显式分隔符：
				// 预览由 markdown-it 数学规则输出显式分隔符，关闭 $ 可避免正文中的美元符号被误配对
				inlineMath: [['\\(', '\\)']],
				displayMath: [['\\[', '\\]']],
				processEscapes: true,
				// MathJax 3.2.2 未内置 \oiint/\oiiint，用 ◯(U+25EF) 叠加 ∬/∭ 自定义，
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
			console.error(`MathJax 加载失败: ${this.source}`, error)
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

	/** 对单个 DOM 元素排版，可在 MathJax 就绪前调用（自动入队，就绪后统一处理） */
	public async renderElement(element: HTMLElement): Promise<void> {
		this.ensureLoaded()
		if (!this.isLoaded || !window.MathJax?.typesetPromise) {
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