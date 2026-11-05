import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 运算符弹层的单元测试
 * 覆盖：基本运算符 7 卡（:=、==、+=、−= 纯文本；def / m / △ 上置叠等号结构化节点）/
 * 插入与光标落点 / LaTeX 解析与往返 / 记号槽导航与整块删除 / 弹层互斥
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

/** 打开运算符弹层 */
const openOperator = async (wrapper: VueWrapper<any>) => {
	await wrapper.find('button[title="运算符"]').trigger('click')
}

/** 点击运算符弹层里的第 n 张卡 */
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

/** 取编辑器里的叠等号节点（含记号槽内的文本槽） */
const opParts = (wrapper: VueWrapper<any>) => {
	const op = wrapper.find('.he-formula-editable .me-op')
	const topSlot = op.find('.me-op__top .me-text-slot')
	return {
		op,
		topSlot: topSlot.element as HTMLElement,
		baseText: op.find('.me-op__base').text()
	}
}

/** 7 张卡的标题（弹层顺序） */
const CARD_TITLES = [
	'赋值 :=',
	'等于 ==',
	'加等于 +=',
	'减等于 −=',
	'定义等于（def 上置叠等号）',
	'm 上置叠等号',
	'三角上置叠等号'
]

/** 前 4 张纯文本卡：序号 / 卡片 id / 插入文本（LaTeX 源码） */
const TEXT_CASES: [number, string, string][] = [
	[0, 'colonEquals', ':='],
	[1, 'doubleEquals', '=='],
	[2, 'plusEquals', '+='],
	[3, 'minusEquals', '−=']
]

