import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 大型运算符（求和）弹层与结构化求和的单元测试
 * 覆盖：弹层 5 卡（求和 / 带上限 / 带下限 / 带上下限 / 带上下标）/
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

/** 点击求和弹层里的第 n 张格式卡（顺序同 sumFormats：sum/sumSup/sumSub/sumSubSup/sumInline） */
const pickCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.findAll('.he-tool-popover .he-tool-card')
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

describe('大型运算符弹层', () => {
	it('点击大型运算符按钮打开求和弹层：一行 5 张卡', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)

		const popover = wrapper.find('.he-tool-popover')
		expect(popover.exists()).toBe(true)
		expect(popover.attributes('aria-label')).toBe('大型运算符')
		expect(popover.find('.he-tool-popover__header').text()).toBe('大型运算符')
		expect(popover.find('.he-tool-popover__section').text()).toBe('求和')

		const cards = popover.findAll('.he-tool-popover__grid')[0]!.findAll('.he-tool-card')
		expect(cards).toHaveLength(5)
		expect(cards[0]!.attributes('title')).toBe('求和')
		expect(cards[1]!.attributes('title')).toBe('带上限的求和')
		expect(cards[2]!.attributes('title')).toBe('带下限的求和')
		expect(cards[3]!.attributes('title')).toBe('带上下限的求和')
		expect(cards[4]!.attributes('title')).toBe('带上下标的求和')
		// 五张卡的预览都是求和号
		for (const card of cards) {
			expect(card.find('.math-bigop__sign').text()).toBe('∑')
		}
	})

	it('格式卡预览按限界类型区分：堆叠式限界居中于 Σ 上下，行内式带 --inline 修饰', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)

		const cards = wrapper.findAll('.he-tool-popover .he-tool-card')
		// 求和：无限界
		expect(cards[0]!.find('.math-bigop__sub').exists()).toBe(false)
		expect(cards[0]!.find('.math-bigop__sup').exists()).toBe(false)
		expect(cards[0]!.find('.math-bigop--inline').exists()).toBe(false)
		// 带上限
		expect(cards[1]!.find('.math-bigop__sub').exists()).toBe(false)
		expect(cards[1]!.find('.math-bigop__sup').exists()).toBe(true)
		// 带下限
		expect(cards[2]!.find('.math-bigop__sub').exists()).toBe(true)
		expect(cards[2]!.find('.math-bigop__sup').exists()).toBe(false)
		// 带上下限
		expect(cards[3]!.find('.math-bigop__sub').exists()).toBe(true)
		expect(cards[3]!.find('.math-bigop__sup').exists()).toBe(true)
		// 带上下标（行内式）
		expect(cards[4]!.find('.math-bigop--inline').exists()).toBe(true)
		// 五张卡都有表达式槽
		for (const card of cards.slice(0, 5)) {
			expect(card.find('.math-bigop__operand').exists()).toBe(true)
		}
	})

	it('再次点击大型运算符按钮切换关闭弹层', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		expect(wrapper.find('.he-tool-popover').exists()).toBe(true)
		await openBigOperator(wrapper)
		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
	})

	it('打开其他弹层时大型运算符弹层关闭', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await wrapper.find('button[title="分数"]').trigger('click')
		expect(wrapper.find('.he-tool-popover[aria-label="大型运算符"]').exists()).toBe(false)
	})
})

// ============ 插入 ============

