import type { BracketFormat, BracketFormatId, CommonBracketFormula, SeparatorBracketFormat, StackFormat } from './types'

/** 生成括号预览：虚线空框两侧加定界符，仅用于工具栏弹窗 */
export const bracketPreview = (left: string, right: string) =>
	`<span class="bracket-preview"><span class="bracket-preview__delim">${left}</span><span class="bracket-preview__box"></span><span class="bracket-preview__delim">${right}</span></span>`

/** 12 种括号模板，顺序即弹层 4 列 × 3 行的展示顺序 */
export const bracketFormats: BracketFormat[] = [
	{ id: 'paren', preview: bracketPreview('(', ')'), left: '(', right: ')', glyphLeft: '(', glyphRight: ')' },
	{ id: 'bracket', preview: bracketPreview('[', ']'), left: '[', right: ']', glyphLeft: '[', glyphRight: ']' },
	{ id: 'brace', preview: bracketPreview('{', '}'), left: '\\{', right: '\\}', glyphLeft: '{', glyphRight: '}' },
	{
		id: 'angle',
		preview: bracketPreview('⟨', '⟩'),
		left: '\\langle',
		right: '\\rangle',
		glyphLeft: '⟨',
		glyphRight: '⟩'
	},
	{
		id: 'floor',
		preview: bracketPreview('⌊', '⌋'),
		left: '\\lfloor',
		right: '\\rfloor',
		glyphLeft: '⌊',
		glyphRight: '⌋'
	},
	{
		id: 'ceil',
		preview: bracketPreview('⌈', '⌉'),
		left: '\\lceil',
		right: '\\rceil',
		glyphLeft: '⌈',
		glyphRight: '⌉'
	},
	{ id: 'bar', preview: bracketPreview('|', '|'), left: '|', right: '|', glyphLeft: '|', glyphRight: '|' },
	{ id: 'dbar', preview: bracketPreview('‖', '‖'), left: '\\|', right: '\\|', glyphLeft: '‖', glyphRight: '‖' },
	{ id: 'leftOpen', preview: bracketPreview('[', '['), left: '[', right: '[', glyphLeft: '[', glyphRight: '[' },
	{ id: 'leftClose', preview: bracketPreview(']', ']'), left: ']', right: ']', glyphLeft: ']', glyphRight: ']' },
	{ id: 'reverse', preview: bracketPreview(']', '['), left: ']', right: '[', glyphLeft: ']', glyphRight: '[' },
	{
		id: 'doubleBracket',
		preview: bracketPreview('⟦', '⟧'),
		left: '\\lbrack\\lbrack',
		right: '\\rbrack\\rbrack',
		glyphLeft: '⟦',
		glyphRight: '⟧'
	}
]

/** 生成单侧括号预览：只画一侧定界符，另一侧是虚线空框 */
export const singleBracketPreview = (glyph: string, side: 'left' | 'right') => {
	const box = '<span class="bracket-preview__box"></span>'
	const delim = `<span class="bracket-preview__delim">${glyph}</span>`
	return `<span class="bracket-preview">${side === 'left' ? delim + box : box + delim}</span>`
}

/** 单侧括号：另一侧用空定界符 `.`，编辑区不显示该侧字符 */
export const singleBracket = (
	id: BracketFormatId,
	left: string,
	right: string,
	glyphLeft: string,
	glyphRight: string
): BracketFormat => ({
	id,
	preview: singleBracketPreview(glyphLeft || glyphRight, glyphLeft ? 'left' : 'right'),
	left,
	right,
	glyphLeft,
	glyphRight
})

/** 18 种单方括号模板，顺序即弹层 4 列 × 5 行的展示顺序（左、右成对相邻） */
export const singleBracketFormats: BracketFormat[] = [
	singleBracket('singleParenOpen', '(', '.', '(', ''),
	singleBracket('singleParenClose', '.', ')', '', ')'),
	singleBracket('singleBracketOpen', '[', '.', '[', ''),
	singleBracket('singleBracketClose', '.', ']', '', ']'),
	singleBracket('singleBraceOpen', '\\{', '.', '{', ''),
	singleBracket('singleBraceClose', '.', '\\}', '', '}'),
	singleBracket('singleAngleOpen', '\\langle', '.', '⟨', ''),
	singleBracket('singleAngleClose', '.', '\\rangle', '', '⟩'),
	singleBracket('singleFloorOpen', '\\lfloor', '.', '⌊', ''),
	singleBracket('singleFloorClose', '.', '\\rfloor', '', '⌋'),
	singleBracket('singleCeilOpen', '\\lceil', '.', '⌈', ''),
	singleBracket('singleCeilClose', '.', '\\rceil', '', '⌉'),
	singleBracket('singleBarOpen', '|', '.', '|', ''),
	singleBracket('singleBarClose', '.', '|', '', '|'),
	singleBracket('singleDbarOpen', '\\|', '.', '‖', ''),
	singleBracket('singleDbarClose', '.', '\\|', '', '‖'),
	singleBracket('singleDoubleOpen', '\\lbrack\\lbrack', '.', '⟦', ''),
	singleBracket('singleDoubleClose', '.', '\\rbrack\\rbrack', '', '⟧')
]

