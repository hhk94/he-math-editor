import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 矩阵（\begin{matrix} 行列用 & 与 \\ 分隔）的单元测试
 * 覆盖：8 张空矩阵卡弹层 / 插入与序列化 / LaTeX 解析与往返 / 跨格导航 / 删除
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

/** 打开矩阵弹层 */
const openMatrix = async (wrapper: VueWrapper<any>) => {
	await wrapper.find('button[title="矩阵"]').trigger('click')
}

/** 点击矩阵弹层里的第 n 张卡 */
const pickCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
	await cards[index]!.trigger('click')
}

/** selection 起点对应的元素（文本节点则取父元素） */
const rangeAnchor = (range: Range): HTMLElement | null =>
	range.startContainer.nodeType === Node.TEXT_NODE
		? range.startContainer.parentElement
		: (range.startContainer as HTMLElement)

/** 当前光标所在的 contenteditable 槽位 */
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

/** 取第 n 个单元格里的文本槽 */
const cellSlot = (wrapper: VueWrapper<any>, index: number): HTMLElement =>
	wrapper.findAll('.me-matrix__cell')[index]!.find('.me-text-slot').element as HTMLElement

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

describe('矩阵弹层', () => {
	it('点击工具栏按钮打开弹层，标题为矩阵且包含 8 张模板卡', async () => {
		wrapper = mountEditor()
		await openMatrix(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.exists()).toBe(true)
		expect(dialog.attributes('aria-label')).toBe('矩阵')
		expect(dialog.find('.he-tool-popover__section').text()).toBe('空矩阵')
		expect(dialog.findAll('.he-tool-card')).toHaveLength(8)
	})

	it('8 张卡片按 1×2 到 3×3 的顺序排列，预览框总数与行列数一致', async () => {
		wrapper = mountEditor()
		await openMatrix(wrapper)

		const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
		expect(cards.map((card) => card.attributes('title'))).toEqual([
			'1×2 矩阵',
			'2×1 矩阵',
			'1×3 矩阵',
			'3×1 矩阵',
			'2×2 矩阵',
			'2×3 矩阵',
			'3×2 矩阵',
			'3×3 矩阵'
		])
		const boxes = wrapper.findAll('.matrix-preview__box')
		expect(boxes).toHaveLength(2 + 2 + 3 + 3 + 4 + 6 + 6 + 9)
	})
})

// ============ 插入与序列化 ============

