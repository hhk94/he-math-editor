import type { Tool, ToolId } from './types'

export const symbols = [
	{ label: 'a/b', value: 'a/b' },
	{ label: '√x', value: '√x' },
	{ label: 'x²', value: 'x²' },
	{ label: 'lim', value: 'lim' },
	{ label: '∫', value: '∫' },
	{ label: 'Σ', value: 'Σ' },
	{ label: 'α', value: 'α' },
	{ label: 'π', value: 'π' },
	{ label: '∞', value: '∞' },
	{ label: '≤', value: '≤' },
	{ label: '≥', value: '≥' },
	{ label: '≠', value: '≠' }
]

/** 工具栏按钮；分数、上下标、根式、积分、大型运算符、括号、函数、导数符号、极限和对数、运算符已接入弹窗，其余暂未绑定行为 */
export const tools: Tool[] = [
	{ id: 'symbols', icon: 'Ω' },
	{ id: 'fraction', icon: '<span class="tb-frac"><span>X</span><span>Y</span></span>' },
	{ id: 'scripts', icon: 'e<sup>x</sup>' },
	{ id: 'radical', icon: '√x' },
	{ id: 'integral', icon: '∫<sup>x</sup><sub>-x</sub>' },
	{
		id: 'largeOperator',
		icon: '<span class="tb-limits"><span class="tb-limits__sup">n</span><span class="tb-limits__main">∑</span><span class="tb-limits__sub">i=0</span></span>'
	},
	{ id: 'bracket', icon: '{()}' },
	{ id: 'function', icon: 'sinθ' },
	{ id: 'derivative', icon: 'f′' },
	{
		id: 'limitLog',
		icon: '<span class="tb-limits"><span class="tb-limits__sup">lim</span><span class="tb-limits__sub">n→∞</span></span>'
	},
	{ id: 'operator', icon: '±' },
	{
		id: 'matrix',
		icon: '<span class="tb-matrix"><span class="tb-matrix__bracket">[</span><span class="tb-matrix__grid"><i>1</i><i>0</i><i>0</i><i>1</i></span><span class="tb-matrix__bracket">]</span></span>'
	}
]

export const symbolMap: Record<string, string> = {
	'*': '×',
	'-': '−',
	'/': '÷'
}

/** 已接入弹层的工具；其余按钮点击只关闭已打开的弹层 */
export const popoverToolIds = new Set<ToolId>([
	'fraction',
	'scripts',
	'radical',
	'integral',
	'largeOperator',
	'bracket',
	'function',
	'derivative',
	'limitLog',
	'operator'
])

