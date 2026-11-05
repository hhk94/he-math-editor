import type { CommonFunction, FunctionFormat, FunctionFormatId } from './types'
import { frac } from './previewUtils'

/** 生成函数卡片预览：直立函数名（可选上标）+ 虚线参数框或预填参数，仅用于工具栏弹窗 */
export const functionPreview = (name: string, sup?: string, argument?: string) =>
	`<span class="func-preview"><span class="func-preview__name">${name}${
		sup ? `<sup>${sup}</sup>` : ''
	}</span><span class="${argument ? 'func-preview__arg' : 'func-preview__box'}">${argument ?? ''}</span></span>`

/** 6 种三角函数，顺序即弹层 3 列 × 2 行的展示顺序 */
export const functionFormats: FunctionFormat[] = [
	{ id: 'sin', name: 'sin', preview: functionPreview('sin') },
	{ id: 'cos', name: 'cos', preview: functionPreview('cos') },
	{ id: 'tan', name: 'tan', preview: functionPreview('tan') },
	{ id: 'csc', name: 'csc', preview: functionPreview('csc') },
	{ id: 'sec', name: 'sec', preview: functionPreview('sec') },
	{ id: 'cot', name: 'cot', preview: functionPreview('cot') }
]

/** 6 种反函数：编辑区显示 sin⁻¹，序列化为 \sin^{-1} */
export const inverseFunctionFormats: FunctionFormat[] = [
	{ id: 'arcsin', name: 'sin', sup: '−1', preview: functionPreview('sin', '−1') },
	{ id: 'arccos', name: 'cos', sup: '−1', preview: functionPreview('cos', '−1') },
	{ id: 'arctan', name: 'tan', sup: '−1', preview: functionPreview('tan', '−1') },
	{ id: 'arccsc', name: 'csc', sup: '−1', preview: functionPreview('csc', '−1') },
	{ id: 'arcsec', name: 'sec', sup: '−1', preview: functionPreview('sec', '−1') },
	{ id: 'arccot', name: 'cot', sup: '−1', preview: functionPreview('cot', '−1') }
]

/** 6 种双曲函数 */
export const hyperbolicFunctionFormats: FunctionFormat[] = [
	{ id: 'sinh', name: 'sinh', preview: functionPreview('sinh') },
	{ id: 'cosh', name: 'cosh', preview: functionPreview('cosh') },
	{ id: 'tanh', name: 'tanh', preview: functionPreview('tanh') },
	{ id: 'csch', name: 'csch', preview: functionPreview('csch') },
	{ id: 'sech', name: 'sech', preview: functionPreview('sech') },
	{ id: 'coth', name: 'coth', preview: functionPreview('coth') }
]

/** 6 种反双曲函数：编辑区显示 sinh⁻¹，序列化为 \sinh^{-1} */
export const inverseHyperbolicFunctionFormats: FunctionFormat[] = [
	{ id: 'arcsinh', name: 'sinh', sup: '−1', preview: functionPreview('sinh', '−1') },
	{ id: 'arccosh', name: 'cosh', sup: '−1', preview: functionPreview('cosh', '−1') },
	{ id: 'arctanh', name: 'tanh', sup: '−1', preview: functionPreview('tanh', '−1') },
	{ id: 'arccsch', name: 'csch', sup: '−1', preview: functionPreview('csch', '−1') },
	{ id: 'arcsech', name: 'sech', sup: '−1', preview: functionPreview('sech', '−1') },
	{ id: 'arccoth', name: 'coth', sup: '−1', preview: functionPreview('coth', '−1') }
]

/** 3 个常用函数模板：解析后插入（θ 用 Unicode，可编辑区不解析 \theta）；恒等式宽卡横跨整行 */
export const commonFunctions: CommonFunction[] = [
	{ id: 'sinTheta', latex: '\\sin{θ}', preview: functionPreview('sin', undefined, 'θ') },
	{ id: 'cosTwoX', latex: '\\cos{2x}', preview: functionPreview('cos', undefined, '2x') },
	{
		id: 'tanIdentity',
		latex: '\\tan{θ}=\\frac{\\sin{θ}}{\\cos{θ}}',
		preview: `<span class="func-preview__row">${functionPreview('tan', undefined, 'θ')}<span class="func-preview__eq">=</span>${frac(
			functionPreview('sin', undefined, 'θ'),
			functionPreview('cos', undefined, 'θ')
		)}</span>`,
		wide: true
	}
]

/** 极限和对数卡片预览：函数名 + 可选下标框 / 参数框；lim / min / max 的下标排在函数名正下方 */
export const limitLogPreview = (name: string, options: { sub?: boolean; under?: boolean } = {}) => {
	const nameHtml = `<span class="func-preview__name">${name}</span>`
	const subBox = options.sub ? '<span class="func-preview__sub-box"></span>' : ''
	if (options.under) {
		return `<span class="func-preview func-preview--under"><span class="func-preview__head">${nameHtml}${subBox}</span></span>`
	}
	return `<span class="func-preview">${nameHtml}${subBox}<span class="func-preview__box"></span></span>`
}

/** 6 张极限和对数卡：log 带底数 / log / lim / min / max / ln */
export const limitLogFormats: FunctionFormat[] = [
	{ id: 'logBase', name: 'log', sub: '', preview: limitLogPreview('log', { sub: true }) },
	{ id: 'log', name: 'log', preview: limitLogPreview('log') },
	{ id: 'lim', name: 'lim', sub: '', subUnder: true, preview: limitLogPreview('lim', { sub: true, under: true }) },
	{ id: 'min', name: 'min', sub: '', subUnder: true, preview: limitLogPreview('min', { sub: true, under: true }) },
	{ id: 'max', name: 'max', sub: '', subUnder: true, preview: limitLogPreview('max', { sub: true, under: true }) },
	{ id: 'ln', name: 'ln', preview: limitLogPreview('ln') }
]

/** 2 张常用极限模板：下标用 Unicode（→∞ / ≤），解析成结构化函数节点 */
export const commonLimitLogs: CommonFunction[] = [
	{
		id: 'limitE',
		latex: '\\lim_{n→∞}{\\left(1+\\frac{1}{n}\\right)^{n}}',
		preview: `<span class="func-preview func-preview--under"><span class="func-preview__head"><span class="func-preview__name">lim</span><span class="func-preview__sub">n→∞</span></span><span class="func-preview__arg">(1+${frac(
			'1',
			'n'
		)})<sup>n</sup></span></span>`
	},
	{
		id: 'maxExp',
		latex: '\\max_{0≤x≤1}{xe^{-x^{2}}}',
		preview: `<span class="func-preview func-preview--under"><span class="func-preview__head"><span class="func-preview__name">max</span><span class="func-preview__sub">0≤x≤1</span></span><span class="func-preview__arg">xe<sup>−x²</sup></span></span>`
	}
]

export const allFunctionFormats = [
	...functionFormats,
	...inverseFunctionFormats,
	...hyperbolicFunctionFormats,
	...inverseHyperbolicFunctionFormats,
	...limitLogFormats
]
export const functionFormatById = new Map<FunctionFormatId, FunctionFormat>(
	allFunctionFormats.map((item) => [item.id as FunctionFormatId, item])
)