describe('矩阵插入与序列化', () => {
	it('2×2 卡片插入四格矩阵并聚焦左上角单元格', async () => {
		wrapper = mountEditor()
		await openMatrix(wrapper)
		await pickCard(wrapper, 4)

		const matrix = wrapper.find('.me-matrix')
		expect(matrix.exists()).toBe(true)
		expect(matrix.findAll('.me-matrix__cell')).toHaveLength(4)
		expect(selectionIn('.me-matrix__cell')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\begin{matrix}&\\\\&\\end{matrix}')
	})

	it.each([
		[0, 1, 2],
		[1, 2, 1],
		[2, 1, 3],
		[3, 3, 1],
		[5, 2, 3],
		[6, 3, 2],
		[7, 3, 3]
	])('第 %i 张卡插入 %i 行 %i 列矩阵', async (index, rows, cols) => {
		wrapper = mountEditor()
		await openMatrix(wrapper)
		await pickCard(wrapper, index)

		const cells = wrapper.findAll('.me-matrix__cell')
		expect(cells).toHaveLength(rows * cols)
		const rowSet = new Set(cells.map((cell) => (cell.element as HTMLElement).dataset.row))
		expect(rowSet.size).toBe(rows)
	})
})

// ============ 解析与往返 ============

describe('矩阵解析与往返', () => {
	it('标准矩阵解析为四个单元格并原样序列化', async () => {
		wrapper = mountEditor('\\begin{matrix}a&b\\\\c&d\\end{matrix}')
		const cells = wrapper.findAll('.me-matrix__cell')
		expect(cells).toHaveLength(4)
		expect(cells.map((cell) => cell.text())).toEqual(['a', 'b', 'c', 'd'])
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\begin{matrix}a&b\\\\c&d\\end{matrix}')
	})

	it('参差矩阵的短行照原样还原', async () => {
		wrapper = mountEditor('\\begin{matrix}a&b\\\\c\\end{matrix}')
		expect(wrapper.findAll('.me-matrix__cell')).toHaveLength(3)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\begin{matrix}a&b\\\\c\\end{matrix}')
	})

	it('配对括号内的矩阵照常解析并往返', async () => {
		wrapper = mountEditor('\\left(\\begin{matrix}n\\\\k\\end{matrix}\\right)')
		expect(wrapper.find('.me-bracket').exists()).toBe(true)
		expect(wrapper.findAll('.me-matrix__cell')).toHaveLength(2)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\left(\\begin{matrix}n\\\\k\\end{matrix}\\right)')
	})

	it('单元格内的复杂结构（上下标与分式）照常解析', async () => {
		wrapper = mountEditor('\\begin{matrix}a^{2}&\\frac{1}{2}\\\\c&d\\end{matrix}')
		expect(wrapper.find('.me-script').exists()).toBe(true)
		expect(wrapper.find('.me-frac').exists()).toBe(true)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\begin{matrix}a^{2}&\\frac{1}{2}\\\\c&d\\end{matrix}')
	})

	it('嵌套环境里的 & 不参与外层切格', async () => {
		const latex = '\\begin{matrix}\\begin{matrix}a&b\\end{matrix}&c\\end{matrix}'
		wrapper = mountEditor(latex)
		expect(wrapper.findAll('.me-matrix')).toHaveLength(2)
		const outer = wrapper.find('.me-matrix')
		expect(outer.findAll(':scope > .me-matrix__grid > .me-matrix__cell')).toHaveLength(2)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe(latex)
	})
})

// ============ 跨格导航 ============

describe('矩阵跨格导航', () => {
	it('← 在非首格开头跳到上一格末尾，首格开头跳出矩阵', () => {
		wrapper = mountEditor('x\\begin{matrix}a&b\\\\c&d\\end{matrix}')
		const cells = wrapper.findAll('.me-matrix__cell')

		placeCaret(cellSlot(wrapper, 2), 0)
		pressKey('ArrowLeft')
		expect(currentSlot()?.closest('.me-matrix__cell')).toBe(cells[1]!.element)

		placeCaret(cellSlot(wrapper, 0), 0)
		pressKey('ArrowLeft')
		expect(currentSlot()?.closest('.me-matrix')).toBeNull()
	})

	it('→ 在格尾跳到下一格开头', () => {
		wrapper = mountEditor('\\begin{matrix}a&b\\\\c&d\\end{matrix}')
		const cells = wrapper.findAll('.me-matrix__cell')

		placeCaret(cellSlot(wrapper, 0), 1)
		pressKey('ArrowRight')
		expect(currentSlot()?.closest('.me-matrix__cell')).toBe(cells[1]!.element)

		placeCaret(cellSlot(wrapper, 1), 1)
		pressKey('ArrowRight')
		expect(currentSlot()?.closest('.me-matrix__cell')).toBe(cells[2]!.element)
	})

	it('↑ ↓ 在行间按同列移动', () => {
		wrapper = mountEditor('\\begin{matrix}a&b\\\\c&d\\end{matrix}')
		const cells = wrapper.findAll('.me-matrix__cell')

		placeCaret(cellSlot(wrapper, 0), 1)
		pressKey('ArrowDown')
		expect(currentSlot()?.closest('.me-matrix__cell')).toBe(cells[2]!.element)

		pressKey('ArrowUp')
		expect(currentSlot()?.closest('.me-matrix__cell')).toBe(cells[0]!.element)
	})

	it('↑ 在首行跳出矩阵', () => {
		wrapper = mountEditor('x\\begin{matrix}a&b\\\\c&d\\end{matrix}')
		placeCaret(cellSlot(wrapper, 0), 0)
		pressKey('ArrowUp')
		expect(currentSlot()?.closest('.me-matrix')).toBeNull()
	})

	it('↓ 在末行跳出矩阵', () => {
		wrapper = mountEditor('\\begin{matrix}a&b\\\\c&d\\end{matrix}y')
		placeCaret(cellSlot(wrapper, 2), 1)
		pressKey('ArrowDown')
		expect(currentSlot()?.closest('.me-matrix')).toBeNull()
	})
})

// ============ 删除 ============

describe('矩阵删除', () => {
	it('非首格开头退格跳到上一格末尾，矩阵保留', () => {
		wrapper = mountEditor('\\begin{matrix}a&b\\\\c&d\\end{matrix}')
		const cells = wrapper.findAll('.me-matrix__cell')
		placeCaret(cellSlot(wrapper, 2), 0)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-matrix')).toHaveLength(1)
		expect(currentSlot()?.closest('.me-matrix__cell')).toBe(cells[1]!.element)
	})

	it('首格开头退格整块删除矩阵', () => {
		wrapper = mountEditor('\\begin{matrix}a&b\\\\c&d\\end{matrix}')
		placeCaret(cellSlot(wrapper, 0), 0)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-matrix')).toHaveLength(0)
	})
})
