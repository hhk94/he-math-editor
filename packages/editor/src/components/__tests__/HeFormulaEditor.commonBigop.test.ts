import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 常用大型运算符（第五板块）的单元测试
 * 覆盖：弹层 5 张预填模板卡 / 插入内容与序列化 / 空槽聚焦 / LaTeX 解析与往返
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

/** 点击“常用大型运算符”板块（第五个 grid）里的第 n 张卡 */
const pickCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.findAll('.he-tool-popover__grid')[4]!.findAll('.he-tool-card')
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

describe('常用大型运算符弹层', () => {
	it('常用大型运算符板块一行 5 张模板卡，标题按模板内容区分', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)

		const cards = wrapper.findAll('.he-tool-popover__grid')[4]!.findAll('.he-tool-card')
		expect(cards).toHaveLength(5)
		expect(cards.map((card) => card.attributes('title'))).toEqual([
			'组合数求和模板',
			'上下限求和模板',
			'多条件求和模板',
			'上下限乘积模板',
			'上下限并集模板'
		])
	})

	it('模板预览按内容渲染：组合数小分数 / 空表达式虚线槽 / 多条件下限', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)

		const cards = wrapper.findAll('.he-tool-popover__grid')[4]!.findAll('.he-tool-card')
		// 卡 1：∑_k 组合数（括号小分数），仅下限
		expect(cards[0]!.find('.math-bigop__sub').text()).toBe('k')
		expect(cards[0]!.find('.math-bigop__sup').exists()).toBe(false)
		expect(cards[0]!.find('.math-frac--small').exists()).toBe(true)
		// 卡 2：∑_{i=0}^{n} 空表达式（虚线槽），上下限齐全
		expect(cards[1]!.find('.math-bigop__sub').text()).toBe('i=0')
		expect(cards[1]!.find('.math-bigop__sup').text()).toBe('n')
		expect(cards[1]!.find('.math-dash').exists()).toBe(true)
		// 卡 3：多条件下限（两行）+ P(i,j)
		expect(cards[2]!.find('.math-bigop__sub').text()).toBe('0≤i≤m0<j<n')
		expect(cards[2]!.find('.math-bigop__operand').text()).toBe('P(i, j)')
		// 卡 4 / 卡 5：上下限齐全
		expect(cards[3]!.find('.math-bigop__sub').text()).toBe('k=1')
		expect(cards[3]!.find('.math-bigop__sup').text()).toBe('n')
		expect(cards[4]!.find('.math-bigop__sub').text()).toBe('i=1')
		expect(cards[4]!.find('.math-bigop__sup').text()).toBe('m')
	})
})

// ============ 插入 ============

describe('插入常用大型运算符模板', () => {
	it('组合数求和：序列化 \\sum_{k}{(\\tfrac{n}{k})}，焦点落在首个槽位（下限）', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 0)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
		expect(lastEmitted(wrapper)).toBe('\\sum_{k}{(\\tfrac{n}{k})}')
		expect(selectionIn('.me-bigop__sub')).toBe(true)
	})

	it('上下限求和：表达式留空，焦点直接落在空表达式槽位', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 1)

		const bigop = wrapper.find('.me-bigop')
		expect((bigop.element as HTMLElement).dataset.sign).toBe('∑')
		expect(bigop.find('.me-bigop__sub').text()).toBe('i=0')
		expect(bigop.find('.me-bigop__sup').text()).toBe('n')
		expect(lastEmitted(wrapper)).toBe('\\sum_{i=0}^{n}{}')
		expect(selectionIn('.me-bigop__operand')).toBe(true)
	})

	it('多条件求和：下限为单行文本，表达式 P(i,j)', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 2)

		const bigop = wrapper.find('.me-bigop')
		expect(bigop.find('.me-bigop__sub').text()).toBe('0≤i≤m, 0<j<n')
		expect(bigop.find('.me-bigop__operand').text()).toBe('P(i,j)')
		expect(lastEmitted(wrapper)).toBe('\\sum_{0≤i≤m, 0<j<n}{P(i,j)}')
	})

	it('上下限乘积：序列化 \\prod_{k=1}^{n}{A_{k}}', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 3)

		expect(lastEmitted(wrapper)).toBe('\\prod_{k=1}^{n}{A_{k}}')
	})

	it('上下限并集：序列化 \\bigcup_{i=1}^{m}{(X_{i}∩Y_{n})}', async () => {
		wrapper = mountEditor()
		await openBigOperator(wrapper)
		await pickCard(wrapper, 4)

		expect(lastEmitted(wrapper)).toBe('\\bigcup_{i=1}^{m}{(X_{i}∩Y_{n})}')
	})
})

// ============ 解析与往返 ============

describe('常用大型运算符解析与往返', () => {
	/** 渲染完成后派发 input 事件，触发可编辑区同步序列化 */
	const resyncFromDom = async (current: VueWrapper<any>) => {
		;(current.find('.he-formula-editable').element as HTMLElement).dispatchEvent(
			new Event('input')
		)
		await nextTick()
	}

	it('解析多条件下限求和：下限与表达式分别渲染', () => {
		wrapper = mountEditor('\\sum_{0≤i≤m, 0<j<n}{P(i,j)}')
		expect(wrapper.findAll('.me-bigop')).toHaveLength(1)
		expect(wrapper.find('.me-bigop__sign').text()).toBe('∑')
		expect(wrapper.find('.me-bigop__sub').text()).toBe('0≤i≤m, 0<j<n')
		expect(wrapper.find('.me-bigop__operand').text()).toBe('P(i,j)')
	})

	it('解析组合数求和：括号小分数结构', () => {
		wrapper = mountEditor('\\sum_{k}{(\\tfrac{n}{k})}')
		const operand = wrapper.find('.me-bigop__operand')
		expect(wrapper.find('.me-bigop__sub').text()).toBe('k')
		expect(operand.find('.me-frac--small').exists()).toBe(true)
		expect(operand.text()).toBe('(nk)')
	})

	it('多条件求和往返保持不变', async () => {
		wrapper = mountEditor('\\sum_{0≤i≤m, 0<j<n}{P(i,j)}')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sum_{0≤i≤m, 0<j<n}{P(i,j)}')
	})

	it('组合数求和往返保持不变', async () => {
		wrapper = mountEditor('\\sum_{k}{(\\tfrac{n}{k})}')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sum_{k}{(\\tfrac{n}{k})}')
	})
})
