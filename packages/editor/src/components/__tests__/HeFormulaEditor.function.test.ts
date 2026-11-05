import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 函数（三角函数）的单元测试
 * 覆盖：6 张卡片弹层 / 插入与序列化 / LaTeX 解析与往返 / 参数槽输入 / 导航 / 整块删除
 */

// ============ 挂载与操作辅助 ============

const mountEditor = (modelValue = '') =>
	mount(HeFormulaEditor, {
		props: { modelValue },
		global: {
			plugins: [i18n],
			stubs: { HeMathPreview: true }
		},
		attachTo: document.body
	})

/** 最后一次 update:modelValue（可编辑区序列化后的 LaTeX） */
const lastEmitted = (wrapper: VueWrapper<any>): string => {
	const events = wrapper.emitted('update:modelValue')
	return events?.length ? (events[events.length - 1]![0] as string) : ''
}

/** 打开函数弹层 */
const openFunction = async (wrapper: VueWrapper<any>) => {
	await wrapper.find('button[title="函数"]').trigger('click')
}

/** 点击函数弹层里的第 n 张卡 */
const pickCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
	await cards[index]!.trigger('click')
}

/** selection 起点对应的元素（文本节点则取父元素） */
const rangeAnchor = (range: Range): HTMLElement | null =>
	range.startContainer.nodeType === Node.TEXT_NODE
		? range.startContainer.parentElement
		: (range.startContainer as HTMLElement)

/** 当前光标所在的 contenteditable 槽位（同组件 getActiveSlot 的解析方式） */
const currentSlot = (): HTMLElement | null => {
	const selection = window.getSelection()
	if (!selection?.rangeCount) return null
	return (rangeAnchor(selection.getRangeAt(0))?.closest('[contenteditable]') as HTMLElement) ?? null
}

/** 当前光标（selection 起点）是否落在指定区域 */
const selectionIn = (selector: string): boolean => {
	const selection = window.getSelection()
	if (!selection?.rangeCount) return false
	return rangeAnchor(selection.getRangeAt(0))?.closest(selector) != null
}

/** 把光标放到槽位内指定字符偏移处 */
const placeCaret = (slot: HTMLElement, offset: number) => {
	const range = document.createRange()
	const textNode = slot.firstChild
	if (textNode && textNode.nodeType === Node.TEXT_NODE) range.setStart(textNode, offset)
	else range.setStart(slot, 0)
	range.collapse(true)
	const selection = window.getSelection()
	selection?.removeAllRanges()
	selection?.addRange(range)
}

