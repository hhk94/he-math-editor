import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 插入符号后的删除键行为
 * 插入分式 / 上下标时会整段选中目标槽位，选区里可能只有零宽占位符；
 * 此时必须一次退格（或 Delete）就有反馈，而不是因为「看不见的占位符」失效。
 */

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

/** 打开工具栏弹层并点击第 index 张格式卡 */
const pickTool = async (wrapper: VueWrapper<any>, toolTitle: string, index: number) => {
	await wrapper.find(`button[title="${toolTitle}"]`).trigger('click')
	const cards = wrapper.findAll('.he-tool-popover .he-tool-card')
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

/** 在容器末尾补一个空文本槽（等价于在末尾继续输入的 DOM 状态） */
const appendEmptySlot = (root: HTMLElement): HTMLElement => {
	const slot = document.createElement('span')
	slot.className = 'me-text-slot'
	slot.setAttribute('contenteditable', 'true')
	slot.dataset.role = 'text'
	slot.textContent = '\u200b'
	root.append(slot)
	return slot
}

/**
 * 在当前光标槽位上派发键盘事件（冒泡到可编辑区根节点）。
 * jsdom 中 contenteditable 的 focus() 不会更新 activeElement，
 * 这里直接从光标所在槽位派发以保持等价。
 */
const pressKey = (key: string) => {
	const target = currentSlot() ?? document.body
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
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

describe('插入分式后的退格', () => {
	it('插入 \u005cfrac{a}{b} 后第一次退格清空分子，再次退格整块删除', async () => {
		wrapper = mountEditor()
		await pickTool(wrapper, '分数', 0)

		expect(wrapper.findAll('.me-frac')).toHaveLength(1)
		expect(selectionIn('.me-frac__num')).toBe(true)
		// 插入后分子内容被整段选中
		expect(window.getSelection()?.isCollapsed).toBe(false)

		pressKey('Backspace')
		expect(lastEmitted(wrapper)).toBe('\\frac{}{b}')

		pressKey('Backspace')
		expect(wrapper.findAll('.me-frac')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})
})

describe('插入上下标后的删除', () => {
	it('插入上标（空占位符被选中）后退格一次整块删除', async () => {
		wrapper = mountEditor()
		await pickTool(wrapper, '上下标', 0)

		expect(wrapper.findAll('.me-script')).toHaveLength(1)
		expect(selectionIn('.me-script__sup')).toBe(true)
		expect(window.getSelection()?.isCollapsed).toBe(false)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-script')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('x')
	})

	it('插入上标（空占位符被选中）后 Delete 同样一次整块删除', async () => {
		wrapper = mountEditor()
		await pickTool(wrapper, '上下标', 0)
		expect(selectionIn('.me-script__sup')).toBe(true)

		pressKey('Delete')
		expect(wrapper.findAll('.me-script')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('x')
	})
})

describe('槽内选中文本的退格', () => {
	it('只删除选中的文本，不影响槽位其余内容', () => {
		wrapper = mountEditor('x+y')
		const slot = wrapper.find('.me-text-slot').element as HTMLElement
		const textNode = slot.firstChild!
		const range = document.createRange()
		range.setStart(textNode, 0)
		range.setEnd(textNode, 1)
		const selection = window.getSelection()
		selection?.removeAllRanges()
		selection?.addRange(range)

		pressKey('Backspace')
		expect(lastEmitted(wrapper)).toBe('+y')
	})

	it('选区覆盖整个槽位文本时退格清空槽位但保留外层结构', () => {
		wrapper = mountEditor('\\frac{a}{b}')
		const slot = wrapper.find('.me-frac__num .me-text-slot').element as HTMLElement
		const range = document.createRange()
		range.selectNodeContents(slot)
		const selection = window.getSelection()
		selection?.removeAllRanges()
		selection?.addRange(range)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-frac')).toHaveLength(1)
		expect(lastEmitted(wrapper)).toBe('\\frac{}{b}')
	})
})

describe('多个大型运算符穿插 + 后的删除', () => {
	it('末尾退格删除乘积后不留相邻空槽，继续退格依然有效', () => {
		wrapper = mountEditor('\\prod{}+\\prod{}+\\prod{}')
		const root = wrapper.find('.he-formula-editable').element as HTMLElement
		// 末尾继续输入时组件会挂一个文本槽，这里复现同样的 DOM 状态
		const trailing = appendEmptySlot(root)
		placeCaret(trailing, 0)

		pressKey('Backspace')
		expect(lastEmitted(wrapper)).toBe('\\prod{}+\\prod{}+')
		// 相邻两个文本槽是两个独立编辑宿主，浏览器原生退格跨不过去，必须回收
		expect(root.querySelectorAll('.me-text-slot + .me-text-slot')).toHaveLength(0)
		const focused = currentSlot()!
		expect(focused.previousElementSibling?.classList.contains('me-bigop')).toBe(true)

		placeCaret(focused, 0)
		pressKey('Backspace')
		expect(lastEmitted(wrapper)).toBe('\\prod{}++')
		expect(root.querySelectorAll('.me-text-slot + .me-text-slot')).toHaveLength(0)
	})

	it('相邻文本槽之间退格删除前一槽末字符并合并成一个槽', () => {
		wrapper = mountEditor('ab')
		const root = wrapper.find('.he-formula-editable').element as HTMLElement
		const second = appendEmptySlot(root)
		second.textContent = 'c'
		placeCaret(second, 0)

		pressKey('Backspace')
		expect(lastEmitted(wrapper)).toBe('ac')
		expect(root.querySelectorAll('.me-text-slot')).toHaveLength(1)
		expect(window.getSelection()?.getRangeAt(0).startOffset).toBe(1)
	})

	it('相邻文本槽之间 Delete 删除后一槽首字符并合并成一个槽', () => {
		wrapper = mountEditor('ab')
		const root = wrapper.find('.he-formula-editable').element as HTMLElement
		const second = appendEmptySlot(root)
		second.textContent = 'c'
		placeCaret(root.querySelector('.me-text-slot') as HTMLElement, 2)

		pressKey('Delete')
		expect(lastEmitted(wrapper)).toBe('ab')
		expect(root.querySelectorAll('.me-text-slot')).toHaveLength(1)
	})

	it('Delete 删除后一个乘积后不留相邻空槽', () => {
		wrapper = mountEditor('\\prod{}x\\prod{}')
		const root = wrapper.find('.he-formula-editable').element as HTMLElement
		const textSlot = root.querySelector(':scope > .me-text-slot') as HTMLElement
		placeCaret(textSlot, 1)

		pressKey('Delete')
		expect(lastEmitted(wrapper)).toBe('\\prod{}x')
		expect(root.querySelectorAll('.me-bigop')).toHaveLength(1)
		expect(root.querySelectorAll('.me-text-slot + .me-text-slot')).toHaveLength(0)
	})
})