/** 后 3 张结构化卡：序号 / 卡片 id / 节点 variant / 预填记号 / 序列化结果 */
const STACK_CASES: [number, string, string, string, string][] = [
	[4, 'defEquals', 'stackrel', 'def', '\\stackrel{\\mathrm{def}}{=}'],
	[5, 'mEquals', 'stackrel', 'm', '\\stackrel{\\mathrm{m}}{=}'],
	[6, 'triangleEquals', 'triangleq', '△', '\\triangleq']
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

describe('运算符弹层', () => {
	it('弹层标题、分区：基本运算符 7 卡 + 运算符结构 12 卡', async () => {
		wrapper = mountEditor()
		await openOperator(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.exists()).toBe(true)
		expect(dialog.attributes('aria-label')).toBe('基本运算符')
		expect(dialog.find('.he-tool-popover__header').text()).toBe('基本运算符')

		const sections = dialog.findAll('.he-tool-popover__section')
		expect(sections).toHaveLength(2)
		expect(sections[0]!.text()).toBe('基本运算符')
		expect(sections[1]!.text()).toBe('运算符结构')

		const cards = dialog.findAll('.he-tool-card')
		expect(cards).toHaveLength(19)
		cards.slice(0, 7).forEach((card, index) => {
			expect(card.attributes('title')).toBe(CARD_TITLES[index])
		})
	})

	it('前 4 张卡为纯文本预览 :=、==、+=、−=', async () => {
		wrapper = mountEditor()
		await openOperator(wrapper)

		const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
		TEXT_CASES.forEach(([index, , preview]) => {
			expect(cards[index]!.find('.he-tool-card__preview').text()).toBe(preview)
		})
	})

	it('后 3 张卡为上置叠等号预览：def / m / △ 在上、等号在下', async () => {
		wrapper = mountEditor()
		await openOperator(wrapper)

		const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
		const tops = ['def', 'm', '△']
		;[4, 5, 6].forEach((index, order) => {
			const stack = cards[index]!.find('.op-stack')
			expect(stack.exists()).toBe(true)
			expect(stack.find('.op-stack__top').text()).toBe(tops[order])
			expect(stack.find('.op-stack__eq').text()).toBe('=')
		})
	})

	it('再次点击运算符按钮关闭弹层', async () => {
		wrapper = mountEditor()
		await openOperator(wrapper)
		expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

		await openOperator(wrapper)
		expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
	})
})

// ============ 插入 ============

describe('运算符插入', () => {
	it.each(TEXT_CASES.map(([index, id, latex]) => [id, index, latex] as const))(
		'点击 %s 卡：纯文本插入并关闭弹层',
		async (_id, index, latex) => {
			wrapper = mountEditor()
			await openOperator(wrapper)
			await pickCard(wrapper, index)

			expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
			expect(wrapper.find('.he-formula-editable .me-op').exists()).toBe(false)
			expect(lastEmitted(wrapper)).toBe(latex)
			expect(selectionIn('.he-formula-editable')).toBe(true)
		}
	)

	it.each(STACK_CASES.map(([index, id, variant, top, source]) => [id, index, variant, top, source] as const))(
		'点击 %s 卡：插入结构化叠等号节点并聚焦记号槽',
		async (_id, index, variant, top, source) => {
			wrapper = mountEditor()
			await openOperator(wrapper)
			await pickCard(wrapper, index)

			expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
			const { op, topSlot, baseText } = opParts(wrapper)
			expect(op.exists()).toBe(true)
			expect(op.attributes('data-op')).toBe(variant)
			expect(topSlot.textContent).toBe(top)
			expect(baseText).toBe('=')
			expect(lastEmitted(wrapper)).toBe(source)
			expect(selectionIn('.me-op__top')).toBe(true)
		}
	)

	it('光标在已有文本中间点 :=：插入到光标处', async () => {
		wrapper = mountEditor('a+b')
		await nextTick()
		const slot = wrapper.find('.he-formula-editable .me-text-slot').element as HTMLElement
		const range = document.createRange()
		range.setStart(slot.firstChild!, 1)
		range.collapse(true)
		const selection = window.getSelection()
		selection?.removeAllRanges()
		selection?.addRange(range)

		await openOperator(wrapper)
		await pickCard(wrapper, 0)

		expect(lastEmitted(wrapper)).toBe('a:=+b')
	})
})

// ============ 解析往返 ============

describe('运算符解析往返', () => {
	it.each(TEXT_CASES.map(([, id, latex]) => [id, latex] as const))(
		'%s 源码按原文显示并可原样回写',
		async (_id, latex) => {
			wrapper = mountEditor(latex)
			expect(wrapper.find('.he-formula-editable .me-text-slot').exists()).toBe(true)
			expect(wrapper.find('.he-formula-editable').text()).toContain(latex)

			await resyncFromDom(wrapper)
			expect(lastEmitted(wrapper)).toBe(latex)
		}
	)

	it('\\stackrel{\\mathrm{def}}{=} 解析为叠等号节点，记号槽显示 def（剥掉 \\mathrm 外壳）', async () => {
		wrapper = mountEditor('\\stackrel{\\mathrm{def}}{=}')
		const { op, topSlot, baseText } = opParts(wrapper)
		expect(op.exists()).toBe(true)
		expect(topSlot.textContent).toBe('def')
		expect(baseText).toBe('=')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\stackrel{\\mathrm{def}}{=}')
	})

	it('\\stackrel{abc}{=} 序列化时补 \\mathrm 直立包装（\\mathrm 归一化）', async () => {
		wrapper = mountEditor('\\stackrel{abc}{=}')
		const { topSlot } = opParts(wrapper)
		expect(topSlot.textContent).toBe('abc')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\stackrel{\\mathrm{abc}}{=}')
	})

	it('空记号 \\stackrel{}{=} 往返不变', async () => {
		wrapper = mountEditor('\\stackrel{}{=}')
		expect(wrapper.find('.he-formula-editable .me-op').exists()).toBe(true)

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\stackrel{}{=}')
	})

	it('\\triangleq 解析为 △ 上置叠等号并可原样回写', async () => {
		wrapper = mountEditor('\\triangleq')
		const { op, topSlot, baseText } = opParts(wrapper)
		expect(op.attributes('data-op')).toBe('triangleq')
		expect(topSlot.textContent).toBe('△')
		expect(baseText).toBe('=')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\triangleq')
	})

	it('\\triangleq 与后续文本共存：\\triangleq+1 往返不变', async () => {
		wrapper = mountEditor('\\triangleq+1')
		expect(wrapper.find('.he-formula-editable .me-op').exists()).toBe(true)
		expect(wrapper.find('.he-formula-editable').text()).toContain('+1')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\triangleq+1')
	})

	it('\\stackrel{m}{=}x 与后续文本共存，往返为 \\stackrel{\\mathrm{m}}{=}x', async () => {
		wrapper = mountEditor('\\stackrel{m}{=}x')
		const { topSlot } = opParts(wrapper)
		expect(topSlot.textContent).toBe('m')
		expect(wrapper.find('.he-formula-editable').text()).toContain('x')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\stackrel{\\mathrm{m}}{=}x')
	})

	it('非等号底座按原文保留：\\stackrel{a}{b} 不解析为叠等号节点', async () => {
		wrapper = mountEditor('\\stackrel{a}{b}')
		expect(wrapper.find('.he-formula-editable .me-op').exists()).toBe(false)

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\stackrel{a}{b}')
	})

	it('记号槽内容编辑后回写源码：def 改为 defx', async () => {
		wrapper = mountEditor('\\stackrel{\\mathrm{def}}{=}')
		const { topSlot } = opParts(wrapper)
		topSlot.textContent = 'defx'

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\stackrel{\\mathrm{defx}}{=}')
	})

	it('△ 改为 x 后降级为 \\stackrel{\\mathrm{x}}{=}（渲染不变）', async () => {
		wrapper = mountEditor('\\triangleq')
		const { topSlot } = opParts(wrapper)
		topSlot.textContent = 'x'

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\stackrel{\\mathrm{x}}{=}')
	})
})

// ============ 导航与整块删除 ============

describe('叠等号导航与整块删除', () => {
	it('记号槽末尾按 → 跳出到右侧文本槽', async () => {
		wrapper = mountEditor('x\\stackrel{\\mathrm{def}}{=}y')
		await nextTick()
		const { topSlot } = opParts(wrapper)
		placeCaret(topSlot, 3)
		pressKey('ArrowRight')

		expect(selectionIn('.me-op')).toBe(false)
		expect(selectionIn('.he-formula-editable .me-text-slot')).toBe(true)
	})

	it('记号槽开头按 ← 跳出到左侧文本槽', async () => {
		wrapper = mountEditor('x\\stackrel{\\mathrm{def}}{=}y')
		await nextTick()
		const { topSlot } = opParts(wrapper)
		placeCaret(topSlot, 0)
		pressKey('ArrowLeft')

		expect(selectionIn('.me-op')).toBe(false)
		expect(selectionIn('.he-formula-editable .me-text-slot')).toBe(true)
	})

	it('记号槽开头 Backspace 整块删除叠等号节点', async () => {
		wrapper = mountEditor('x\\stackrel{\\mathrm{def}}{=}y')
		await nextTick()
		const { topSlot } = opParts(wrapper)
		placeCaret(topSlot, 0)
		pressKey('Backspace')

		expect(wrapper.find('.he-formula-editable .me-op').exists()).toBe(false)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('xy')
	})

	it('记号槽末尾 Delete 整块删除叠等号节点', async () => {
		wrapper = mountEditor('x\\stackrel{\\mathrm{def}}{=}y')
		await nextTick()
		const { topSlot } = opParts(wrapper)
		placeCaret(topSlot, 3)
		pressKey('Delete')

		expect(wrapper.find('.he-formula-editable .me-op').exists()).toBe(false)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('xy')
	})

	it('点击叠等号节点聚焦记号槽', async () => {
		wrapper = mountEditor('x\\stackrel{\\mathrm{def}}{=}y')
		await nextTick()
		const opEl = wrapper.find('.he-formula-editable .me-op').element as HTMLElement
		opEl.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		await nextTick()

		expect(selectionIn('.me-op__top')).toBe(true)
	})
})

// ============ 弹层互斥 ============

describe('弹层互斥', () => {
	it('打开运算符后再点极限和对数：运算符关闭、极限和对数打开', async () => {
		wrapper = mountEditor()
		await openOperator(wrapper)
		expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

		await wrapper.find('button[title="极限和对数"]').trigger('click')
		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.exists()).toBe(true)
		expect(dialog.attributes('aria-label')).toBe('极限和对数')
	})

	it('打开极限和对数后再点运算符：极限和对数关闭、运算符打开', async () => {
		wrapper = mountEditor()
		await wrapper.find('button[title="极限和对数"]').trigger('click')
		expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('极限和对数')

		await openOperator(wrapper)
		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.exists()).toBe(true)
		expect(dialog.attributes('aria-label')).toBe('基本运算符')
	})

	it('点击工具栏外部：运算符弹层关闭', async () => {
		wrapper = mountEditor()
		await openOperator(wrapper)
		expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

		document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		await nextTick()
		expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
	})
})
