import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 大型运算符（并集和交集）弹层与结构化节点的单元测试
 * 覆盖：弹层第三板块 10 卡（⋃ 并集 5 卡 + ⋂ 交集 5 卡）/
 * 插入槽位与序列化 / LaTeX 解析 / 往返契约 / 键盘导航 / 整块删除
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

/** 打开大型运算符弹层 */
const openBigOperator = async (wrapper: VueWrapper<any>) => {
	await wrapper.find('button[title="大型运算符"]').trigger('click')
}

/**
 * 点击“并集和交集”板块里的第 n 张卡
 * 顺序同 unionFormats：union/unionSubSup/unionInline/unionSub/unionSubInline/intersection/...
 */
const pickCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.findAll('.he-tool-popover__grid')[2]!.findAll('.he-tool-card')
	await cards[index]!.trigger('click')
}

/** 把光标以 collapsed 状态放到槽位文本末尾 */
const focusSlotEnd = (slot: HTMLElement) => {
	slot.focus()
	const range = document.createRange()
	const textNode = slot.firstChild
	if (textNode) range.setStart(textNode, (textNode.textContent ?? '').length)
	range.collapse(true)
	const selection = window.getSelection()
	selection?.removeAllRanges()
	selection?.addRange(range)
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

/**
 * 在当前光标槽位上派发键盘事件（冒泡到可编辑区根节点）。
 * jsdom 中 contenteditable 的 focus() 不会更新 activeElement，
 * 真实浏览器里 keydown 的 target 即被点击的槽位，这里直接从光标所在槽位派发以保持等价。
 */
const pressKey = (key: string) => {
	const target = currentSlot() ?? document.body
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

/** 当前光标（selection 起点）是否落在指定区域 */
const selectionIn = (selector: string): boolean => {
	const selection = window.getSelection()
	if (!selection?.rangeCount) return false
	return rangeAnchor(selection.getRangeAt(0))?.closest(selector) != null
}

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

describe('并集和交集弹层', () => {
	it('并集和交集板块一行 10 张卡：前 5 张 ⋃，后 5 张 ⋂', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)

		const cards = wrapper.findAll('.he-tool-popover__grid')[2]!.findAll('.he-tool-card')
		expect(cards).toHaveLength(10)
		for (const card of cards.slice(0, 5)) {
			expect(card.find('.math-bigop__sign').text()).toBe('⋃')
		}
		for (const card of cards.slice(5)) {
			expect(card.find('.math-bigop__sign').text()).toBe('⋂')
		}
	})

	it('卡片标题按符号与限界类型区分', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)

		const cards = wrapper.findAll('.he-tool-popover__grid')[2]!.findAll('.he-tool-card')
		expect(cards.map((card) => card.attributes('title'))).toEqual([
			'并集',
			'带上下限的并集',
			'带上下标的并集',
			'带下限的并集',
			'带下标的并集',
			'交集',
			'带上下限的交集',
			'带上下标的交集',
			'带下限的交集',
			'带下标的交集'
		])
	})

	it('格式卡预览按限界类型区分：堆叠限界 / 行内式 / 单下限与带下标', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)

		const cards = wrapper.findAll('.he-tool-popover__grid')[2]!.findAll('.he-tool-card')
		// 并集：无限界
		expect(cards[0]!.find('.math-bigop__sub').exists()).toBe(false)
		expect(cards[0]!.find('.math-bigop__sup').exists()).toBe(false)
		expect(cards[0]!.find('.math-bigop--inline').exists()).toBe(false)
		// 带上下限：堆叠式
		expect(cards[1]!.find('.math-bigop__sub').exists()).toBe(true)
		expect(cards[1]!.find('.math-bigop__sup').exists()).toBe(true)
		expect(cards[1]!.find('.math-bigop--inline').exists()).toBe(false)
		// 带上下标：行内式
		expect(cards[2]!.find('.math-bigop--inline').exists()).toBe(true)
		// 带下限：仅堆叠下限
		expect(cards[3]!.find('.math-bigop__sub').exists()).toBe(true)
		expect(cards[3]!.find('.math-bigop__sup').exists()).toBe(false)
		expect(cards[3]!.find('.math-bigop--inline').exists()).toBe(false)
		// 带下标：行内式仅下标
		expect(cards[4]!.find('.math-bigop--inline').exists()).toBe(true)
		expect(cards[4]!.find('.math-bigop__sub').exists()).toBe(true)
		expect(cards[4]!.find('.math-bigop__sup').exists()).toBe(false)
		// 交集行内式
		expect(cards[9]!.find('.math-bigop--inline').exists()).toBe(true)
		// 十张卡都有表达式槽
		for (const card of cards) {
			expect(card.find('.math-bigop__operand').exists()).toBe(true)
		}
	})
})

// ============ 插入 ============

