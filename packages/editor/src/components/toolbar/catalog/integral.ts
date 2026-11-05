import type { DifferentialFormat, IntegralFormat } from './types'
import { dashSlot } from './previewUtils'

/**
 * 生成积分预览，仅用于工具栏弹窗。
 * limits: none 无限界 / sup 仅上限 / both 上下限；网格布局把限界排到积分号右上、右下。
 */
export const integralPreview = (sign: string, limits: 'none' | 'sup' | 'both') => {
	const sub = limits === 'both' ? `<span class="math-int__sub">${dashSlot}</span>` : ''
	const sup = limits !== 'none' ? `<span class="math-int__sup">${dashSlot}</span>` : ''
	return `<span class="math-int"><span class="math-int__sign">${sign}</span>${sub}${sup}<span class="math-int__integrand">${dashSlot}</span></span>`
}

export const integralFormats: IntegralFormat[] = [
	{ id: 'int', sign: '∫', limits: 'none', preview: integralPreview('∫', 'none') },
	{ id: 'intSup', sign: '∫', limits: 'sup', preview: integralPreview('∫', 'sup') },
	{ id: 'intSubSup', sign: '∫', limits: 'both', preview: integralPreview('∫', 'both') },
	{ id: 'iint', sign: '∬', limits: 'none', preview: integralPreview('∬', 'none') },
	{ id: 'iintSup', sign: '∬', limits: 'sup', preview: integralPreview('∬', 'sup') },
	{ id: 'iintSubSup', sign: '∬', limits: 'both', preview: integralPreview('∬', 'both') },
	{ id: 'iiint', sign: '∭', limits: 'none', preview: integralPreview('∭', 'none') },
	{ id: 'iiintSup', sign: '∭', limits: 'sup', preview: integralPreview('∭', 'sup') },
	{ id: 'iiintSubSup', sign: '∭', limits: 'both', preview: integralPreview('∭', 'both') }
]

/**
 * 围道积分：∮ / ∯ / ∰ 三行 × 三种限界形式。
 * 复用普通积分的 me-int 结构与序列化，仅积分号不同。
 */
export const contourFormats: IntegralFormat[] = [
	{ id: 'oint', sign: '∮', limits: 'none', preview: integralPreview('∮', 'none') },
	{ id: 'ointSup', sign: '∮', limits: 'sup', preview: integralPreview('∮', 'sup') },
	{ id: 'ointSubSup', sign: '∮', limits: 'both', preview: integralPreview('∮', 'both') },
	{ id: 'oiint', sign: '∯', limits: 'none', preview: integralPreview('∯', 'none') },
	{ id: 'oiintSup', sign: '∯', limits: 'sup', preview: integralPreview('∯', 'sup') },
	{ id: 'oiintSubSup', sign: '∯', limits: 'both', preview: integralPreview('∯', 'both') },
	{ id: 'oiiint', sign: '∰', limits: 'none', preview: integralPreview('∰', 'none') },
	{ id: 'oiiintSup', sign: '∰', limits: 'sup', preview: integralPreview('∰', 'sup') },
	{ id: 'oiiintSubSup', sign: '∰', limits: 'both', preview: integralPreview('∰', 'both') }
]

/**
 * 微分：dx / dy / dθ 三个纯文本模板，插入当前光标所在槽位。
 * 用 Unicode θ 而不是 \theta：可编辑区不解析未知命令（与常用分数的 ± 同理）。
 */
export const differentialFormats: DifferentialFormat[] = [
	{ id: 'dx', latex: 'dx' },
	{ id: 'dy', latex: 'dy' },
	{ id: 'dtheta', latex: 'dθ' }
]
