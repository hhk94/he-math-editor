import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 运算符结构（箭头标注）的单元测试
 * 覆盖：运算符弹层第二板块 12 卡 / \xleftarrow、\xrightarrow 与 \overset、\underset 组合解析 /
 * 标注槽插入与编辑回写 / 方向键进出 / 整块删除 / 与文本共存
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

/** 点击运算符弹层里的第 n 张卡（0–18，前 7 张为基本运算符） */
const pickCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
	await cards[index]!.trigger('click')
}

/** selection 起点对应的元素（文本节点则取父元素） */
const rangeAnchor = (range: Range): HTMLElement | null =>
	range.startContainer.nodeType === Node.TEXT_NODE
		? range.startContainer.parentElement
		: (range.startContainer as HTMLElement)

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

/** 派发 input 事件，触发可编辑区同步序列化 */
const resyncFromDom = async (wrapper: VueWrapper<any>) => {
	;(wrapper.find('.he-formula-editable').element as HTMLElement).dispatchEvent(new Event('input'))
	await nextTick()
}

/** 在当前光标处派发键盘事件（冒泡到可编辑区根节点） */
const pressKey = (key: string) => {
	const selection = window.getSelection()
	const anchor = selection?.rangeCount ? rangeAnchor(selection.getRangeAt(0)) : null
	const target = (anchor?.closest('[contenteditable]') as HTMLElement | null) ?? document.body
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

/** 12 张运算符结构卡的标题（弹层内顺序，接在 7 张基本卡之后） */
const CARD_TITLES = [
	'左箭头（下方标注）',
	'右箭头（下方标注）',
	'左箭头（上方标注）',
	'右箭头（上方标注）',
	'双线左箭头（下方标注）',
	'双线右箭头（下方标注）',
	'双线左箭头（上方标注）',
	'双线右箭头（上方标注）',
	'左右箭头（下方标注）',
	'左右箭头（上方标注）',
	'双线左右箭头（下方标注）',
	'双线左右箭头（上方标注）'
]

/** 12 张卡：弹层序号（0 起，含前 7 张基本卡）/ id / data-arrow / 符号 / 标注位置 / 空标注源码 */
const ARROW_CASES: [number, string, string, string, 'above' | 'below', string][] = [
	[7, 'xLeftBelow', 'left', '←', 'below', '\\xleftarrow[]{}'],
	[8, 'xRightBelow', 'right', '→', 'below', '\\xrightarrow[]{}'],
	[9, 'xLeftAbove', 'left', '←', 'above', '\\xleftarrow{}'],
	[10, 'xRightAbove', 'right', '→', 'above', '\\xrightarrow{}'],
	[11, 'xDoubleLeftBelow', 'doubleLeft', '⇐', 'below', '\\underset{}{\\Leftarrow}'],
	[12, 'xDoubleRightBelow', 'doubleRight', '⇒', 'below', '\\underset{}{\\Rightarrow}'],
	[13, 'xDoubleLeftAbove', 'doubleLeft', '⇐', 'above', '\\overset{}{\\Leftarrow}'],
	[14, 'xDoubleRightAbove', 'doubleRight', '⇒', 'above', '\\overset{}{\\Rightarrow}'],
	[15, 'xLeftRightBelow', 'leftRight', '↔', 'below', '\\underset{}{\\leftrightarrow}'],
	[16, 'xLeftRightAbove', 'leftRight', '↔', 'above', '\\overset{}{\\leftrightarrow}'],
	[17, 'xDoubleLeftRightBelow', 'leftRightDouble', '⇔', 'below', '\\underset{}{\\Leftrightarrow}'],
	[18, 'xDoubleLeftRightAbove', 'leftRightDouble', '⇔', 'above', '\\overset{}{\\Leftrightarrow}']
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

// ============ 弹层板块 ============

describe('运算符结构弹层', () => {
	it('第二板块 12 张卡：标题、符号、标注框位置（上方 / 下方）', async () => {
		wrapper = mountEditor()
		await openOperator(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		const sections = dialog.findAll('.he-tool-popover__section')
		expect(sections[1]!.text()).toBe('运算符结构')

		const cards = dialog.findAll('.he-tool-card').slice(7)
		expect(cards).toHaveLength(12)
		cards.forEach((card, order) => {
			expect(card.attributes('title')).toBe(CARD_TITLES[order])
			expect(card.find('.arrow-preview__sign').text()).toBe(ARROW_CASES[order]![3])
			expect(card.find('.arrow-preview__label').exists()).toBe(true)
		})
	})

	it('上方标注卡：虚线框在符号上方；下方标注卡：框在下方', async () => {
		wrapper = mountEditor()
		await openOperator(wrapper)

		const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card').slice(7)
		ARROW_CASES.forEach(([, , , , label], order) => {
			const preview = cards[order]!.find('.arrow-preview')
			const children = preview.element.children
			expect(children).toHaveLength(2)
			const labelIndex = Array.from(children).findIndex((el) =>
				(el as HTMLElement).classList.contains('arrow-preview__label')
			)
			expect(labelIndex).toBe(label === 'above' ? 0 : 1)
		})
	})
})

// ============ 插入 ============

describe('箭头标注插入', () => {
	it.each(ARROW_CASES.map(([, id, kind, glyph, label, source]) => [id, kind, glyph, label, source] as const))(
		'点击卡插入 %s：结构化节点 + 空标注槽 + 源码',
		async (_id, kind, glyph, label, source) => {
			const order = ARROW_CASES.findIndex((item) => item[1] === _id)
			wrapper = mountEditor()
			await openOperator(wrapper)
			await pickCard(wrapper, ARROW_CASES[order]![0])

			expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
			expect(lastEmitted(wrapper)).toBe(source)

			const arrow = wrapper.find('.he-formula-editable .me-arrow')
			expect(arrow.exists()).toBe(true)
			expect(arrow.attributes('data-arrow')).toBe(kind)
			expect(arrow.find('.me-arrow__sign').text()).toBe(glyph)
			const slot = arrow.find(label === 'above' ? '.me-arrow__above' : '.me-arrow__below')
			expect(slot.exists()).toBe(true)
			expect(arrow.find(label === 'above' ? '.me-arrow__below' : '.me-arrow__above').exists()).toBe(false)
			expect(selectionIn(label === 'above' ? '.me-arrow__above' : '.me-arrow__below')).toBe(true)
		}
	)
})

// ============ 解析往返 ============

describe('箭头标注解析往返', () => {
	it.each(
		[
			['\\xrightarrow{abc}', '\\xrightarrow{abc}'],
			['\\xleftarrow{a b}', '\\xleftarrow{a b}'],
			['\\xrightarrow[x]{abc}', '\\xrightarrow[x]{abc}'],
			['\\xleftarrow[下]{}', '\\xleftarrow[下]{}'],
			['\\xrightarrow[]{}', '\\xrightarrow[]{}'],
			['\\overset{a}{\\Leftarrow}', '\\overset{a}{\\Leftarrow}'],
			['\\underset{b}{\\Rightarrow}', '\\underset{b}{\\Rightarrow}'],
			['\\overset{a}{\\leftrightarrow}', '\\overset{a}{\\leftrightarrow}'],
			['\\underset{b}{\\leftrightarrow}', '\\underset{b}{\\leftrightarrow}'],
			['\\overset{a}{\\Leftrightarrow}', '\\overset{a}{\\Leftrightarrow}'],
			['\\underset{b}{\\Leftrightarrow}', '\\underset{b}{\\Leftrightarrow}'],
			['\\overset{a}{\\underset{b}{\\leftrightarrow}}', '\\overset{a}{\\underset{b}{\\leftrightarrow}}'],
			['\\underset{b}{\\overset{a}{\\leftrightarrow}}', '\\overset{a}{\\underset{b}{\\leftrightarrow}}']
		] as [string, string][]
	)('源码 %s 往返为 %s', async (input, expected) => {
		wrapper = mountEditor(input)
		const arrow = wrapper.find('.he-formula-editable .me-arrow')
		expect(arrow.exists()).toBe(true)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe(expected)
	})

	it('双槽节点：上方与下方标注槽并存', async () => {
		wrapper = mountEditor('\\xrightarrow[x]{abc}')
		const arrow = wrapper.find('.he-formula-editable .me-arrow')
		expect(arrow.find('.me-arrow__above').exists()).toBe(true)
		expect(arrow.find('.me-arrow__above').text()).toBe('abc')
		expect(arrow.find('.me-arrow__below').exists()).toBe(true)
		expect(arrow.find('.me-arrow__below').text()).toBe('x')
		expect(arrow.find('.me-arrow__sign').text()).toBe('→')
	})

	it('与后续文本共存：y\\xrightarrow{t}z 往返不变', async () => {
		wrapper = mountEditor('y\\xrightarrow{t}z')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('y\\xrightarrow{t}z')
	})

	it('非已知底座的 \\overset{a}{b} 不解析为箭头节点', async () => {
		wrapper = mountEditor('\\overset{a}{b}')
		expect(wrapper.find('.he-formula-editable .me-arrow').exists()).toBe(false)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\overset{a}{b}')
	})

	it('标注槽 aria-label 与编辑回写', async () => {
		wrapper = mountEditor()
		await openOperator(wrapper)
		await pickCard(wrapper, 10)

		const arrow = wrapper.find('.he-formula-editable .me-arrow')
		expect(arrow.find('.me-arrow__above').attributes('aria-label')).toBe('上方标注')

		const slot = arrow.find('.me-arrow__above .me-text-slot').element as HTMLElement
		slot.textContent = 'n→∞'
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\xrightarrow{n→∞}')
	})
})

// ============ 键盘交互 ============

describe('箭头标注键盘交互', () => {
	it('双槽节点：上方槽 ↓ 落到下方槽，下方槽 ↑ 回到上方槽', async () => {
		wrapper = mountEditor('\\xrightarrow[x]{abc}')
		const aboveSlot = wrapper.find('.me-arrow__above .me-text-slot').element as HTMLElement
		placeCaret(aboveSlot, 3)
		pressKey('ArrowDown')
		expect(selectionIn('.me-arrow__below')).toBe(true)

		const belowSlot = wrapper.find('.me-arrow__below .me-text-slot').element as HTMLElement
		placeCaret(belowSlot, 1)
		pressKey('ArrowUp')
		expect(selectionIn('.me-arrow__above')).toBe(true)
	})

	it('上方槽 → 到末尾跳出节点右侧', async () => {
		wrapper = mountEditor('\\xrightarrow{abc}')
		const slot = wrapper.find('.me-arrow__above .me-text-slot').element as HTMLElement
		placeCaret(slot, 3)
		pressKey('ArrowRight')
		expect(selectionIn('.me-arrow')).toBe(false)
	})

	it('上方槽 ← 到开头跳出节点左侧', async () => {
		wrapper = mountEditor('\\xrightarrow{abc}')
		const slot = wrapper.find('.me-arrow__above .me-text-slot').element as HTMLElement
		placeCaret(slot, 0)
		pressKey('ArrowLeft')
		expect(selectionIn('.me-arrow')).toBe(false)
	})

	it('Backspace：单槽节点开头整块删除', async () => {
		wrapper = mountEditor('\\xrightarrow{abc}')
		const slot = wrapper.find('.me-arrow__above .me-text-slot').element as HTMLElement
		placeCaret(slot, 0)
		pressKey('Backspace')
		expect(wrapper.find('.he-formula-editable .me-arrow').exists()).toBe(false)
	})

	it('Delete：单槽节点末尾整块删除', async () => {
		wrapper = mountEditor('\\xrightarrow{abc}')
		const slot = wrapper.find('.me-arrow__above .me-text-slot').element as HTMLElement
		placeCaret(slot, 3)
		pressKey('Delete')
		expect(wrapper.find('.he-formula-editable .me-arrow').exists()).toBe(false)
	})

	it('双槽节点分级删除：上方槽开头 Backspace 落到下方槽末尾', async () => {
		wrapper = mountEditor('\\xrightarrow[x]{abc}')
		const slot = wrapper.find('.me-arrow__above .me-text-slot').element as HTMLElement
		placeCaret(slot, 0)
		pressKey('Backspace')
		expect(wrapper.find('.he-formula-editable .me-arrow').exists()).toBe(true)
		expect(selectionIn('.me-arrow__below')).toBe(true)
	})

	it('双槽节点分级删除：下方槽末尾 Delete 落到上方槽开头', async () => {
		wrapper = mountEditor('\\xrightarrow[x]{abc}')
		const slot = wrapper.find('.me-arrow__below .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)
		pressKey('Delete')
		expect(wrapper.find('.he-formula-editable .me-arrow').exists()).toBe(true)
		expect(selectionIn('.me-arrow__above')).toBe(true)
	})

	it('双槽节点：下方槽开头 Backspace 整块删除', async () => {
		wrapper = mountEditor('\\xrightarrow[x]{abc}')
		const slot = wrapper.find('.me-arrow__below .me-text-slot').element as HTMLElement
		placeCaret(slot, 0)
		pressKey('Backspace')
		expect(wrapper.find('.he-formula-editable .me-arrow').exists()).toBe(false)
	})

	it('点击箭头符号聚焦标注槽', async () => {
		wrapper = mountEditor('\\xrightarrow{abc}')
		const sign = wrapper.find('.me-arrow__sign').element as HTMLElement
		sign.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		await nextTick()
		expect(selectionIn('.me-arrow__above')).toBe(true)
	})
})