describe('插入并集与交集', () => {
	it('插入并集：无界限，序列化 \\bigcup{}，焦点落在表达式', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 0)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
		const bigop = wrapper.find('.me-bigop')
		expect(bigop.exists()).toBe(true)
		expect((bigop.element as HTMLElement).dataset.sign).toBe('⋃')
		expect(bigop.classes()).not.toContain('me-bigop--inline')
		expect(bigop.find('.me-bigop__sub').exists()).toBe(false)
		expect(bigop.find('.me-bigop__sup').exists()).toBe(false)
		expect(lastEmitted(wrapper)).toBe('\\bigcup{}')
		expect(selectionIn('.me-bigop__operand')).toBe(true)
	})

	it('插入带上下限的并集：序列化 \\bigcup_{}^{}{}，焦点落在下限', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 1)

		const bigop = wrapper.find('.me-bigop')
		expect(bigop.find('.me-bigop__sub').exists()).toBe(true)
		expect(bigop.find('.me-bigop__sup').exists()).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\bigcup_{}^{}{}')
		expect(selectionIn('.me-bigop__sub')).toBe(true)
	})

	it('插入带下标的并集：行内式仅下标，序列化 \\bigcup\\nolimits_{}{}', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 4)

		const bigop = wrapper.find('.me-bigop')
		expect(bigop.classes()).toContain('me-bigop--inline')
		expect(bigop.find('.me-bigop__sub').exists()).toBe(true)
		expect(bigop.find('.me-bigop__sup').exists()).toBe(false)
		expect(lastEmitted(wrapper)).toBe('\\bigcup\\nolimits_{}{}')
		expect(selectionIn('.me-bigop__sub')).toBe(true)
	})

	it('插入交集：无界限，序列化 \\bigcap{}', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 5)

		const bigop = wrapper.find('.me-bigop')
		expect((bigop.element as HTMLElement).dataset.sign).toBe('⋂')
		expect(bigop.find('.me-bigop__sub').exists()).toBe(false)
		expect(bigop.find('.me-bigop__sup').exists()).toBe(false)
		expect(lastEmitted(wrapper)).toBe('\\bigcap{}')
		expect(selectionIn('.me-bigop__operand')).toBe(true)
	})

	it('插入带下限的交集：序列化 \\bigcap_{}{}，焦点落在下限', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 8)

		const bigop = wrapper.find('.me-bigop')
		expect(bigop.find('.me-bigop__sub').exists()).toBe(true)
		expect(bigop.find('.me-bigop__sup').exists()).toBe(false)
		expect(bigop.classes()).not.toContain('me-bigop--inline')
		expect(lastEmitted(wrapper)).toBe('\\bigcap_{}{}')
		expect(selectionIn('.me-bigop__sub')).toBe(true)
	})

	it('插入带上下标的交集：序列化 \\bigcap\\nolimits_{}^{}{}', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 7)

		const bigop = wrapper.find('.me-bigop')
		expect(bigop.classes()).toContain('me-bigop--inline')
		expect(lastEmitted(wrapper)).toBe('\\bigcap\\nolimits_{}^{}{}')
		expect(selectionIn('.me-bigop__sub')).toBe(true)
	})
})

// ============ 解析渲染 ============

describe('并集和交集解析渲染', () => {
	it('解析 \\bigcup_{i=1}^{n}{A_i}：下限 / 上限 / 表达式分别渲染', () => {
		wrapper = mountEditor('\\bigcup_{i=1}^{n}{A_i}')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(1)
		expect(wrapper.find('.me-bigop__sign').text()).toBe('⋃')
		expect(wrapper.find('.me-bigop__sub').text()).toBe('i=1')
		expect(wrapper.find('.me-bigop__sup').text()).toBe('n')
		expect(wrapper.find('.me-bigop__operand .me-script__sub').text()).toBe('i')
	})

	it('解析 \\bigcap\\nolimits_{a}^{b}{x}：渲染为行内式', () => {
		wrapper = mountEditor('\\bigcap\\nolimits_{a}^{b}{x}')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(1)
		expect(wrapper.find('.me-bigop__sign').text()).toBe('⋂')
		expect(wrapper.find('.me-bigop').classes()).toContain('me-bigop--inline')
		expect(wrapper.find('.me-bigop__sub').text()).toBe('a')
		expect(wrapper.find('.me-bigop__sup').text()).toBe('b')
		expect(wrapper.find('.me-bigop__operand').text()).toBe('x')
	})

	it('解析兼容 \\limits 修饰符：并集渲染为堆叠式', () => {
		wrapper = mountEditor('\\bigcup\\limits_{a}^{b}{x}')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(1)
		expect(wrapper.find('.me-bigop').classes()).not.toContain('me-bigop--inline')
		expect(wrapper.find('.me-bigop__sign').text()).toBe('⋃')
		expect(wrapper.find('.me-bigop__sub').text()).toBe('a')
		expect(wrapper.find('.me-bigop__sup').text()).toBe('b')
	})

	it('限界与表达式槽位按符号带 aria-label', () => {
		wrapper = mountEditor('\\bigcup_{i=1}^{n}{A_i}')
		expect(wrapper.find('.me-bigop__sub').attributes('aria-label')).toBe('并集下限')
		expect(wrapper.find('.me-bigop__sup').attributes('aria-label')).toBe('并集上限')
		expect(wrapper.find('.me-bigop__operand').attributes('aria-label')).toBe('并集表达式')

		wrapper.unmount()
		wrapper = mountEditor('\\bigcap_{a}^{b}{x}')
		expect(wrapper.find('.me-bigop__sub').attributes('aria-label')).toBe('交集下限')
		expect(wrapper.find('.me-bigop__sup').attributes('aria-label')).toBe('交集上限')
		expect(wrapper.find('.me-bigop__operand').attributes('aria-label')).toBe('交集表达式')
	})

	it('同一公式中的求和、并集与交集互不干扰', () => {
		wrapper = mountEditor('\\sum_{i=1}^{n}{a_i}\\bigcup_{j}{B_j}\\bigcap_{k}{C_k}')
		const nodes = wrapper.findAll('.me-bigop')
		expect(nodes).toHaveLength(3)
		expect(nodes.map((node) => (node.element as HTMLElement).dataset.sign)).toEqual(['∑', '⋃', '⋂'])
		expect(nodes[1]!.find('.me-bigop__sub').text()).toBe('j')
		expect(nodes[2]!.find('.me-bigop__sub').text()).toBe('k')
	})
})

