import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 极限和对数的单元测试
 * 覆盖：8 张卡弹层（6 张基础卡 + 2 张常用函数宽卡）/ 下标槽与参数槽插入 / LaTeX 解析与往返 /
 * 下标 ↔ 参数导航 / 整块删除 / 与函数弹层互斥
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

/** 打开极限和对数弹层 */
const openLimitLog = async (wrapper: VueWrapper<any>) => {
	await wrapper.find('button[title="极限和对数"]').trigger('click')
}

/** 点击极限和对数弹层里的第 n 张卡 */
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

/** 8 张卡的标题（弹层顺序） */
const CARD_TITLES = [
	'带底数的对数 log',
	'对数 log',
	'极限 lim',
	'最小值 min',
	'最大值 max',
	'自然对数 ln',
	'重要极限 lim (1+1/n)ⁿ',
	'函数最大值 max xe⁻ˣ²'
]

/** 6 张基础卡：序号 / 卡片 id / 节点名 / 序列化结果 / 显示名 / 聚焦槽 / 是否下标在名称下方 */
const BASIC_CASES: [number, string, string, string, string, 'sub' | 'arg', boolean][] = [
	[0, 'logBase', 'log', '\\log_{}{}', 'log', 'sub', false],
	[1, 'log', 'log', '\\log{}', 'log', 'arg', false],
	[2, 'lim', 'lim', '\\lim_{}{}', 'lim', 'sub', true],
	[3, 'min', 'min', '\\min_{}{}', 'min', 'sub', true],
	[4, 'max', 'max', '\\max_{}{}', 'max', 'sub', true],
	[5, 'ln', 'ln', '\\ln{}', 'ln', 'arg', false]
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

describe('极限和对数弹层', () => {
	it('点击工具栏按钮打开弹层，标题为极限和对数且包含两个板块共 8 张卡', async () => {
		wrapper = mountEditor()
		await openLimitLog(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.exists()).toBe(true)
		expect(dialog.find('.he-tool-popover__header').text()).toBe('极限和对数')
		expect(dialog.findAll('.he-tool-popover__section').map((el) => el.text())).toEqual([
			'函数',
			'常用函数'
		])
		expect(dialog.findAll('.he-tool-card')).toHaveLength(8)
	})

	it('8 张卡按顺序显示对应标题', async () => {
		wrapper = mountEditor()
		await openLimitLog(wrapper)

		const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
		expect(cards.map((card) => card.attributes('title'))).toEqual(CARD_TITLES)
	})

	it('再次点击工具栏按钮关闭弹层', async () => {
		wrapper = mountEditor()
		await openLimitLog(wrapper)
		await openLimitLog(wrapper)

		expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
	})

	it('与函数弹层互斥：打开极限和对数后函数弹层关闭，反之亦然', async () => {
		wrapper = mountEditor()
		await wrapper.find('button[title="函数"]').trigger('click')
		expect(wrapper.find('[role="dialog"]').find('.he-tool-popover__header').text()).toBe('函数')

		await openLimitLog(wrapper)
		expect(wrapper.findAll('[role="dialog"]')).toHaveLength(1)
		expect(wrapper.find('[role="dialog"]').find('.he-tool-popover__header').text()).toBe('极限和对数')

		await wrapper.find('button[title="函数"]').trigger('click')
		expect(wrapper.findAll('[role="dialog"]')).toHaveLength(1)
		expect(wrapper.find('[role="dialog"]').find('.he-tool-popover__header').text()).toBe('函数')
	})
})

// ============ 插入基础卡 ============

describe('插入极限和对数基础卡', () => {
	it.each(BASIC_CASES)(
		'点击第 %i 张卡（%s）插入 %s：节点名、下标与聚焦槽',
		async (index, _cardId, nodeName, latex, displayName, focus, under) => {
			wrapper = mountEditor()
			await openLimitLog(wrapper)
			await pickCard(wrapper, index)

			expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
			const func = wrapper.find('.me-func')
			expect(func.exists()).toBe(true)
			expect((func.element as HTMLElement).dataset.func).toBe(nodeName)
			expect(func.find('.me-func__name').text()).toBe(displayName)
			expect(func.find('.me-func__arg .me-text-slot').exists()).toBe(true)
			expect(func.classes('me-func--sub-under')).toBe(under)
			if (focus === 'sub') {
				expect(func.find('.me-func__sub .me-text-slot').exists()).toBe(true)
				expect(selectionIn('.me-func__sub')).toBe(true)
			} else {
				expect(func.find('.me-func__sub').exists()).toBe(false)
				expect(selectionIn('.me-func__arg')).toBe(true)
			}
			expect(lastEmitted(wrapper)).toBe(latex)
		}
	)

	it('带底数的对数卡插入后下标槽带无障碍标签', async () => {
		wrapper = mountEditor()
		await openLimitLog(wrapper)
		await pickCard(wrapper, 0)

		expect(wrapper.find('.me-func__sub').attributes('aria-label')).toBe('函数下标')
	})
})

// ============ 插入常用函数 ============

describe('插入常用极限模板', () => {
	it('重要极限宽卡插入 lim_{n→∞}(1+1/n)^n 并聚焦参数槽', async () => {
		wrapper = mountEditor()
		await openLimitLog(wrapper)
		await pickCard(wrapper, 6)

		const func = wrapper.find('.me-func')
		expect((func.element as HTMLElement).dataset.func).toBe('lim')
		expect(func.classes('me-func--sub-under')).toBe(true)
		expect(func.find('.me-func__sub').text()).toBe('n→∞')
		expect(func.find('.me-func__arg .me-bracket').exists()).toBe(true)
		expect(func.find('.me-func__arg .me-frac__num').text()).toBe('1')
		expect(func.find('.me-func__arg .me-frac__den').text()).toBe('n')
		expect(selectionIn('.me-func__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\lim_{n→∞}{\\left(1+\\frac{1}{n}\\right)^{n}}')
	})

	it('最大值宽卡插入 max_{0≤x≤1} xe^{-x^2}', async () => {
		wrapper = mountEditor()
		await openLimitLog(wrapper)
		await pickCard(wrapper, 7)

		const func = wrapper.find('.me-func')
		expect((func.element as HTMLElement).dataset.func).toBe('max')
		expect(func.find('.me-func__sub').text()).toBe('0≤x≤1')
		expect(func.find('.me-func__arg .me-script').exists()).toBe(true)
		expect(selectionIn('.me-func__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\max_{0≤x≤1}{xe^{-x^{2}}}')
	})

	it('插入点已有内容时模板接在光标之后', async () => {
		wrapper = mountEditor('a')
		const slot = wrapper.find('.he-formula-editable .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)
		await openLimitLog(wrapper)
		await pickCard(wrapper, 6)

		expect(lastEmitted(wrapper)).toBe('a\\lim_{n→∞}{\\left(1+\\frac{1}{n}\\right)^{n}}')
	})
})

// ============ 解析与往返 ============

describe('极限和对数解析与往返', () => {
	const PARSE_CASES: [string, string, string][] = [
		['\\log_{2}{x}', 'log', '2'],
		['\\log{x}', 'log', ''],
		['\\ln{x}', 'ln', ''],
		['\\lim_{n→∞}{a+b}', 'lim', 'n→∞'],
		['\\min_{x>0}{f(x)}', 'min', 'x>0'],
		['\\max_{0≤x≤1}{x}', 'max', '0≤x≤1']
	]

	it.each(PARSE_CASES)('%s 解析并原样序列化', async (latex, nodeName, sub) => {
		wrapper = mountEditor(latex)

		const func = wrapper.find('.me-func')
		expect(func.exists()).toBe(true)
		expect((func.element as HTMLElement).dataset.func).toBe(nodeName)
		if (sub) {
			expect(func.find('.me-func__sub').text()).toBe(sub)
		} else {
			expect(func.find('.me-func__sub').exists()).toBe(false)
		}

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe(latex)
	})

	it('\\lim_{n→∞}{x} 不会被 \\ln 抢先匹配', () => {
		wrapper = mountEditor('\\lim_{n→∞}{x}')

		const func = wrapper.find('.me-func')
		expect((func.element as HTMLElement).dataset.func).toBe('lim')
		expect(func.find('.me-func__name').text()).toBe('lim')
	})

	it('\\ln{x} 不会被 \\lim 抢先匹配', () => {
		wrapper = mountEditor('\\ln{x}')

		expect((wrapper.find('.me-func').element as HTMLElement).dataset.func).toBe('ln')
	})

	it('空下标和空参数都保留花括号，往返不吞掉后接文本', async () => {
		wrapper = mountEditor('\\log_{}{}+1')

		expect(wrapper.find('.me-func__sub').exists()).toBe(true)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\log_{}{}+1')
	})

	it('极限和对数可以嵌套在分式中', async () => {
		wrapper = mountEditor('\\frac{\\log_{2}{x}}{\\ln{y}}')

		expect(wrapper.find('.me-frac__num .me-func__sub').text()).toBe('2')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\frac{\\log_{2}{x}}{\\ln{y}}')
	})

	it('对数参数里可以嵌套极限', async () => {
		wrapper = mountEditor('\\log_{2}{\\lim_{n→∞}{x}}')

		expect(wrapper.findAll('.me-func')).toHaveLength(2)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\log_{2}{\\lim_{n→∞}{x}}')
	})

	it('lim 的下标排在函数名下方（sub-under），log 底数排在右侧', () => {
		wrapper = mountEditor('\\lim_{x→0}{x}+\\log_{2}{x}')
		const [lim, log] = wrapper.findAll('.me-func')

		expect(lim!.classes('me-func--sub-under')).toBe(true)
		expect(log!.classes('me-func--with-sub')).toBe(true)
		expect(log!.classes('me-func--sub-under')).toBe(false)
	})
})

// ============ 光标导航 ============

describe('极限和对数的光标导航', () => {
	it('log 底数末尾按 → 进入参数槽，参数开头按 ← 回到底数', () => {
		wrapper = mountEditor('\\log_{2}{x}')
		const subSlot = wrapper.find('.me-func__sub .me-text-slot').element as HTMLElement
		const argSlot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement

		placeCaret(subSlot, 1)
		pressKey('ArrowRight')
		expect(selectionIn('.me-func__arg')).toBe(true)

		placeCaret(argSlot, 0)
		pressKey('ArrowLeft')
		expect(selectionIn('.me-func__sub')).toBe(true)
	})

	it('lim 的下标末尾按 ↓ 进入参数，参数开头按 ↑ 回到下标', () => {
		wrapper = mountEditor('\\lim_{x→0}{x}')
		const subSlot = wrapper.find('.me-func__sub .me-text-slot').element as HTMLElement
		const argSlot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement

		placeCaret(subSlot, 3)
		pressKey('ArrowDown')
		expect(selectionIn('.me-func__arg')).toBe(true)

		placeCaret(argSlot, 0)
		pressKey('ArrowUp')
		expect(selectionIn('.me-func__sub')).toBe(true)
	})

	it('下标开头按 ← 跳出整个函数到左侧文本', () => {
		wrapper = mountEditor('a\\log_{2}{x}')
		const slot = wrapper.find('.me-func__sub .me-text-slot').element as HTMLElement

		placeCaret(slot, 0)
		pressKey('ArrowLeft')

		expect(selectionIn('.me-func')).toBe(false)
		expect(currentSlot()?.textContent).toBe('a')
	})

	it('参数末尾按 → 跳出整个函数到右侧文本', () => {
		wrapper = mountEditor('\\ln{x}+1')
		const slot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement

		placeCaret(slot, 1)
		pressKey('ArrowRight')

		expect(selectionIn('.me-func')).toBe(false)
		expect(currentSlot()?.textContent).toBe('+1')
	})
})

// ============ 整块删除 ============

describe('极限和对数的整块删除', () => {
	it('下标槽开头退格整块删除函数', () => {
		wrapper = mountEditor('\\log_{2}{x}+1')
		const slot = wrapper.find('.me-func__sub .me-text-slot').element as HTMLElement
		placeCaret(slot, 0)

		pressKey('Backspace')

		expect(wrapper.findAll('.me-func')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('+1')
	})

	it('参数槽末尾 Delete 整块删除函数', () => {
		wrapper = mountEditor('\\lim_{x→0}{x}')
		const slot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)

		pressKey('Delete')

		expect(wrapper.findAll('.me-func')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('参数槽开头退格先回到下标槽，不删除整个函数', () => {
		wrapper = mountEditor('\\max_{x}{y}')
		const slot = wrapper.find('.me-func__arg .me-text-slot').element as HTMLElement
		placeCaret(slot, 0)

		pressKey('Backspace')

		expect(wrapper.findAll('.me-func')).toHaveLength(1)
		expect(selectionIn('.me-func__sub')).toBe(true)
	})

	it('下标槽末尾 Delete 先进入参数槽，不删除整个函数', () => {
		wrapper = mountEditor('\\min_{x}{y}')
		const slot = wrapper.find('.me-func__sub .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)

		pressKey('Delete')

		expect(wrapper.findAll('.me-func')).toHaveLength(1)
		expect(selectionIn('.me-func__arg')).toBe(true)
	})
})