describe('插入求和', () => {
	it('插入求和：无界限，序列化 \\sum{}，焦点落在表达式', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 0)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
		const bigop = wrapper.find('.me-bigop')
		expect(bigop.exists()).toBe(true)
		expect((bigop.element as HTMLElement).dataset.sign).toBe('∑')
		expect(bigop.classes()).not.toContain('me-bigop--inline')
		expect(bigop.find('.me-bigop__sub').exists()).toBe(false)
		expect(bigop.find('.me-bigop__sup').exists()).toBe(false)
		expect(lastEmitted(wrapper)).toBe('\\sum{}')
		expect(selectionIn('.me-bigop__operand')).toBe(true)
	})

	it('插入带上限的求和：序列化 \\sum^{}{}，焦点落在上限', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 1)

		const bigop = wrapper.find('.me-bigop')
		expect(bigop.find('.me-bigop__sub').exists()).toBe(false)
		expect(bigop.find('.me-bigop__sup').exists()).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\sum^{}{}')
		expect(selectionIn('.me-bigop__sup')).toBe(true)
	})

	it('插入带下限的求和：序列化 \\sum_{}{}，焦点落在下限', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 2)

		const bigop = wrapper.find('.me-bigop')
		expect(bigop.find('.me-bigop__sub').exists()).toBe(true)
		expect(bigop.find('.me-bigop__sup').exists()).toBe(false)
		expect(lastEmitted(wrapper)).toBe('\\sum_{}{}')
		expect(selectionIn('.me-bigop__sub')).toBe(true)
	})

	it('插入带上下限的求和：槽位齐全，序列化 \\sum_{}^{}{}，焦点落在下限', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 3)

		const bigop = wrapper.find('.me-bigop')
		expect(bigop.find('.me-bigop__sub').exists()).toBe(true)
		expect(bigop.find('.me-bigop__sup').exists()).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\sum_{}^{}{}')
		expect(selectionIn('.me-bigop__sub')).toBe(true)
	})

	it('插入带上下标的求和：行内式结构，序列化 \\sum\\nolimits_{}^{}{}，焦点落在下标', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 4)

		const bigop = wrapper.find('.me-bigop')
		expect(bigop.classes()).toContain('me-bigop--inline')
		expect(bigop.find('.me-bigop__sub').exists()).toBe(true)
		expect(bigop.find('.me-bigop__sup').exists()).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\sum\\nolimits_{}^{}{}')
		expect(selectionIn('.me-bigop__sub')).toBe(true)
	})
})

// ============ 解析渲染 ============

describe('求和解析渲染', () => {
	it('解析 \\sum_{i=1}^{n}{a_i}：下限 / 上限 / 表达式分别渲染', () => {
		wrapper = mountEditor('\\sum_{i=1}^{n}{a_i}')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(1)
		expect(wrapper.find('.me-bigop__sign').text()).toBe('∑')
		expect(wrapper.find('.me-bigop__sub').text()).toBe('i=1')
		expect(wrapper.find('.me-bigop__sup').text()).toBe('n')
		expect(wrapper.find('.me-bigop__operand .me-script__sub').text()).toBe('i')
	})

	it('解析 \\sum\\nolimits_{a}^{b}{x}：渲染为行内式', () => {
		wrapper = mountEditor('\\sum\\nolimits_{a}^{b}{x}')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(1)
		expect(wrapper.find('.me-bigop').classes()).toContain('me-bigop--inline')
		expect(wrapper.find('.me-bigop__sub').text()).toBe('a')
		expect(wrapper.find('.me-bigop__sup').text()).toBe('b')
		expect(wrapper.find('.me-bigop__operand').text()).toBe('x')
	})

	it('解析兼容 \\limits 修饰符：渲染为堆叠式', () => {
		wrapper = mountEditor('\\sum\\limits_{a}^{b}{x}')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(1)
		expect(wrapper.find('.me-bigop').classes()).not.toContain('me-bigop--inline')
		expect(wrapper.find('.me-bigop__sub').text()).toBe('a')
		expect(wrapper.find('.me-bigop__sup').text()).toBe('b')
	})

	it('解析没有表达式的求和：补空表达式槽位', () => {
		wrapper = mountEditor('\\sum_{i}^{n}')
		const operand = wrapper.find('.me-bigop__operand')
		expect(operand.exists()).toBe(true)
		expect(operand.find('.me-text-slot').exists()).toBe(true)
	})

	it('表达式支持嵌套分式', () => {
		wrapper = mountEditor('\\sum_{i=1}^{n}{\\frac{1}{i}}')
		const operand = wrapper.find('.me-bigop__operand')
		expect(operand.find('.me-frac__num').text()).toBe('1')
		expect(operand.find('.me-frac__den').text()).toBe('i')
	})

	it('限界与表达式槽位带 aria-label', () => {
		wrapper = mountEditor('\\sum_{i=1}^{n}{a_i}')
		expect(wrapper.find('.me-bigop__sub').attributes('aria-label')).toBe('求和下限')
		expect(wrapper.find('.me-bigop__sup').attributes('aria-label')).toBe('求和上限')
		expect(wrapper.find('.me-bigop__operand').attributes('aria-label')).toBe('求和表达式')
	})
})

// ============ 序列化往返 ============