// ============ 序列化往返 ============

describe('并集和交集序列化往返', () => {
	/** 渲染完成后派发 input 事件，触发可编辑区同步序列化 */
	const resyncFromDom = async (current: VueWrapper<any>) => {
		;(current.find('.he-formula-editable').element as HTMLElement).dispatchEvent(
			new Event('input')
		)
		await nextTick()
	}

	it('渲染后派发 input 事件还原相同 LaTeX', async () => {
		wrapper = mountEditor('\\bigcup_{i\\in I}{A_{i}}')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\bigcup_{i\\in I}{A_{i}}')
	})

	it('交集行内式往返保留 \\nolimits', async () => {
		wrapper = mountEditor('\\bigcap\\nolimits_{a}^{b}{X}')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\bigcap\\nolimits_{a}^{b}{X}')
	})

	it('带下标的并集往返：仅下限的行内式保持不变', async () => {
		wrapper = mountEditor('\\bigcup\\nolimits_{j}{B_{j}}')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\bigcup\\nolimits_{j}{B_{j}}')
	})

	it('空表达式后接文本不被吞：\\bigcap{}dx 往返保持不变', async () => {
		wrapper = mountEditor('\\bigcap{}dx')
		expect(wrapper.find('.me-bigop__operand').exists()).toBe(true)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\bigcap{}dx')
	})
})

// ============ 键盘导航 ============

describe('并集和交集键盘导航', () => {
	it('带上下限并集插入后：下限 ↑ 到上限', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 1)
		expect(selectionIn('.me-bigop__sub')).toBe(true)

		pressKey('ArrowUp')
		expect(selectionIn('.me-bigop__sup')).toBe(true)
	})

	it('带下限交集：下限 ↓ 进入表达式', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 8)
		expect(selectionIn('.me-bigop__sub')).toBe(true)

		pressKey('ArrowDown')
		expect(selectionIn('.me-bigop__operand')).toBe(true)
	})

	it('带下标的并集（行内仅下标）：下标末尾 → 跳到表达式开头', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 4)
		expect(selectionIn('.me-bigop__sub')).toBe(true)

		pressKey('ArrowRight')
		expect(selectionIn('.me-bigop__operand')).toBe(true)
	})

	it('并集表达式 ↑ 回到最近的限界（上限末尾）', async () => {
		wrapper = mountEditor('\\bigcup_{i=1}^{n}{f(i)}')
		const slot = wrapper.find('.me-bigop__operand .me-text-slot')
		focusSlotEnd(slot.element as HTMLElement)

		pressKey('ArrowUp')
		expect(selectionIn('.me-bigop__sup')).toBe(true)
	})
})

// ============ 整块删除 ============

describe('并集和交集整块删除', () => {
	it('带下限交集在下限开头 Backspace 整块删除', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 8)
		expect(wrapper.findAll('.me-bigop')).toHaveLength(1)
		expect(selectionIn('.me-bigop__sub')).toBe(true)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('并集在表达式开头 Backspace 整块删除', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 0)
		expect(selectionIn('.me-bigop__operand')).toBe(true)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('交集表达式末尾 Delete 整块删除', async () => {
		wrapper = mountEditor('\\bigcap_{i=1}^{n}{f(i)}')
		const slot = wrapper.find('.me-bigop__operand .me-text-slot')
		expect(slot.exists()).toBe(true)
		focusSlotEnd(slot.element as HTMLElement)

		pressKey('Delete')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})
})
