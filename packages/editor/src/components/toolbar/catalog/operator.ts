import type { ArrowFormat, ArrowKind, OperatorFormat } from './types'

/**
 * 基本运算符：前 4 张（:=、==、+=、−=）为纯文本模板；后 3 张上置叠等号为结构化 .me-op 节点
 * （上方记号槽可编辑 + 固定等号底座）。△ 没有可用 Unicode，序列化为 \triangleq 缩写。
 */
/** 上置叠等号预览：记号在上、等号在下 */
export const opStackPreview = (top: string) =>
	`<span class="op-stack"><span class="op-stack__top">${top}</span><span class="op-stack__eq">=</span></span>`

/** 7 张基本运算符卡：第一行 :=、==、+=、−=；第二行 def / m / △ 上置叠等号 */
export const operatorFormats: OperatorFormat[] = [
	{ id: 'colonEquals', latex: ':=', preview: ':=' },
	{ id: 'doubleEquals', latex: '==', preview: '==' },
	{ id: 'plusEquals', latex: '+=', preview: '+=' },
	{ id: 'minusEquals', latex: '−=', preview: '−=' },
	{ id: 'defEquals', variant: 'stackrel', top: 'def', preview: opStackPreview('def') },
	{ id: 'mEquals', variant: 'stackrel', top: 'm', preview: opStackPreview('m') },
	{ id: 'triangleEquals', variant: 'triangleq', top: '△', preview: opStackPreview('△') }
]

/**：12 张结构化 .me-arrow 卡（左 / 右箭头、双线左 / 右箭头、左右箭头、双线左右箭头，
 * 各带上方或下方标注槽）。左 / 右箭头序列化为 amsmath \xleftarrow / \xrightarrow（本地
 * MathJax 构建原生支持）；其余底座没有可用的可拉伸宏，用 \overset / \underset 组合输出。
 */
export const ARROW_GLYPH: Record<ArrowKind, string> = {
	left: '←',
	right: '→',
	doubleLeft: '⇐',
	doubleRight: '⇒',
	leftRight: '↔',
	leftRightDouble: '⇔'
}

/** \xleftarrow / \xrightarrow 以外底座的序列化宏（\overset / \underset 的内核） */
export const ARROW_BASE: Record<Exclude<ArrowKind, 'left' | 'right'>, string> = {
	doubleLeft: '\\Leftarrow',
	doubleRight: '\\Rightarrow',
	leftRight: '\\leftrightarrow',
	leftRightDouble: '\\Leftrightarrow'
}

/** 12 张运算符结构卡：第一行 ←→ 下 / 上标注，第二行 ⇐⇒ 下 / 上标注，第三行 ↔ 下 / 上、⇔ 下 / 上 */
export const arrowFormats: ArrowFormat[] = [
	{ id: 'xLeftBelow', kind: 'left', label: 'below' },
	{ id: 'xRightBelow', kind: 'right', label: 'below' },
	{ id: 'xLeftAbove', kind: 'left', label: 'above' },
	{ id: 'xRightAbove', kind: 'right', label: 'above' },
	{ id: 'xDoubleLeftBelow', kind: 'doubleLeft', label: 'below' },
	{ id: 'xDoubleRightBelow', kind: 'doubleRight', label: 'below' },
	{ id: 'xDoubleLeftAbove', kind: 'doubleLeft', label: 'above' },
	{ id: 'xDoubleRightAbove', kind: 'doubleRight', label: 'above' },
	{ id: 'xLeftRightBelow', kind: 'leftRight', label: 'below' },
	{ id: 'xLeftRightAbove', kind: 'leftRight', label: 'above' },
	{ id: 'xDoubleLeftRightBelow', kind: 'leftRightDouble', label: 'below' },
	{ id: 'xDoubleLeftRightAbove', kind: 'leftRightDouble', label: 'above' }
]

/** 运算符结构卡预览：虚线空标注框 + 箭头（above 时框在上，below 时框在下） */
export const arrowPreview = (kind: ArrowKind, label: 'above' | 'below') => {
	const box = '<span class="arrow-preview__label"></span>'
	const sign = `<span class="arrow-preview__sign">${ARROW_GLYPH[kind]}</span>`
	return `<span class="arrow-preview">${label === 'above' ? box + sign : sign + box}</span>`
}