describe('求和序列化往返', () => {
	/** 渲染完成后派发 input 事件，触发可编辑区同步序列化 */
	const resyncFromDom = async (current: VueWrapper<any>) => {
		;(current.find('.he-formula-editable').element as HTMLElement).dispatchEvent(
			new Event('input')
		)
		await nextTick()
	}

	it('渲染后派发 input 事件还原相同 LaTeX', async () => {
		wrapper = mountEditor('\\sum_{i=1}^{n}{f(i)}')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sum_{i=1}^{n}{f(i)}')
	})

	it('行内式往返保留 \\nolimits', async () => {
		wrapper = mountEditor('\\sum\\nolimits_{a}^{b}{x}')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sum\\nolimits_{a}^{b}{x}')
	})

	it('\\limits 在往返时被规整掉', async () => {
		wrapper = mountEditor('\\sum\\limits_{a}^{b}{x}')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sum_{a}^{b}{x}')
	})

	it('表达式花括号始终保留：\\sum x 补全为 \\sum{x}', async () => {
		wrapper = mountEditor('\\sum x')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sum{x}')
	})

	it('空表达式后接文本不被吞：\\sum{}dx 往返保持不变', async () => {
		wrapper = mountEditor('\\sum{}dx')
		expect(wrapper.find('.me-bigop__operand').exists()).toBe(true)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sum{}dx')
	})
})

// ============ 键盘导航 ============

describe('求和键盘导航', () => {
	it('带上下限求和插入后：下限 ↑ 到上限', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 3)
		expect(selectionIn('.me-bigop__sub')).toBe(true)

		pressKey('ArrowUp')
		expect(selectionIn('.me-bigop__sup')).toBe(true)
	})

	it('上限 ↓ 回下限', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 3)
		pressKey('ArrowUp')
		pressKey('ArrowDown')
		expect(selectionIn('.me-bigop__sub')).toBe(true)
	})

	it('下限 ↓ 进入表达式', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 3)
		pressKey('ArrowDown')
		expect(selectionIn('.me-bigop__operand')).toBe(true)
	})

	it('表达式 ↑ 回到最近的限界（上限末尾）', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 3)
		pressKey('ArrowDown')
		pressKey('ArrowUp')
		expect(selectionIn('.me-bigop__sup')).toBe(true)
	})

	it('仅上限求和：上限 ↓ 直接进表达式', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 1)
		expect(selectionIn('.me-bigop__sup')).toBe(true)
		pressKey('ArrowDown')
		expect(selectionIn('.me-bigop__operand')).toBe(true)
	})

	it('行内式下标末尾 → 跳到上标开头', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 4)
		expect(selectionIn('.me-bigop__sub')).toBe(true)

		pressKey('ArrowRight')
		expect(selectionIn('.me-bigop__sup')).toBe(true)
	})

	it('下限开头 ← 跳出求和落到前方文本槽', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 3)
		expect(selectionIn('.me-bigop__sub')).toBe(true)

		pressKey('ArrowLeft')
		expect(selectionIn('.me-bigop')).toBe(false)
	})
})

// ============ 整块删除 ============

describe('求和整块删除', () => {
	it('下限开头 Backspace 整块删除求和', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 3)
		expect(wrapper.findAll('.me-bigop')).toHaveLength(1)
		expect(selectionIn('.me-bigop__sub')).toBe(true)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('无限界求和在表达式开头 Backspace 整块删除', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 0)
		expect(selectionIn('.me-bigop__operand')).toBe(true)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('表达式末尾 Delete 整块删除求和', async () => {
		wrapper = mountEditor('\\sum_{i=1}^{n}{f(i)}')
		const slot = wrapper.find('.me-bigop__operand .me-text-slot')
		expect(slot.exists()).toBe(true)
		focusSlotEnd(slot.element as HTMLElement)

		pressKey('Delete')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('有上下限时表达式开头 Backspace 不删除（保留限界入口）', async () => {
		wrapper = mountEditor('\\sum_{i=1}^{n}{f(i)}')
		const slot = wrapper.find('.me-bigop__operand .me-text-slot')
		focusSlotEnd(slot.element as HTMLElement)
		// 先回到表达式开头
		const range = document.createRange()
		range.setStart((slot.element as HTMLElement).firstChild!, 0)
		range.collapse(true)
		const selection = window.getSelection()
		selection?.removeAllRanges()
		selection?.addRange(range)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(1)
	})
})
