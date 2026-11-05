import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 导数符号（Word「导数符号」画廊）的单元测试
 * 覆盖：27 张卡弹层（20 个记号 + 2 个带框公式 + 顶线 / 底线 + 3 个常用导数对象）/ 单记号插入（含双层横线、带标记花括号）/
 * 预填宽带框公式与常用导数对象 / 上下方位 / LaTeX 解析与往返 / 参数与标签槽输入 / 跳出导航 / 整块删除 / 与函数弹层互斥
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

/** 打开导数符号弹层 */
const openDeriv = async (wrapper: VueWrapper<any>) => {
	await wrapper.find('button[title="导数符号"]').trigger('click')
}

/** 点击导数符号弹层里的第 n 张卡 */
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

/** 27 张卡的标题（画廊顺序） */
const CARD_TITLES = [
	'点 ˙',
	'双点 ˙˙',
	'三点 ˙˙˙',
	'帽形 ˆ',
	'钩形 ˇ',
	'锐音符 ´',
	'钝音符 `',
	'波浪线 ˜',
	'短音符 ˘',
	'横线 ¯',
	'双横线',
	'上花括号 ⏞',
	'下花括号 ⏟',
	'上方括号（带标记）',
	'下方括号（带标记）',
	'左箭头 ←',
	'右箭头 →',
	'左右箭头 ↔',
	'左鱼叉 ↼',
	'右鱼叉 ⇀',
	'空框',
	'带框公式 a² = b² + c²',
	'顶线',
	'底线',
	'A 顶线',
	'ABC 顶线',
	'x⊕y 顶线'
]

/** 17 张单节点卡：序号 / id / 序列化命令 / 标记 / 方位（双横线与带标记花括号单独测） */
const CARD_CASES: [number, string, string, string, 'over' | 'under'][] = [
	[0, 'dot', '\\dot', '˙', 'over'],
	[1, 'ddot', '\\ddot', '˙˙', 'over'],
	[2, 'dddot', '\\dddot', '˙˙˙', 'over'],
	[3, 'hat', '\\hat', 'ˆ', 'over'],
	[4, 'check', '\\check', 'ˇ', 'over'],
	[5, 'acute', '\\acute', '´', 'over'],
	[6, 'grave', '\\grave', '`', 'over'],
	[7, 'tilde', '\\tilde', '˜', 'over'],
	[8, 'breve', '\\breve', '˘', 'over'],
	[9, 'bar', '\\bar', '¯', 'over'],
	[11, 'overbrace', '\\overbrace', '⏞', 'over'],
	[12, 'underbrace', '\\underbrace', '⏟', 'under'],
	[15, 'leftarrow', '\\overleftarrow', '←', 'over'],
	[16, 'rightarrow', '\\overrightarrow', '→', 'over'],
	[17, 'leftrightarrow', '\\overleftrightarrow', '↔', 'over'],
	[18, 'leftharpoon', '\\overleftharpoon', '↼', 'over'],
	[19, 'rightharpoon', '\\overrightharpoon', '⇀', 'over']
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

describe('导数符号弹层', () => {
	it('点击工具栏按钮打开弹层，标题为导数符号且包含 27 张卡', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.exists()).toBe(true)
		expect(dialog.attributes('aria-label')).toBe('导数符号')
		const cards = dialog.findAll('.he-tool-card')
		expect(cards).toHaveLength(27)
		expect(cards.map((card) => card.attributes('title'))).toEqual(CARD_TITLES)
	})

	it('弹层包含带框公式、顶线和底线、常用导数对象三个板块', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.findAll('.he-tool-popover__section').map((el) => el.text())).toEqual([
			'带框公式',
			'顶线和底线',
			'常用导数对象'
		])
		const grids = dialog.findAll('.he-tool-popover__grid')
		expect(grids).toHaveLength(4)
		expect(grids[0]!.findAll('.he-tool-card')).toHaveLength(20)
		expect(grids[1]!.findAll('.he-tool-card')).toHaveLength(2)
		expect(grids[2]!.findAll('.he-tool-card')).toHaveLength(2)
		expect(grids[3]!.findAll('.he-tool-card')).toHaveLength(3)
		expect(grids[1]!.findAll('.he-tool-card')[1]!.classes()).toContain('he-tool-card--span2')
		expect(grids[3]!.findAll('.he-tool-card')[2]!.classes()).toContain('he-tool-card--span2')
		expect(grids[3]!.findAll('.accent-preview__text').map((el) => el.text())).toEqual([
			'A',
			'ABC',
			'x⊕y'
		])
	})

	it('带标记花括号卡显示两个占位框，标记位于两框之间', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)

		const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
		const LABELED_CARDS: [number, string][] = [
			[13, '⏞'],
			[14, '⏟']
		]
		for (const [index, mark] of LABELED_CARDS) {
			expect(cards[index]!.findAll('.accent-preview__box')).toHaveLength(2)
			expect(cards[index]!.find('.accent-preview__mark').text()).toBe(mark)
		}
	})

	it('再次点击工具栏按钮关闭弹层', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		await openDeriv(wrapper)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
	})

	it('打开导数符号弹层会关闭已打开的函数弹层', async () => {
		wrapper = mountEditor()
		await wrapper.find('button[title="函数"]').trigger('click')
		expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('函数')

		await openDeriv(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.attributes('aria-label')).toBe('导数符号')
		expect(wrapper.findAll('[role="dialog"]')).toHaveLength(1)
	})

	it('打开函数弹层会关闭已打开的导数符号弹层', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('导数符号')

		await wrapper.find('button[title="函数"]').trigger('click')

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.attributes('aria-label')).toBe('函数')
		expect(wrapper.findAll('[role="dialog"]')).toHaveLength(1)
	})
})