/** 解析反查：(left, right) → 格式 id；匹配失败时降级为普通文本 */
export const bracketFormatByDelims = new Map<string, BracketFormatId>(
	[...bracketFormats, ...singleBracketFormats].map((item) => [`${item.left}\u0000${item.right}`, item.id])
)

export const bracketFormatById = new Map<BracketFormatId, BracketFormat>(
	[...bracketFormats, ...singleBracketFormats].map((item) => [item.id, item])
)

/** 生成带分隔符的括号预览：多个虚线空框之间加竖线 */
export const separatorBracketPreview = (format: BracketFormat, groups: number) => {
	const boxes = Array.from({ length: groups }, () => '<span class="bracket-preview__box"></span>').join(
		'<span class="bracket-preview__sep">|</span>'
	)
	return `<span class="bracket-preview"><span class="bracket-preview__delim">${format.glyphLeft}</span>${boxes}<span class="bracket-preview__delim">${format.glyphRight}</span></span>`
}

/** 4 种带分隔符的括号模板，顺序即弹层 1 行 × 4 列的展示顺序 */
export const separatorBracketFormats: SeparatorBracketFormat[] = [
	{
		id: 'sepParen',
		preview: separatorBracketPreview(bracketFormatById.get('paren')!, 2),
		format: 'paren',
		groups: 2
	},
	{
		id: 'sepBrace',
		preview: separatorBracketPreview(bracketFormatById.get('brace')!, 2),
		format: 'brace',
		groups: 2
	},
	{
		id: 'sepAngle2',
		preview: separatorBracketPreview(bracketFormatById.get('angle')!, 2),
		format: 'angle',
		groups: 2
	},
	{
		id: 'sepAngle3',
		preview: separatorBracketPreview(bracketFormatById.get('angle')!, 3),
		format: 'angle',
		groups: 3
	}
]

/** 生成堆栈预览：可选左右定界符 + 竖向排列的虚线空框 */
export const stackPreview = (rows: number, left = '', right = '') => {
	const boxes = Array.from({ length: rows }, () => '<span class="stack-preview__box"></span>').join('')
	const delim = (glyph: string) =>
		glyph ? `<span class="stack-preview__delim">${glyph}</span>` : ''
	return `<span class="stack-preview">${delim(left)}<span class="stack-preview__rows">${boxes}</span>${delim(right)}</span>`
}

/** 4 种事例与堆栈模板：前两张左侧花括号，后两张无定界符 / 圆括号 */
export const stackFormats: StackFormat[] = [
	{ id: 'cases2', preview: stackPreview(2, '{'), style: 'cases', rows: 2, wrap: null },
	{ id: 'cases3', preview: stackPreview(3, '{'), style: 'cases', rows: 3, wrap: null },
	{ id: 'stack2', preview: stackPreview(2), style: 'matrix', rows: 2, wrap: null },
	{ id: 'parenStack2', preview: stackPreview(2, '(', ')'), style: 'matrix', rows: 2, wrap: 'paren' }
]

/** 3 个常用方括号模板：分段函数 / 组合数（圆括号、尖括号） */
export const commonBracketFormulas: CommonBracketFormula[] = [
	{
		id: 'commonCases',
		latex: 'f(x)=\\begin{cases}-x, x<0\\\\x, x≥0\\end{cases}',
		preview: `f(x)=${stackPreview(2, '{')}`
	},
	{
		id: 'commonBinomParen',
		latex: '\\left(\\begin{matrix}n\\\\k\\end{matrix}\\right)',
		preview: stackPreview(2, '(', ')')
	},
	{
		id: 'commonBinomAngle',
		latex: '\\left\\langle\\begin{matrix}n\\\\k\\end{matrix}\\right\\rangle',
		preview: stackPreview(2, '⟨', '⟩')
	}
]
