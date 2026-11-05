import type { CommonFraction, FractionFormat } from './types'
import { frac } from './previewUtils'

export const fractionFormats: FractionFormat[] = [
	{
		id: 'vertical',
		latex: '\\frac{a}{b}',
		preview: frac('a', 'b'),
		fraction: { num: 'a', den: 'b' }
	},
	{ id: 'horizontal', latex: 'a/b', preview: 'a/b' },
	{
		id: 'skewed',
		latex: '{}^{a}\\!/\\!_{b}',
		preview: 'a⁄b',
		fraction: { num: 'a', den: 'b', style: 'skewed' }
	},
	{
		id: 'small',
		latex: '\\tfrac{a}{b}',
		preview: frac('a', 'b', true),
		fraction: { num: 'a', den: 'b', style: 'small' }
	}
]

export const commonFractions: CommonFraction[] = [
	{ label: 'dy/dx', latex: '\\frac{dy}{dx}', preview: frac('dy', 'dx'), fraction: { num: 'dy', den: 'dx' } },
	{
		label: 'Δy/Δx',
		latex: '\\frac{\\Delta y}{\\Delta x}',
		preview: frac('Δy', 'Δx'),
		fraction: { num: 'Δy', den: 'Δx' }
	},
	{
		label: '∂y/∂x',
		latex: '\\frac{\\partial y}{\\partial x}',
		preview: frac('∂y', '∂x'),
		fraction: { num: '∂y', den: '∂x' }
	},
	{
		label: 'δy/δx',
		latex: '\\frac{\\delta y}{\\delta x}',
		preview: frac('δy', 'δx'),
		fraction: { num: 'δy', den: 'δx' }
	},
	{ label: 'π/2', latex: '\\frac{\\pi}{2}', preview: frac('π', '2'), fraction: { num: 'π', den: '2' } }
]