// ============ 插入：单个标记 ============

describe('插入导数符号', () => {
	it.each(CARD_CASES)(
		'点击第 %i 张卡插入 %s：方位 %s，标记不可编辑且光标落在参数槽',
		async (index, id, command, mark, placement) => {
			wrapper = mountEditor()
			await openDeriv(wrapper)
			await pickCard(wrapper, index)

			expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
			const deriv = wrapper.find('.me-deriv')
			expect(deriv.exists()).toBe(true)
			expect((deriv.element as HTMLElement).dataset.deriv).toBe(id)
			expect(deriv.classes().includes('me-deriv--under')).toBe(placement === 'under')
			expect(deriv.find('.me-deriv__mark').text()).toBe(mark)
			expect(deriv.find('.me-deriv__mark').attributes('aria-hidden')).toBe('true')
			expect(deriv.find('.me-deriv__arg .me-text-slot').exists()).toBe(true)
			// 上方记号在参数前，下方记号在参数后
			const first = (deriv.element as HTMLElement).firstElementChild as HTMLElement
			expect(first.classList.contains(placement === 'over' ? 'me-deriv__mark' : 'me-deriv__arg')).toBe(true)
			expect(selectionIn('.me-deriv__arg')).toBe(true)
			expect(lastEmitted(wrapper)).toBe(`${command}{}`)
		}
	)

	it('点击双横线卡插入两层嵌套 \\bar{\\bar{}}', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		await pickCard(wrapper, 10)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
		const derivs = wrapper.findAll('.me-deriv')
		expect(derivs).toHaveLength(2)
		expect((derivs[0]!.element as HTMLElement).dataset.deriv).toBe('bar')
		expect((derivs[1]!.element as HTMLElement).dataset.deriv).toBe('bar')
		expect(derivs[0]!.find('.me-deriv').exists()).toBe(true)
		expect(selectionIn('.me-deriv__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\bar{\\bar{}}')
	})

	it('点击上括号（带标记）卡插入 \\overbrace{}^{}，标签在前、参数在后并聚焦参数', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		await pickCard(wrapper, 13)

		const deriv = wrapper.find('.me-deriv')
		expect((deriv.element as HTMLElement).dataset.deriv).toBe('overbrace')
		expect(deriv.classes()).toContain('me-deriv--labeled')
		expect(deriv.classes()).not.toContain('me-deriv--under')
		expect(deriv.find('.me-deriv__label .me-text-slot').exists()).toBe(true)
		expect(deriv.find('.me-deriv__arg .me-text-slot').exists()).toBe(true)
		const children = Array.from((deriv.element as HTMLElement).children) as HTMLElement[]
		expect(children.map((el) => el.className)).toEqual([
			'me-deriv__label',
			'me-deriv__mark',
			'me-deriv__arg'
		])
		expect(selectionIn('.me-deriv__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\overbrace{}^{}')
	})

	it('点击下括号（带标记）卡插入 \\underbrace{}_{}，参数在前、标签在后并聚焦参数', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		await pickCard(wrapper, 14)

		const deriv = wrapper.find('.me-deriv')
		expect((deriv.element as HTMLElement).dataset.deriv).toBe('underbrace')
		expect(deriv.classes()).toContain('me-deriv--labeled')
		expect(deriv.classes()).toContain('me-deriv--under')
		const children = Array.from((deriv.element as HTMLElement).children) as HTMLElement[]
		expect(children.map((el) => el.className)).toEqual([
			'me-deriv__arg',
			'me-deriv__mark',
			'me-deriv__label'
		])
		expect(selectionIn('.me-deriv__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\underbrace{}_{}')
	})

	it('点击空框卡插入 \\boxed{}，节点带 me-deriv--boxed 且没有记号', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		await pickCard(wrapper, 20)

		const deriv = wrapper.find('.me-deriv')
		expect((deriv.element as HTMLElement).dataset.deriv).toBe('boxed')
		expect(deriv.classes()).toContain('me-deriv--boxed')
		expect(deriv.find('.me-deriv__mark').exists()).toBe(false)
		expect(deriv.find('.me-deriv__arg .me-text-slot').exists()).toBe(true)
		expect(selectionIn('.me-deriv__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\boxed{}')
	})

	it('点击带框公式宽带卡插入预填的勾股定理，光标落在参数末尾', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		await pickCard(wrapper, 21)

		const deriv = wrapper.find('.me-deriv')
		expect((deriv.element as HTMLElement).dataset.deriv).toBe('boxed')
		expect(deriv.classes()).toContain('me-deriv--boxed')
		expect(deriv.find('.me-deriv__arg').text().replace(/\u200b/g, '')).toBe('a2=b2+c2')
		expect(deriv.findAll('.me-script')).toHaveLength(3)
		expect(selectionIn('.me-deriv__arg')).toBe(true)
		// 光标在参数顶层末尾，不会钻进取后一个上标
		expect(currentSlot()?.parentElement?.classList.contains('me-deriv__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\boxed{a^{2}=b^{2}+c^{2}}')
	})

	it('点击顶线卡插入 \\overline{}，横线在参数上方', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		await pickCard(wrapper, 22)

		const deriv = wrapper.find('.me-deriv')
		expect((deriv.element as HTMLElement).dataset.deriv).toBe('overline')
		expect(deriv.classes()).not.toContain('me-deriv--under')
		const mark = deriv.find('.me-deriv__mark')
		expect(mark.classes()).toContain('me-deriv__mark--rule')
		expect(mark.classes()).toContain('me-deriv__mark--overline')
		expect(mark.text()).toBe('')
		const children = Array.from((deriv.element as HTMLElement).children) as HTMLElement[]
		expect(children.map((el) => el.className)).toEqual([
			'me-deriv__mark me-deriv__mark--rule me-deriv__mark--overline',
			'me-deriv__arg'
		])
		expect(selectionIn('.me-deriv__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\overline{}')
	})

	it('点击底线卡插入 \\underline{}，横线在参数下方', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		await pickCard(wrapper, 23)

		const deriv = wrapper.find('.me-deriv')
		expect((deriv.element as HTMLElement).dataset.deriv).toBe('underline')
		expect(deriv.classes()).toContain('me-deriv--under')
		const mark = deriv.find('.me-deriv__mark')
		expect(mark.classes()).toContain('me-deriv__mark--rule')
		expect(mark.classes()).toContain('me-deriv__mark--underline')
		const children = Array.from((deriv.element as HTMLElement).children) as HTMLElement[]
		expect(children.map((el) => el.className)).toEqual([
			'me-deriv__arg',
			'me-deriv__mark me-deriv__mark--rule me-deriv__mark--underline'
		])
		expect(selectionIn('.me-deriv__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\underline{}')
	})

	it('点击「A 顶线」插入预填的 \\overline{A}，光标落在参数末尾', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		await pickCard(wrapper, 24)

		const deriv = wrapper.find('.me-deriv')
		expect((deriv.element as HTMLElement).dataset.deriv).toBe('overline')
		expect(deriv.find('.me-deriv__arg').text().replace(/\u200b/g, '')).toBe('A')
		expect(selectionIn('.me-deriv__arg')).toBe(true)
		expect(currentSlot()?.parentElement?.classList.contains('me-deriv__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\overline{A}')
	})

	it('点击「ABC 顶线」插入预填的 \\overline{ABC} 并保留可编辑', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		await pickCard(wrapper, 25)

		const deriv = wrapper.find('.me-deriv')
		expect(deriv.find('.me-deriv__arg').text().replace(/\u200b/g, '')).toBe('ABC')
		expect(selectionIn('.me-deriv__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\overline{ABC}')
	})

	it('点击「x⊕y 顶线」宽卡插入 \\overline{x⊕y}，卡片横跨两列', async () => {
		wrapper = mountEditor()
		await openDeriv(wrapper)
		await pickCard(wrapper, 26)

		const deriv = wrapper.find('.me-deriv')
		expect(deriv.find('.me-deriv__arg').text().replace(/\u200b/g, '')).toBe('x⊕y')
		expect(selectionIn('.me-deriv__arg')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\overline{x⊕y}')

		const cards = wrapper.find('[role="dialog"]')
		expect(cards.exists()).toBe(false)
	})
})

// ============ 解析 / 往返 ============

describe('导数符号解析与往返', () => {
	const PARSE_CASES: [string, string, string][] = [
		['\\dot{x}', 'dot', 'x'],
		['\\ddot{y}', 'ddot', 'y'],
		['\\dddot{θ}', 'dddot', 'θ'],
		['\\hat{a}', 'hat', 'a'],
		['\\check{b}', 'check', 'b'],
		['\\acute{c}', 'acute', 'c'],
		['\\grave{d}', 'grave', 'd'],
		['\\tilde{e}', 'tilde', 'e'],
		['\\breve{f}', 'breve', 'f'],
		['\\bar{g}', 'bar', 'g'],
		['\\overbrace{h}', 'overbrace', 'h'],
		['\\underbrace{i}', 'underbrace', 'i'],
		['\\overleftarrow{l}', 'leftarrow', 'l'],
		['\\overrightarrow{m}', 'rightarrow', 'm'],
		['\\overleftrightarrow{n}', 'leftrightarrow', 'n'],
		['\\overleftharpoon{o}', 'leftharpoon', 'o'],
		['\\overrightharpoon{p}', 'rightharpoon', 'p'],
		['\\boxed{x+1}', 'boxed', 'x+1'],
		['\\overline{x}', 'overline', 'x'],
		['\\underline{x}', 'underline', 'x'],
		['\\overline{A}', 'overline', 'A'],
		['\\overline{ABC}', 'overline', 'ABC'],
		['\\overline{x⊕y}', 'overline', 'x⊕y']
	]

	it.each(PARSE_CASES)('%s 解析为 %s 节点并原样序列化', async (latex, id, argument) => {
		wrapper = mountEditor(latex)

		const deriv = wrapper.find('.me-deriv')
		expect(deriv.exists()).toBe(true)
		expect((deriv.element as HTMLElement).dataset.deriv).toBe(id)
		expect(deriv.find('.me-deriv__arg').text()).toBe(argument)

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe(latex)
	})

	it('\\bar{\\bar{x}} 解析为两层嵌套横线并原样序列化', async () => {
		wrapper = mountEditor('\\bar{\\bar{x}}')

		const derivs = wrapper.findAll('.me-deriv')
		expect(derivs).toHaveLength(2)
		expect(derivs[0]!.find('.me-deriv__arg .me-deriv').exists()).toBe(true)
		expect(derivs[1]!.find('.me-deriv__arg').text()).toBe('x')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\bar{\\bar{x}}')
	})

	it('\\overbrace{2}^{1} 解析为带标签的花括号节点并原样序列化', async () => {
		wrapper = mountEditor('\\overbrace{2}^{1}')

		const deriv = wrapper.find('.me-deriv')
		expect((deriv.element as HTMLElement).dataset.deriv).toBe('overbrace')
		expect(deriv.classes()).toContain('me-deriv--labeled')
		expect(deriv.find('.me-deriv__arg').text()).toBe('2')
		expect(deriv.find('.me-deriv__label').text()).toBe('1')
		// 标签被收进节点，不再生成额外的上下标节点
		expect(wrapper.findAll('.me-script')).toHaveLength(0)

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\overbrace{2}^{1}')
	})

	it('\\underbrace{1}_{2} 解析为带标签的下括号节点并原样序列化', async () => {
		wrapper = mountEditor('\\underbrace{1}_{2}')

		const deriv = wrapper.find('.me-deriv')
		expect((deriv.element as HTMLElement).dataset.deriv).toBe('underbrace')
		expect(deriv.classes()).toContain('me-deriv--labeled')
		expect(deriv.classes()).toContain('me-deriv--under')
		const children = Array.from((deriv.element as HTMLElement).children) as HTMLElement[]
		expect(children.map((el) => el.className)).toEqual([
			'me-deriv__arg',
			'me-deriv__mark',
			'me-deriv__label'
		])

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\underbrace{1}_{2}')
	})

	it('下置标记的节点带 me-deriv--under 类，参数在记号之前', () => {
		wrapper = mountEditor('\\underbrace{x}')

		const deriv = wrapper.find('.me-deriv')
		expect(deriv.classes()).toContain('me-deriv--under')
		expect((deriv.element as HTMLElement).firstElementChild!.classList.contains('me-deriv__arg')).toBe(true)
	})

	it('\\hat x 兼容单字符参数，序列化为带花括号的 \\hat{x}', async () => {
		wrapper = mountEditor('\\hat x+1')

		expect(wrapper.find('.me-deriv').exists()).toBe(true)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\hat{x}+1')
	})

	it('\\dots 不会被误判为 \\dot', () => {
		wrapper = mountEditor('\\dots')

		expect(wrapper.findAll('.me-deriv')).toHaveLength(0)
		expect(wrapper.find('.he-formula-editable').text()).toContain('\\dots')
	})

	it('\\hats 不会被误判为 \\hat', () => {
		wrapper = mountEditor('\\hats')

		expect(wrapper.findAll('.me-deriv')).toHaveLength(0)
		expect(wrapper.find('.he-formula-editable').text()).toContain('\\hats')
	})

	it('\\overleftrightarrow 优先于 \\overleftarrow 匹配', () => {
		wrapper = mountEditor('\\overleftrightarrow{x}')

		const derivs = wrapper.findAll('.me-deriv')
		expect(derivs).toHaveLength(1)
		expect((derivs[0]!.element as HTMLElement).dataset.deriv).toBe('leftrightarrow')
	})

	it('\\boxed{a^{2}=b^{2}+c^{2}} 解析为带框公式并原样序列化', async () => {
		wrapper = mountEditor('\\boxed{a^{2}=b^{2}+c^{2}}')

		const deriv = wrapper.find('.me-deriv')
		expect((deriv.element as HTMLElement).dataset.deriv).toBe('boxed')
		expect(deriv.classes()).toContain('me-deriv--boxed')
		expect(deriv.findAll('.me-script')).toHaveLength(3)

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\boxed{a^{2}=b^{2}+c^{2}}')
	})

	it('空框公式序列化为 \\boxed{}，不吞掉后接文本', async () => {
		wrapper = mountEditor('\\boxed{}+1')

		expect(wrapper.find('.me-deriv--boxed .me-text-slot').text()).toBe('\u200b')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\boxed{}+1')
	})

	it('\\underline 不会被误判为 \\underbrace', () => {
		wrapper = mountEditor('\\underline{x}')

		const deriv = wrapper.find('.me-deriv')
		expect((deriv.element as HTMLElement).dataset.deriv).toBe('underline')
		expect(deriv.find('.me-deriv__label').exists()).toBe(false)
	})

	it('\\overline 的参数里的分式仍然结构化，往返保持不变', async () => {
		wrapper = mountEditor('\\overline{\\frac{a}{b}}')

		const deriv = wrapper.find('.me-deriv')
		expect(deriv.find('.me-frac').exists()).toBe(true)

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\overline{\\frac{a}{b}}')
	})

	it('没有 ^{...} 时 \\overbrace 不生成标签槽', () => {
		wrapper = mountEditor('\\overbrace{x}')

		const deriv = wrapper.find('.me-deriv')
		expect(deriv.classes()).not.toContain('me-deriv--labeled')
		expect(deriv.find('.me-deriv__label').exists()).toBe(false)
	})

	it('参数里的分式仍然结构化，往返保持不变', async () => {
		wrapper = mountEditor('\\ddot{\\frac{a}{b}}')

		const deriv = wrapper.find('.me-deriv')
		expect(deriv.find('.me-frac').exists()).toBe(true)
		expect(deriv.find('.me-frac__num').text()).toBe('a')
		expect(deriv.find('.me-frac__den').text()).toBe('b')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\ddot{\\frac{a}{b}}')
	})

	it('导数符号可以嵌套在函数参数里', async () => {
		wrapper = mountEditor('\\sin{\\dot{x}}')

		expect(wrapper.find('.me-func .me-deriv').exists()).toBe(true)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\sin{\\dot{x}}')
	})

	it('空参数序列化为 \\dot{}，不吞掉后接文本', async () => {
		wrapper = mountEditor('\\dot{}+1')

		expect(wrapper.find('.me-deriv__arg .me-text-slot').text()).toBe('\u200b')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\dot{}+1')
	})

	it('在参数槽输入字符后序列化 \\dot{y}', async () => {
		wrapper = mountEditor('\\dot{x}')
		const slot = wrapper.find('.me-deriv__arg .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)

		slot.textContent = 'y'
		await resyncFromDom(wrapper)

		expect(lastEmitted(wrapper)).toBe('\\dot{y}')
	})

	it('在标签槽输入字符后回写标记部分', async () => {
		wrapper = mountEditor('\\overbrace{x}^{1}')
		const slot = wrapper.find('.me-deriv__label .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)

		slot.textContent = 'n'
		await resyncFromDom(wrapper)

		expect(lastEmitted(wrapper)).toBe('\\overbrace{x}^{n}')
	})
})

// ============ 导航与删除 ============

describe('导数参数槽的光标与删除', () => {
	it('参数末尾按 → 跳出到导数右侧，开头按 ← 跳出到导数左侧', () => {
		wrapper = mountEditor('a\\dot{x}+1')
		const slot = wrapper.find('.me-deriv__arg .me-text-slot').element as HTMLElement

		placeCaret(slot, 1)
		pressKey('ArrowRight')
		expect(selectionIn('.me-deriv')).toBe(false)
		expect(currentSlot()?.textContent).toBe('+1')

		placeCaret(slot, 0)
		pressKey('ArrowLeft')
		expect(selectionIn('.me-deriv')).toBe(false)
		expect(currentSlot()?.textContent).toBe('a')
	})

	it('下置标记的参数槽末尾按 → 同样跳出右侧', () => {
		wrapper = mountEditor('a\\underbrace{x}+1')
		const slot = wrapper.find('.me-deriv__arg .me-text-slot').element as HTMLElement

		placeCaret(slot, 1)
		pressKey('ArrowRight')
		expect(selectionIn('.me-deriv')).toBe(false)
		expect(currentSlot()?.textContent).toBe('+1')
	})

	it('嵌套导数符号：内层末尾按 → 先停在外层参数槽，再按一次才离开外层', () => {
		wrapper = mountEditor('\\bar{\\bar{x}}')
		const inner = wrapper.find('.me-deriv__arg .me-text-slot').element as HTMLElement
		const outerArg = wrapper.findAll('.me-deriv__arg')[0]!.element

		placeCaret(inner, 1)
		pressKey('ArrowRight')
		expect(selectionIn('.me-deriv')).toBe(true)
		expect(currentSlot()?.parentElement).toBe(outerArg)

		pressKey('ArrowRight')
		expect(selectionIn('.me-deriv')).toBe(false)
	})

	it('嵌套导数符号：内层开头按 ← 先停在外层参数槽，再按一次才离开外层', () => {
		wrapper = mountEditor('\\overline{\\overline{x}}')
		const inner = wrapper.find('.me-deriv__arg .me-text-slot').element as HTMLElement
		const outerArg = wrapper.findAll('.me-deriv__arg')[0]!.element

		placeCaret(inner, 0)
		pressKey('ArrowLeft')
		expect(selectionIn('.me-deriv')).toBe(true)
		expect(currentSlot()?.parentElement).toBe(outerArg)

		pressKey('ArrowLeft')
		expect(selectionIn('.me-deriv')).toBe(false)
	})

	it('参数槽开头退格整块删除导数节点', () => {
		wrapper = mountEditor('\\hat{x}')
		const slot = wrapper.find('.me-deriv__arg .me-text-slot').element as HTMLElement
		placeCaret(slot, 0)

		pressKey('Backspace')

		expect(wrapper.findAll('.me-deriv')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('参数槽末尾 Delete 也整块删除导数节点', () => {
		wrapper = mountEditor('\\tilde{x}')
		const slot = wrapper.find('.me-deriv__arg .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)

		pressKey('Delete')

		expect(wrapper.findAll('.me-deriv')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('导数后相邻文本槽开头退格删除整个导数节点', () => {
		wrapper = mountEditor('\\dot{x}+1')
		const slots = wrapper.findAll('.me-text-slot')
		placeCaret(slots[1]!.element as HTMLElement, 0)

		pressKey('Backspace')

		expect(wrapper.findAll('.me-deriv')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('+1')
	})

	it('上括号：参数槽按 ↑ 进入标签槽，标签槽按 ↓ 回到参数槽', () => {
		wrapper = mountEditor('\\overbrace{2}^{1}')
		const argSlot = wrapper.find('.me-deriv__arg .me-text-slot').element as HTMLElement
		const labelSlot = wrapper.find('.me-deriv__label .me-text-slot').element as HTMLElement

		placeCaret(argSlot, 0)
		pressKey('ArrowUp')
		expect(selectionIn('.me-deriv__label')).toBe(true)

		placeCaret(labelSlot, 1)
		pressKey('ArrowDown')
		expect(selectionIn('.me-deriv__arg')).toBe(true)
	})

	it('下括号：参数槽末尾按 ↓ 进入标签槽，标签槽按 ↑ 回到参数槽', () => {
		wrapper = mountEditor('\\underbrace{1}_{2}')
		const argSlot = wrapper.find('.me-deriv__arg .me-text-slot').element as HTMLElement
		const labelSlot = wrapper.find('.me-deriv__label .me-text-slot').element as HTMLElement

		placeCaret(argSlot, 1)
		pressKey('ArrowDown')
		expect(selectionIn('.me-deriv__label')).toBe(true)

		placeCaret(labelSlot, 0)
		pressKey('ArrowUp')
		expect(selectionIn('.me-deriv__arg')).toBe(true)
	})

	it('标签槽开头退格整块删除带标记花括号节点', () => {
		wrapper = mountEditor('\\overbrace{x}^{1}')
		const labelSlot = wrapper.find('.me-deriv__label .me-text-slot').element as HTMLElement
		placeCaret(labelSlot, 0)

		pressKey('Backspace')

		expect(wrapper.findAll('.me-deriv')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})
})
