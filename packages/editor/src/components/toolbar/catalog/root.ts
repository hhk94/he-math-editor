import type { CommonRoot, RootFormat } from './types'
import { dashSlot, frac } from './previewUtils'

/**
 * 生成根式预览，仅用于工具栏弹窗。
 * dash 为虚线空槽，表示插入后可编辑的根指数 / 被开方数。
 */

export const rootPreview = (radicand: string, index = '') =>
	`<span class="math-root">${index ? `<span class="math-root__index">${index}</span>` : ''}<span class="math-root__sign">√</span><span class="math-root__radicand">${radicand}</span></span>`

export const rootFormats: RootFormat[] = [
	{ id: 'square', preview: rootPreview(dashSlot), index: null },
	{ id: 'nth', preview: rootPreview(dashSlot, dashSlot), index: '' },
	{ id: 'squareIndex2', preview: rootPreview(dashSlot, '2'), index: '2' },
	{ id: 'cube', preview: rootPreview(dashSlot, '3'), index: '3' }
]

export const commonRoots: CommonRoot[] = [
	{
		label: '(-b±√(b²-4ac))/2a',
		// 用 ± 这类 Unicode 符号而不是 \pm：可编辑区不解析未知命令，\pm 会被当成文本显示
		latex: '\\frac{-b±\\sqrt{b^{2}-4ac}}{2a}',
		preview: frac(`−b ± ${rootPreview('b² − 4ac')}`, '2a')
	},
	{
		label: '√(a²+b²)',
		latex: '\\sqrt{a^{2}+b^{2}}',
		preview: rootPreview('a² + b²')
	}
]