/** 在当前光标槽位上派发键盘事件（冒泡到可编辑区根节点） */
const pressKey = (key: string) => {
	const target = currentSlot() ?? document.body
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

/** 派发 input 事件，触发可编辑区同步序列化 */
const resyncFromDom = async (wrapper: VueWrapper<any>) => {
	;(wrapper.find('.he-formula-editable').element as HTMLElement).dispatchEvent(new Event('input'))
	await nextTick()
}

/** 六张三角函数卡：序号 / 函数名 / 卡片标题 */
const FUNCTION_CASES: [number, string, string][] = [
	[0, 'sin', '正弦 sin'],
	[1, 'cos', '余弦 cos'],
	[2, 'tan', '正切 tan'],
	[3, 'csc', '余割 csc'],
	[4, 'sec', '正割 sec'],
	[5, 'cot', '余切 cot']
]

/** 六张反函数卡：序号 / id / 序列化命令 / 显示名 / 卡片标题 */
const INVERSE_CASES: [number, string, string, string, string][] = [
	[6, 'arcsin', '\\sin^{-1}', 'sin', '反正弦 sin⁻¹'],
	[7, 'arccos', '\\cos^{-1}', 'cos', '反余弦 cos⁻¹'],
	[8, 'arctan', '\\tan^{-1}', 'tan', '反正切 tan⁻¹'],
	[9, 'arccsc', '\\csc^{-1}', 'csc', '反余割 csc⁻¹'],
	[10, 'arcsec', '\\sec^{-1}', 'sec', '反正割 sec⁻¹'],
	[11, 'arccot', '\\cot^{-1}', 'cot', '反余切 cot⁻¹']
]

/** 六张双曲函数卡：序号 / id / 显示名 / 卡片标题 */
const HYPERBOLIC_CASES: [number, string, string, string][] = [
	[12, 'sinh', 'sinh', '双曲正弦 sinh'],
	[13, 'cosh', 'cosh', '双曲余弦 cosh'],
	[14, 'tanh', 'tanh', '双曲正切 tanh'],
	[15, 'csch', 'csch', '双曲余割 csch'],
	[16, 'sech', 'sech', '双曲正割 sech'],
	[17, 'coth', 'coth', '双曲余切 coth']
]

/** 六张反双曲函数卡：序号 / id / 序列化命令 / 显示名 / 卡片标题 */
const INVERSE_HYPERBOLIC_CASES: [number, string, string, string, string][] = [
	[18, 'arcsinh', '\\sinh^{-1}', 'sinh', '反双曲正弦 sinh⁻¹'],
	[19, 'arccosh', '\\cosh^{-1}', 'cosh', '反双曲余弦 cosh⁻¹'],
	[20, 'arctanh', '\\tanh^{-1}', 'tanh', '反双曲正切 tanh⁻¹'],
	[21, 'arccsch', '\\csch^{-1}', 'csch', '反双曲余割 csch⁻¹'],
	[22, 'arcsech', '\\sech^{-1}', 'sech', '反双曲正割 sech⁻¹'],
	[23, 'arccoth', '\\coth^{-1}', 'coth', '反双曲余切 coth⁻¹']
]

/** 三张常用函数卡：序号 / id / 插入 LaTeX / 卡片标题 */
const COMMON_CASES: [number, string, string, string][] = [
	[24, 'sinTheta', '\\sin{θ}', '正弦 sin θ'],
	[25, 'cosTwoX', '\\cos{2x}', '余弦 cos 2x'],
	[26, 'tanIdentity', '\\tan{θ}=\\frac{\\sin{θ}}{\\cos{θ}}', '正切恒等式 tan θ = sin θ / cos θ']
]

let wrapper: VueWrapper<any> | null = null

beforeEach(() => {
	document.body.innerHTML = ''
	window.getSelection()?.removeAllRanges()
})

afterEach(() => {
	wrapper?.unmount()
	wrapper = null
})

// ============ 弹层 ============

describe('三角函数弹层', () => {
	it('点击工具栏按钮打开弹层，标题为函数且包含五个板块共 27 张卡', async () => {
		wrapper = mountEditor()
		await openFunction(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.exists()).toBe(true)
		expect(dialog.attributes('aria-label')).toBe('函数')
		expect(dialog.findAll('.he-tool-popover__section').map((el) => el.text())).toEqual([
			'三角函数',
			'反函数',
			'双曲函数',
			'反双曲函数',
			'常用函数'
		])
		const cards = dialog.findAll('.he-tool-card')
		expect(cards).toHaveLength(27)
		expect(cards.map((card) => card.attributes('title'))).toEqual([
			...FUNCTION_CASES.map(([, , title]) => title),
			...INVERSE_CASES.map(([, , , , title]) => title),
			...HYPERBOLIC_CASES.map(([, , , title]) => title),
			...INVERSE_HYPERBOLIC_CASES.map(([, , , , title]) => title),
			...COMMON_CASES.map(([, , , title]) => title)
		])
	})

	it('再次点击工具栏按钮关闭弹层', async () => {
		wrapper = mountEditor()
		await openFunction(wrapper)
		await openFunction(wrapper)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
	})

	it('打开函数弹层会关闭已打开的括号弹层', async () => {
		wrapper = mountEditor()
		await wrapper.find('button[title="括号"]').trigger('click')
		expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('方括号')

		await openFunction(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.attributes('aria-label')).toBe('函数')
		expect(wrapper.findAll('[role="dialog"]')).toHaveLength(1)
	})
})

// ============ 插入 ============

describe('插入三角函数', () => {
	it.each(FUNCTION_CASES)('点击第 %i 张卡插入 %s：函数名不可编辑，光标落在参数槽', async (index, name) => {
		wrapper = mountEditor()
		await openFunction(wrapper)
		await pickCard(wrapper, index)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
		const func = wrapper.find('.me-func')
		expect(func.exists()).toBe(true)
		expect((func.element as HTMLElement).dataset.func).toBe(name)
		expect(func.find('.me-func__name').text()).toBe(name)
		expect(func.find('.me-func__name').attributes('contenteditable')).toBeUndefined()
		expect(func.find('.me-func__arg .me-text-slot').exists()).toBe(true)
		expect(selectionIn('.me-func__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe(`\\${name}{}`)
	})
})

// ============ 反函数 ============

describe('插入反函数', () => {
	it.each(INVERSE_CASES)(
		'点击第 %i 张卡插入 %s：%s⁻¹ 上标与参数槽',
		async (index, id, command, base) => {
			wrapper = mountEditor()
			await openFunction(wrapper)
			await pickCard(wrapper, index)

			expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
			const func = wrapper.find('.me-func')
			expect(func.exists()).toBe(true)
			expect((func.element as HTMLElement).dataset.func).toBe(id)
			expect(func.find('.me-func__name').text()).toBe(`${base}−1`)
			expect(func.find('.me-func__sup').text()).toBe('−1')
			expect(func.find('.me-func__sup').attributes('contenteditable')).toBeUndefined()
			expect(func.find('.me-func__arg .me-text-slot').exists()).toBe(true)
			expect(selectionIn('.me-func__arg')).toBe(true)
			expect(lastEmitted(wrapper)).toBe(`${command}{}`)
		}
	)
})

describe('反函数解析与往返', () => {
	const INVERSE_PARSE_CASES: [string, string, string, string][] = [
		['\\sin^{-1}{x}', 'arcsin', 'sin', 'x'],
		['\\cos^{-1}{y}', 'arccos', 'cos', 'y'],
		['\\tan^{-1}{θ}', 'arctan', 'tan', 'θ'],
		['\\csc^{-1}{a}', 'arccsc', 'csc', 'a'],
		['\\sec^{-1}{b}', 'arcsec', 'sec', 'b'],
		['\\cot^{-1}{c}', 'arccot', 'cot', 'c']
	]

	it.each(INVERSE_PARSE_CASES)('%s 解析为 %s 节点并原样序列化', async (latex, id, base, argument) => {
		wrapper = mountEditor(latex)

		const func = wrapper.find('.me-func')
		expect(func.exists()).toBe(true)
		expect((func.element as HTMLElement).dataset.func).toBe(id)
		expect(func.find('.me-func__name').text()).toBe(`${base}−1`)
		expect(func.find('.me-func__arg').text()).toBe(argument)

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe(latex)
	})

	it('\\sin^{-1}{x} 不会被误判为参数为 -1 的 \\sin', () => {
		wrapper = mountEditor('\\sin^{-1}{x}')

		const func = wrapper.find('.me-func')
		expect((func.element as HTMLElement).dataset.func).toBe('arcsin')
		expect(func.find('.me-func__arg').text()).toBe('x')
	})

	it('反函数参数里的分式仍然结构化，往返保持不变', async () => {
		wrapper = mountEditor('\\sin^{-1}{\\frac{1}{2}}')

		const func = wrapper.find('.me-func')
		expect(func.find('.me-frac__num').text()).toBe('1')
		expect(func.find('.me-frac__den').text()).toBe('2')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sin^{-1}{\\frac{1}{2}}')
	})

	it('空参数序列化为 \\cos^{-1}{}，不吞掉后接文本', async () => {
		wrapper = mountEditor('\\cos^{-1}{}+1')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\cos^{-1}{}+1')
	})

	it('反函数参数槽末尾按 → 跳出到右侧，开头退格整块删除', () => {
		wrapper = mountEditor('\\tan^{-1}{x}+1')
		const slot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement

		placeCaret(slot, 1)
		pressKey('ArrowRight')
		expect(selectionIn('.me-func')).toBe(false)
		expect(currentSlot()?.textContent).toBe('+1')

		placeCaret(slot, 0)
		pressKey('Backspace')
		expect(wrapper.findAll('.me-func')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('+1')
	})
})

// ============ 双曲函数 ============

describe('插入双曲函数', () => {
	it.each(HYPERBOLIC_CASES)('点击第 %i 张卡插入 %s：函数名与参数槽', async (index, id, name) => {
		wrapper = mountEditor()
		await openFunction(wrapper)
		await pickCard(wrapper, index)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
		const func = wrapper.find('.me-func')
		expect(func.exists()).toBe(true)
		expect((func.element as HTMLElement).dataset.func).toBe(id)
		expect(func.find('.me-func__name').text()).toBe(name)
		expect(func.find('.me-func__sup').exists()).toBe(false)
		expect(func.find('.me-func__arg .me-text-slot').exists()).toBe(true)
		expect(selectionIn('.me-func__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe(`\\${id}{}`)
	})
})

describe('双曲函数解析与往返', () => {
	const HYPERBOLIC_PARSE_CASES: [string, string][] = [
		['\\sinh{x}', 'sinh'],
		['\\cosh{y}', 'cosh'],
		['\\tanh{θ}', 'tanh'],
		['\\csch{a}', 'csch'],
		['\\sech{b}', 'sech'],
		['\\coth{c}', 'coth']
	]

	it.each(HYPERBOLIC_PARSE_CASES)('%s 解析并原样序列化', async (latex, id) => {
		wrapper = mountEditor(latex)

		const func = wrapper.find('.me-func')
		expect(func.exists()).toBe(true)
		expect((func.element as HTMLElement).dataset.func).toBe(id)
		expect(func.find('.me-func__name').text()).toBe(id)

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe(latex)
	})

	it('\\sinh{x} 解析为双曲正弦，不会被 \\sin 抢先匹配', () => {
		wrapper = mountEditor('\\sinh{x}')

		const func = wrapper.find('.me-func')
		expect((func.element as HTMLElement).dataset.func).toBe('sinh')
		expect(func.find('.me-func__name').text()).toBe('sinh')
		expect(func.find('.me-func__arg').text()).toBe('x')
	})

	it('\\coth{x} 解析为双曲余切，不会被 \\cot 抢先匹配', () => {
		wrapper = mountEditor('\\coth{x}')

		expect((wrapper.find('.me-func').element as HTMLElement).dataset.func).toBe('coth')
	})

	it('双曲函数可以嵌套在分式中', async () => {
		wrapper = mountEditor('\\frac{\\sinh{x}}{\\cosh{y}}')

		expect(wrapper.find('.me-frac__num .me-func').exists()).toBe(true)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\frac{\\sinh{x}}{\\cosh{y}}')
	})

	it('空参数序列化为 \\sech{}，不吞掉后接文本', async () => {
		wrapper = mountEditor('\\sech{}+1')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sech{}+1')
	})

	it('双曲函数参数槽末尾 Delete 整块删除', () => {
		wrapper = mountEditor('\\tanh{y}')
		const slot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)

		pressKey('Delete')

		expect(wrapper.findAll('.me-func')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})
})

// ============ 反双曲函数 ============

describe('插入反双曲函数', () => {
	it.each(INVERSE_HYPERBOLIC_CASES)(
		'点击第 %i 张卡插入 %s：%s⁻¹ 上标与参数槽',
		async (index, id, command, base) => {
			wrapper = mountEditor()
			await openFunction(wrapper)
			await pickCard(wrapper, index)

			expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
			const func = wrapper.find('.me-func')
			expect(func.exists()).toBe(true)
			expect((func.element as HTMLElement).dataset.func).toBe(id)
			expect(func.find('.me-func__name').text()).toBe(`${base}−1`)
			expect(func.find('.me-func__sup').text()).toBe('−1')
			expect(selectionIn('.me-func__arg')).toBe(true)
			expect(lastEmitted(wrapper)).toBe(`${command}{}`)
		}
	)
})

describe('反双曲函数解析与往返', () => {
	const INVERSE_HYPERBOLIC_PARSE_CASES: [string, string, string, string][] = [
		['\\sinh^{-1}{x}', 'arcsinh', 'sinh', 'x'],
		['\\cosh^{-1}{y}', 'arccosh', 'cosh', 'y'],
		['\\tanh^{-1}{θ}', 'arctanh', 'tanh', 'θ'],
		['\\csch^{-1}{a}', 'arccsch', 'csch', 'a'],
		['\\sech^{-1}{b}', 'arcsech', 'sech', 'b'],
		['\\coth^{-1}{c}', 'arccoth', 'coth', 'c']
	]

	it.each(INVERSE_HYPERBOLIC_PARSE_CASES)(
		'%s 解析为 %s 节点并原样序列化',
		async (latex, id, base, argument) => {
			wrapper = mountEditor(latex)

			const func = wrapper.find('.me-func')
			expect(func.exists()).toBe(true)
			expect((func.element as HTMLElement).dataset.func).toBe(id)
			expect(func.find('.me-func__name').text()).toBe(`${base}−1`)
			expect(func.find('.me-func__arg').text()).toBe(argument)

			await resyncFromDom(wrapper)
			expect(lastEmitted(wrapper)).toBe(latex)
		}
	)

	it('\\sinh^{-1}{x} 不会被 \\sinh 抢先匹配', () => {
		wrapper = mountEditor('\\sinh^{-1}{x}')

		const func = wrapper.find('.me-func')
		expect((func.element as HTMLElement).dataset.func).toBe('arcsinh')
		expect(func.find('.me-func__name').text()).toBe('sinh−1')
		expect(func.find('.me-func__arg').text()).toBe('x')
	})

	it('反双曲函数与反函数可在同一公式混用，往返不变', async () => {
		wrapper = mountEditor('\\sin^{-1}{x}+\\sinh^{-1}{x}')

		expect(wrapper.findAll('.me-func')).toHaveLength(2)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sin^{-1}{x}+\\sinh^{-1}{x}')
	})

	it('空参数序列化为 \\tanh^{-1}{}，不吞掉后接文本', async () => {
		wrapper = mountEditor('\\tanh^{-1}{}+1')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\tanh^{-1}{}+1')
	})
})

// ============ 常用函数模板 ============

describe('插入常用函数模板', () => {
	it.each(COMMON_CASES)('点击第 %i 张卡插入 %s：原文为 %s', async (index, _id, latex) => {
		wrapper = mountEditor()
		await openFunction(wrapper)
		await pickCard(wrapper, index)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
		expect(lastEmitted(wrapper)).toBe(latex)
		expect(currentSlot()).not.toBeNull()
	})

	it('正切恒等式插入结构化分式并聚焦首个槽位', async () => {
		wrapper = mountEditor()
		await openFunction(wrapper)
		await pickCard(wrapper, 26)

		const frac = wrapper.find('.me-frac')
		expect(frac.exists()).toBe(true)
		expect(frac.find('.me-frac__num .me-func__name').text()).toBe('sin')
		expect(frac.find('.me-frac__den .me-func__name').text()).toBe('cos')
		expect(wrapper.findAll('.me-func')).toHaveLength(3)
		expect(selectionIn('[contenteditable]')).toBe(true)
	})

	it('常用模板插入后可继续编辑参数，序列化保持结构', async () => {
		wrapper = mountEditor()
		await openFunction(wrapper)
		await pickCard(wrapper, 24)

		const slot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)
		slot.textContent = 'θα'
		await resyncFromDom(wrapper)

		expect(lastEmitted(wrapper)).toBe('\\sin{θα}')
	})
})

// ============ 解析 / 往返 ============

describe('函数解析与往返', () => {
	const PARSE_CASES: [string, string, string][] = [
		['\\sin{x}', 'sin', 'x'],
		['\\cos{y}', 'cos', 'y'],
		['\\tan{θ}', 'tan', 'θ'],
		['\\csc{a}', 'csc', 'a'],
		['\\sec{b}', 'sec', 'b'],
		['\\cot{c}', 'cot', 'c']
	]

	it.each(PARSE_CASES)('%s 解析为 %s 节点并原样序列化', async (latex, name, argument) => {
		wrapper = mountEditor(latex)

		const func = wrapper.find('.me-func')
		expect(func.exists()).toBe(true)
		expect((func.element as HTMLElement).dataset.func).toBe(name)
		expect(func.find('.me-func__name').text()).toBe(name)
		expect(func.find('.me-func__arg').text()).toBe(argument)

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe(latex)
	})

	it('参数里的分式仍然结构化，往返保持不变', async () => {
		wrapper = mountEditor('\\sin{\\frac{a}{b}}')

		const func = wrapper.find('.me-func')
		expect(func.find('.me-frac').exists()).toBe(true)
		expect(func.find('.me-frac__num').text()).toBe('a')
		expect(func.find('.me-frac__den').text()).toBe('b')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sin{\\frac{a}{b}}')
	})

	it('函数可以嵌套在分式中', () => {
		wrapper = mountEditor('\\frac{\\sin{x}}{2}')

		expect(wrapper.find('.me-frac .me-func').exists()).toBe(true)
		expect(wrapper.find('.me-frac__num .me-func__name').text()).toBe('sin')
	})

	it('未知命令 \\sinc 不会被误判为 \\sin', () => {
		wrapper = mountEditor('\\sinc{x}')

		expect(wrapper.findAll('.me-func')).toHaveLength(0)
		expect(wrapper.find('.he-formula-editable').text()).toContain('\\sinc')
	})

	it('在参数槽输入字符后序列化 \\sin{y}', async () => {
		wrapper = mountEditor('\\sin{x}')
		const slot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)

		slot.textContent = 'y'
		await resyncFromDom(wrapper)

		expect(lastEmitted(wrapper)).toBe('\\sin{y}')
	})

	it('空参数序列化为 \\sin{}，不吞掉后接文本', async () => {
		wrapper = mountEditor('\\sin{}+1')

		const func = wrapper.find('.me-func')
		expect(func.find('.me-func__arg .me-text-slot').text()).toBe('\u200b')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sin{}+1')
	})
})

// ============ 导航与删除 ============

describe('函数参数槽的光标与删除', () => {
	it('参数末尾按 → 跳出到函数右侧，开头按 ← 跳出到函数左侧', () => {
		wrapper = mountEditor('a\\sin{x}+1')
		const slot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement

		placeCaret(slot, 1)
		pressKey('ArrowRight')
		expect(selectionIn('.me-func')).toBe(false)
		expect(currentSlot()?.textContent).toBe('+1')

		placeCaret(slot, 0)
		pressKey('ArrowLeft')
		expect(selectionIn('.me-func')).toBe(false)
		expect(currentSlot()?.textContent).toBe('a')
	})

	it('嵌套函数：内层参数末尾按 → 先停在外层参数槽，再按一次才离开外层', () => {
		wrapper = mountEditor('\\sin{\\sin{x}}')
		const inner = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement
		const outerArg = wrapper.findAll('.me-func__arg')[0]!.element

		placeCaret(inner, 1)
		pressKey('ArrowRight')
		expect(wrapper.findAll('.me-func')).toHaveLength(2)
		expect(currentSlot()?.parentElement).toBe(outerArg)

		pressKey('ArrowRight')
		expect(selectionIn('.me-func')).toBe(false)
	})

	it('参数槽开头退格整块删除函数', () => {
		wrapper = mountEditor('\\sin{x}')
		const slot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement
		placeCaret(slot, 0)

		pressKey('Backspace')

		expect(wrapper.findAll('.me-func')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('参数槽末尾 Delete 也整块删除函数', () => {
		wrapper = mountEditor('\\cos{y}')
		const slot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)

		pressKey('Delete')

		expect(wrapper.findAll('.me-func')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})
})
