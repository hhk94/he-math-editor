import type { CommonScript, ScriptFormat } from './types'

/** 生成上下标格式预览，仅用于工具栏弹窗 */
export const scriptPreview = (sup: boolean, sub: boolean, pre = false) => {
	const stack = [
		sup ? '<span class="script-preview__slot"></span>' : '',
		sub ? '<span class="script-preview__slot"></span>' : ''
	].join('')
	return `<span class="script-preview${pre ? ' script-preview--pre' : ''}"><span class="script-preview__base">x</span><span class="script-preview__stack">${stack}</span></span>`
}

export const scriptFormats: ScriptFormat[] = [
	{ id: 'sup', preview: scriptPreview(true, false) },
	{ id: 'sub', preview: scriptPreview(false, true) },
	{ id: 'both', preview: scriptPreview(true, true) },
	{ id: 'pre', preview: scriptPreview(true, true, true) }
]

export const commonScripts: CommonScript[] = [
	{
		label: 'x_{y^2}',
		latex: 'x_{y^2}',
		preview: '<span class="script-tpl">x<sub>y<sup>2</sup></sub></span>'
	},
	{
		label: 'e^{-iωt}',
		latex: 'e^{-iωt}',
		preview: '<span class="script-tpl">e<sup>−iωt</sup></span>'
	},
	{
		label: 'x^2',
		latex: 'x^2',
		preview: '<span class="script-tpl">x<sup>2</sup></span>'
	},
	{
		label: '{}_{1}^{n}Y',
		latex: '{}_{1}^{n}Y',
		preview: '<span class="script-tpl"><span class="script-tpl__pre"><span>n</span><span>1</span></span>Y</span>'
	}
]
