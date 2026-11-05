import type { BigOpFormat, CommonBigOp } from './types'
import { dashSlot, frac } from './previewUtils'

/**
 * 生成大型运算符预览，仅用于工具栏弹窗。
 * 堆叠式：符号居中，上下限堆叠在正上/正下（Word 模板）；
 * inline 行内式：限界排到右上/右下（同积分布局）。
 */
export const bigOpPreview = (sign: string, limits: 'none' | 'sup' | 'sub' | 'both', inline = false) => {
	const sub = limits === 'both' || limits === 'sub' ? `<span class="math-bigop__sub">${dashSlot}</span>` : ''
	const sup = limits === 'both' || limits === 'sup' ? `<span class="math-bigop__sup">${dashSlot}</span>` : ''
	return `<span class="math-bigop${inline ? ' math-bigop--inline' : ''}"><span class="math-bigop__sign">${sign}</span>${sup}${sub}<span class="math-bigop__operand">${dashSlot}</span></span>`
}

/**
 * 生成常用大型运算符模板预览（含实际内容，仅用于工具栏弹窗）。
 * sub / sup 传 null 表示该模板没有对应限界。
 */
export const commonBigOpPreview = (sign: string, sub: string | null, sup: string | null, operand: string) => {
	const subEl = sub !== null ? `<span class="math-bigop__sub">${sub}</span>` : ''
	const supEl = sup !== null ? `<span class="math-bigop__sup">${sup}</span>` : ''
	return `<span class="math-bigop"><span class="math-bigop__sign">${sign}</span>${supEl}${subEl}<span class="math-bigop__operand">${operand}</span></span>`
}

/** 求和 5 卡：对应 Word「大型运算符 → 求和」分区的 5 张模板 */
export const sumFormats: BigOpFormat[] = [
	{ id: 'sum', sign: '∑', preview: bigOpPreview('∑', 'none'), limits: 'none', inline: false },
	{ id: 'sumSup', sign: '∑', preview: bigOpPreview('∑', 'sup'), limits: 'sup', inline: false },
	{ id: 'sumSub', sign: '∑', preview: bigOpPreview('∑', 'sub'), limits: 'sub', inline: false },
	{ id: 'sumSubSup', sign: '∑', preview: bigOpPreview('∑', 'both'), limits: 'both', inline: false },
	{ id: 'sumInline', sign: '∑', preview: bigOpPreview('∑', 'both', true), limits: 'both', inline: true }
]

/**
 * 乘积与副积 10 卡：第一行 ∏ 乘积、第二行 ∐ 副积，
 * 每行 5 种形式与求和一致（无界限 / 上限 / 下限 / 上下限 / 上下标）。
 */
export const productFormats: BigOpFormat[] = [
	{ id: 'prod', sign: '∏', preview: bigOpPreview('∏', 'none'), limits: 'none', inline: false },
	{ id: 'prodSup', sign: '∏', preview: bigOpPreview('∏', 'sup'), limits: 'sup', inline: false },
	{ id: 'prodSub', sign: '∏', preview: bigOpPreview('∏', 'sub'), limits: 'sub', inline: false },
	{ id: 'prodSubSup', sign: '∏', preview: bigOpPreview('∏', 'both'), limits: 'both', inline: false },
	{ id: 'prodInline', sign: '∏', preview: bigOpPreview('∏', 'both', true), limits: 'both', inline: true },
	{ id: 'coprod', sign: '∐', preview: bigOpPreview('∐', 'none'), limits: 'none', inline: false },
	{ id: 'coprodSup', sign: '∐', preview: bigOpPreview('∐', 'sup'), limits: 'sup', inline: false },
	{ id: 'coprodSub', sign: '∐', preview: bigOpPreview('∐', 'sub'), limits: 'sub', inline: false },
	{ id: 'coprodSubSup', sign: '∐', preview: bigOpPreview('∐', 'both'), limits: 'both', inline: false },
	{ id: 'coprodInline', sign: '∐', preview: bigOpPreview('∐', 'both', true), limits: 'both', inline: true }
]

/**
 * 并集和交集 10 卡：第一行 ⋃ 并集、第二行 ⋂ 交集，
 * 每行 5 种形式（无界限 / 带上下限 / 带上下标 / 带下限 / 带下标）。
 */
