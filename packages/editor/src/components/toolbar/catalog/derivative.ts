import type { DerivFormat } from './types'

/** 生成导数符号卡片预览：虚线参数框 + 上方/下方记号，多行括号用两个参数框示意，仅用于工具栏弹窗 */
export const derivPreview = (mark: string, placement: 'over' | 'under', boxes = 1) => {
	const box = '<span class="accent-preview__box"></span>'
	const sign = `<span class="accent-preview__mark">${mark}</span>`
	if (boxes > 1) return `<span class="accent-preview">${box}${sign}${box}</span>`
	return placement === 'over'
		? `<span class="accent-preview">${sign}${box}</span>`
		: `<span class="accent-preview">${box}${sign}</span>`
}

/** 双横线用两层 \bar 实现，预告里两个横线叠在参数框上方 */
export const doubleBarPreview = `<span class="accent-preview"><span class="accent-preview__mark">¯</span><span class="accent-preview__mark">¯</span><span class="accent-preview__box"></span></span>`

/** 顶线 / 底线预览：虚线参数框上方或下方加一条实线 */
export const rulePreview = (placement: 'over' | 'under') =>
	`<span class="accent-preview accent-preview--rule-${placement}"><span class="accent-preview__box"></span></span>`

/** 常用导数对象预览：参数内容上方加一条实线 */
export const objectPreview = (content: string) =>
	`<span class="accent-preview accent-preview--rule-over"><span class="accent-preview__text">${content}</span></span>`

/** 带框公式预览：空框卡只显示虚线占位，宽带卡显示框内的勾股定理 */
export const boxedPreview = `<span class="accent-preview"><span class="accent-preview__box"></span></span>`
export const boxedFormulaPreview = `<span class="accent-preview accent-preview--boxed">a² = b² + c²</span>`

/** 20 种导数符号，顺序即弹层 4 列 × 5 行的展示顺序 */
export const derivFormats: DerivFormat[] = [
	{ id: 'dot', node: 'dot', mark: '˙', placement: 'over', command: '\\dot', preview: derivPreview('˙', 'over') },
	{ id: 'ddot', node: 'ddot', mark: '˙˙', placement: 'over', command: '\\ddot', preview: derivPreview('˙˙', 'over') },
	{ id: 'dddot', node: 'dddot', mark: '˙˙˙', placement: 'over', command: '\\dddot', preview: derivPreview('˙˙˙', 'over') },
	{ id: 'hat', node: 'hat', mark: 'ˆ', placement: 'over', command: '\\hat', preview: derivPreview('ˆ', 'over') },
	{ id: 'check', node: 'check', mark: 'ˇ', placement: 'over', command: '\\check', preview: derivPreview('ˇ', 'over') },
	{ id: 'acute', node: 'acute', mark: '´', placement: 'over', command: '\\acute', preview: derivPreview('´', 'over') },
	{ id: 'grave', node: 'grave', mark: '`', placement: 'over', command: '\\grave', preview: derivPreview('`', 'over') },
	{ id: 'tilde', node: 'tilde', mark: '˜', placement: 'over', command: '\\tilde', preview: derivPreview('˜', 'over') },
	{ id: 'breve', node: 'breve', mark: '˘', placement: 'over', command: '\\breve', preview: derivPreview('˘', 'over') },
	{ id: 'bar', node: 'bar', mark: '¯', placement: 'over', command: '\\bar', preview: derivPreview('¯', 'over') },
	{ id: 'doublebar', node: 'bar', mark: '¯', placement: 'over', command: '\\bar', preview: doubleBarPreview, nested: true },
	{ id: 'overbrace', node: 'overbrace', mark: '⏞', placement: 'over', command: '\\overbrace', preview: derivPreview('⏞', 'over') },
	{ id: 'underbrace', node: 'underbrace', mark: '⏟', placement: 'under', command: '\\underbrace', preview: derivPreview('⏟', 'under') },
	{ id: 'overbracelabel', node: 'overbrace', mark: '⏞', placement: 'over', command: '\\overbrace', preview: derivPreview('⏞', 'over', 2), labeled: true },
	{ id: 'underbracelabel', node: 'underbrace', mark: '⏟', placement: 'under', command: '\\underbrace', preview: derivPreview('⏟', 'under', 2), labeled: true },
	{ id: 'leftarrow', node: 'leftarrow', mark: '←', placement: 'over', command: '\\overleftarrow', preview: derivPreview('←', 'over') },
	{ id: 'rightarrow', node: 'rightarrow', mark: '→', placement: 'over', command: '\\overrightarrow', preview: derivPreview('→', 'over') },
	{ id: 'leftrightarrow', node: 'leftrightarrow', mark: '↔', placement: 'over', command: '\\overleftrightarrow', preview: derivPreview('↔', 'over') },
	{ id: 'leftharpoon', node: 'leftharpoon', mark: '↼', placement: 'over', command: '\\overleftharpoon', preview: derivPreview('↼', 'over') },
	{ id: 'rightharpoon', node: 'rightharpoon', mark: '⇀', placement: 'over', command: '\\overrightharpoon', preview: derivPreview('⇀', 'over') }
]

/** 带框公式板块：空框一张，宽带卡预填勾股定理 */
export const derivBoxedFormats: DerivFormat[] = [
	{ id: 'boxed', node: 'boxed', mark: '', placement: 'over', command: '\\boxed', preview: boxedPreview, boxed: true },
	{
		id: 'boxedformula',
		node: 'boxed',
		mark: '',
		placement: 'over',
		command: '\\boxed',
		preview: boxedFormulaPreview,
		boxed: true,
		latex: 'a^{2}=b^{2}+c^{2}',
		wide: true
	}
]

/** 顶线和底线板块：记号位置用横线绘制 */
export const derivLineFormats: DerivFormat[] = [
	{ id: 'overline', node: 'overline', mark: '', placement: 'over', command: '\\overline', preview: rulePreview('over'), rule: 'over' },
	{ id: 'underline', node: 'underline', mark: '', placement: 'under', command: '\\underline', preview: rulePreview('under'), rule: 'under' }
]

/** 常用导数对象板块：顶线 + 预填对象，最后一张为宽卡 */
export const derivObjectFormats: DerivFormat[] = [
	{
		id: 'objectA',
		node: 'overline',
		mark: '',
		placement: 'over',
		command: '\\overline',
		preview: objectPreview('A'),
		rule: 'over',
		latex: 'A'
	},
	{
		id: 'objectABC',
		node: 'overline',
		mark: '',
		placement: 'over',
		command: '\\overline',
		preview: objectPreview('ABC'),
		rule: 'over',
		latex: 'ABC'
	},
	{
		id: 'objectXorY',
		node: 'overline',
		mark: '',
		placement: 'over',
		command: '\\overline',
		preview: objectPreview('x⊕y'),
		rule: 'over',
		latex: 'x⊕y',
		wide: true
	}
]

export const allDerivFormats = [
	...derivFormats,
	...derivBoxedFormats,
	...derivLineFormats,
	...derivObjectFormats
]
export const derivFormatById = new Map(
	allDerivFormats.filter((item) => !item.nested).map((item) => [item.node, item] as const)
)