export const unionFormats: BigOpFormat[] = [
	{ id: 'union', sign: '⋃', preview: bigOpPreview('⋃', 'none'), limits: 'none', inline: false },
	{ id: 'unionSubSup', sign: '⋃', preview: bigOpPreview('⋃', 'both'), limits: 'both', inline: false },
	{ id: 'unionInline', sign: '⋃', preview: bigOpPreview('⋃', 'both', true), limits: 'both', inline: true },
	{ id: 'unionSub', sign: '⋃', preview: bigOpPreview('⋃', 'sub'), limits: 'sub', inline: false },
	{ id: 'unionSubInline', sign: '⋃', preview: bigOpPreview('⋃', 'sub', true), limits: 'sub', inline: true },
	{ id: 'intersection', sign: '⋂', preview: bigOpPreview('⋂', 'none'), limits: 'none', inline: false },
	{ id: 'intersectionSubSup', sign: '⋂', preview: bigOpPreview('⋂', 'both'), limits: 'both', inline: false },
	{ id: 'intersectionInline', sign: '⋂', preview: bigOpPreview('⋂', 'both', true), limits: 'both', inline: true },
	{ id: 'intersectionSub', sign: '⋂', preview: bigOpPreview('⋂', 'sub'), limits: 'sub', inline: false },
	{ id: 'intersectionSubInline', sign: '⋂', preview: bigOpPreview('⋂', 'sub', true), limits: 'sub', inline: true }
]

/**
 * 其他大型运算符 10 卡：第一行 ⋁ 或运算、第二行 ⋀ 与运算，
 * 每行 5 种形式（无界限 / 带上下限 / 带上下标 / 带下限 / 带下标）。
 */
export const otherFormats: BigOpFormat[] = [
	{ id: 'bigvee', sign: '⋁', preview: bigOpPreview('⋁', 'none'), limits: 'none', inline: false },
	{ id: 'bigveeSubSup', sign: '⋁', preview: bigOpPreview('⋁', 'both'), limits: 'both', inline: false },
	{ id: 'bigveeInline', sign: '⋁', preview: bigOpPreview('⋁', 'both', true), limits: 'both', inline: true },
	{ id: 'bigveeSub', sign: '⋁', preview: bigOpPreview('⋁', 'sub'), limits: 'sub', inline: false },
	{ id: 'bigveeSubInline', sign: '⋁', preview: bigOpPreview('⋁', 'sub', true), limits: 'sub', inline: true },
	{ id: 'bigwedge', sign: '⋀', preview: bigOpPreview('⋀', 'none'), limits: 'none', inline: false },
	{ id: 'bigwedgeSubSup', sign: '⋀', preview: bigOpPreview('⋀', 'both'), limits: 'both', inline: false },
	{ id: 'bigwedgeInline', sign: '⋀', preview: bigOpPreview('⋀', 'both', true), limits: 'both', inline: true },
	{ id: 'bigwedgeSub', sign: '⋀', preview: bigOpPreview('⋀', 'sub'), limits: 'sub', inline: false },
	{ id: 'bigwedgeSubInline', sign: '⋀', preview: bigOpPreview('⋀', 'sub', true), limits: 'sub', inline: true }
]

/**
 * 常用大型运算符 5 卡：预填完整内容的成品模板（Word「常用大型运算符」）。
 * 编辑区无 \binom / 多行下限结构，组合数以括号小分数近似、
 * 多条件下限折衷为单行文本；模板 2 的表达式留空（虚线槽）供用户填写。
 */
export const commonBigOps: CommonBigOp[] = [
	{
		id: 'commonSumBinom',
		label: '∑_k (n k)',
		latex: '\\sum_{k}{(\\tfrac{n}{k})}',
		preview: commonBigOpPreview('∑', 'k', null, `(${frac('n', 'k', true)})`)
	},
	{
		id: 'commonSumLimits',
		label: '∑_{i=0}^{n} □',
		latex: '\\sum_{i=0}^{n}{}',
		preview: commonBigOpPreview('∑', 'i=0', 'n', dashSlot)
	},
	{
		id: 'commonSumConditions',
		label: '∑_{0≤i≤m, 0<j<n} P(i,j)',
		latex: '\\sum_{0≤i≤m, 0<j<n}{P(i,j)}',
		preview: commonBigOpPreview('∑', '0≤i≤m<br>0&lt;j&lt;n', null, 'P(i, j)')
	},
	{
		id: 'commonProduct',
		label: '∏_{k=1}^{n} A_k',
		latex: '\\prod_{k=1}^{n}{A_k}',
		preview: commonBigOpPreview('∏', 'k=1', 'n', 'A<sub>k</sub>')
	},
	{
		id: 'commonUnion',
		label: '⋃_{i=1}^{m} (X_i ∩ Y_n)',
		latex: '\\bigcup_{i=1}^{m}{(X_i∩Y_n)}',
		preview: commonBigOpPreview('⋃', 'i=1', 'm', '(X<sub>i</sub> ∩ Y<sub>n</sub>)')
	}
]
