import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 方括号（\left ... \right）的单元测试
 * 覆盖：12 张模板卡弹层 / 插入与序列化 / LaTeX 解析与往返 / 嵌套 / 删除 / 非法输入降级
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

/** 打开方括号弹层 */
const openBracket = async (wrapper: VueWrapper<any>) => {
	await wrapper.find('button[title="括号"]').trigger('click')
}

/** 点击方括号弹层里的第 n 张卡 */
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

/** 12 种括号模板：id / 往返 LaTeX / 编辑区左右定界符字符 */
const BRACKET_CASES: [string, string, string, string][] = [
	['paren', '\\left( x \\right)', '(', ')'],
	['bracket', '\\left[ x \\right]', '[', ']'],
	['brace', '\\left\\{ x \\right\\}', '{', '}'],
	['angle', '\\left\\langle x \\right\\rangle', '⟨', '⟩'],
	['floor', '\\left\\lfloor x \\right\\rfloor', '⌊', '⌋'],
	['ceil', '\\left\\lceil x \\right\\rceil', '⌈', '⌉'],
	['bar', '\\left| x \\right|', '|', '|'],
	['dbar', '\\left\\| x \\right\\|', '‖', '‖'],
	['leftOpen', '\\left[ x \\right[', '[', '['],
	['leftClose', '\\left] x \\right]', ']', ']'],
	['reverse', '\\left] x \\right[', ']', '['],
	['doubleBracket', '\\left\\lbrack\\lbrack x \\right\\rbrack\\rbrack', '⟦', '⟧']
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

describe('方括号弹层', () => {
	it('点击工具栏按钮打开弹层，标题为方括号且包含 41 张模板卡', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.exists()).toBe(true)
		expect(dialog.attributes('aria-label')).toBe('方括号')
		// 第一板块 12 张普通括号 + 第二板块 4 张带分隔符 + 第三板块 18 张单侧括号 + 第四板块 4 张堆栈 + 第五板块 3 张常用公式
		expect(dialog.findAll('.he-tool-card')).toHaveLength(41)
		expect(dialog.findAll('.he-tool-card').slice(0, 12).map((card) => card.attributes('title'))).toEqual([
			'圆括号',
			'方括号',
			'花括号',
			'尖括号',
			'向下取整',
			'向上取整',
			'绝对值',
			'范数',
			'左方括号',
			'右方括号',
			'反向方括号',
			'双方括号'
		])
	})
})

// ============ 插入 ============

describe('插入方括号模板', () => {
	it('第一张卡插入圆括号：定界符不可编辑，光标落在内容槽的文本槽里', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickCard(wrapper, 0)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
		const bracket = wrapper.find('.me-bracket')
		expect(bracket.exists()).toBe(true)
		expect((bracket.element as HTMLElement).dataset.bracket).toBe('paren')
		expect(bracket.find('.me-bracket__open').text()).toBe('(')
		expect(bracket.find('.me-bracket__close').text()).toBe(')')
		expect(bracket.find('.me-bracket__open').attributes('contenteditable')).toBeUndefined()
		expect(bracket.find('.me-bracket__content .me-text-slot').exists()).toBe(true)
		expect(selectionIn('.me-bracket__content')).toBe(true)
	})

	it('插入后序列化为 \\left( \\right)', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickCard(wrapper, 0)

		const latex = lastEmitted(wrapper)
		expect(latex).toContain('\\left(')
		expect(latex).toContain('\\right)')
		expect(latex).toBe('\\left(\\right)')
	})
})

// ============ 解析 / 往返 ============

describe('方括号解析与往返', () => {
	it('12 种定界符都能解析出对应格式并原样序列化', async () => {
		wrapper = mountEditor('')
		for (const [id, latex, glyphLeft, glyphRight] of BRACKET_CASES) {
			await wrapper.setProps({ modelValue: latex })
			await nextTick()

			const bracket = wrapper.find('.me-bracket')
			expect(bracket.exists(), id).toBe(true)
			expect((bracket.element as HTMLElement).dataset.bracket).toBe(id)
			expect(bracket.find('.me-bracket__open').text()).toBe(glyphLeft)
			expect(bracket.find('.me-bracket__close').text()).toBe(glyphRight)
			expect(bracket.find('.me-bracket__content').text().trim()).toBe('x')

			await resyncFromDom(wrapper)
			expect(lastEmitted(wrapper)).toBe(latex)
		}
	})

	it('嵌套结构解析：括号里的分式仍然结构化，往返保持不变', async () => {
		wrapper = mountEditor('\\left( \\frac{a}{b} \\right)')

		const bracket = wrapper.find('.me-bracket')
		expect(bracket.exists()).toBe(true)
		expect(bracket.find('.me-frac').exists()).toBe(true)
		expect(bracket.find('.me-frac__num').text()).toBe('a')
		expect(bracket.find('.me-frac__den').text()).toBe('b')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\left( \\frac{a}{b} \\right)')
	})

	it('嵌套括号：内层方括号与外层圆括号各算一个结构', () => {
		wrapper = mountEditor('\\left( \\left[ x \\right] \\right)')

		const brackets = wrapper.findAll('.me-bracket')
		expect(brackets).toHaveLength(2)
		expect((brackets[0]!.element as HTMLElement).dataset.bracket).toBe('paren')
		expect((brackets[1]!.element as HTMLElement).dataset.bracket).toBe('bracket')
	})

	it('在内容槽输入字符后序列化 \\left( y \\right)', async () => {
		wrapper = mountEditor('\\left(x\\right)')
		const slot = wrapper.find('.me-bracket__content .me-text-slot').element as HTMLElement
		placeCaret(slot, 0)

		slot.textContent = 'y'
		await resyncFromDom(wrapper)

		expect(lastEmitted(wrapper)).toBe('\\left(y\\right)')
	})

	it('不配对的 \\left 不崩溃，按普通文本渲染', () => {
		wrapper = mountEditor('\\left( x')

		expect(wrapper.findAll('.me-bracket')).toHaveLength(0)
		expect(wrapper.find('.he-formula-editable').text()).toContain('\\left( x')
	})

	it('左右定界符不匹配 \\left\\{ ... \\right) 也不崩溃，按普通文本渲染', () => {
		wrapper = mountEditor('\\left\\{ x \\right)')

		expect(wrapper.findAll('.me-bracket')).toHaveLength(0)
		expect(wrapper.find('.he-formula-editable').text()).toContain('\\left\\{')
	})
})

// ============ 删除 ============

describe('方括号的删除', () => {
	it('内容槽开头退格整块删除括号', () => {
		wrapper = mountEditor('\\left(x\\right)')
		const slot = wrapper.find('.me-bracket__content .me-text-slot').element as HTMLElement
		placeCaret(slot, 0)

		pressKey('Backspace')

		expect(wrapper.findAll('.me-bracket')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('内容槽末尾 Delete 也整块删除括号', () => {
		wrapper = mountEditor('\\left(x\\right)')
		const slot = wrapper.find('.me-bracket__content .me-text-slot').element as HTMLElement
		placeCaret(slot, 1)

		pressKey('Delete')

		expect(wrapper.findAll('.me-bracket')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})
})

describe('嵌套方括号的光标移动', () => {
	it('内层括号末尾按 → 先停在外层内容槽，再按一次才离开外层', () => {
		wrapper = mountEditor('\\left(\\left[x\\right]\\right)')
		const inner = wrapper.find('.me-bracket__content .me-text-slot').element as HTMLElement
		const outerContent = wrapper.findAll('.me-bracket__content')[0]!.element

		placeCaret(inner, 1)
		pressKey('ArrowRight')
		expect(wrapper.findAll('.me-bracket')).toHaveLength(2)
		expect(currentSlot()?.parentElement).toBe(outerContent)

		pressKey('ArrowRight')
		expect(selectionIn('.me-bracket')).toBe(false)
	})
})

// ============ 带分隔符的方括号 ============

/** 打开括号弹层里的「带分隔符」板块：前 12 张是普通括号，后 4 张是带分隔符 */
const pickSeparatorCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
	await cards[12 + index]!.trigger('click')
}

describe('带分隔符的方括号弹层', () => {
	it('括号弹层第二板块有 4 张模板卡，标题为带分隔符的方括号', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.findAll('.he-tool-popover__section').map((el) => el.text())).toEqual([
			'带分隔符的方括号',
			'单方括号',
			'事例和堆栈',
			'常用方括号'
		])
		expect(dialog.findAll('.he-tool-card')).toHaveLength(41)
		expect(dialog.findAll('.he-tool-card').slice(12, 16).map((card) => card.attributes('title'))).toEqual([
			'圆括号带分隔符',
			'花括号带分隔符',
			'尖括号带 1 条分隔符',
			'尖括号带 2 条分隔符'
		])
	})
})

describe('插入带分隔符的方括号', () => {
	it('圆括号模板插入两个内容段和一条竖线分隔符，光标落在第一段', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickSeparatorCard(wrapper, 0)

		const bracket = wrapper.find('.me-bracket')
		expect(bracket.find('.me-bracket__open').text()).toBe('(')
		expect(bracket.find('.me-bracket__close').text()).toBe(')')
		expect(bracket.findAll('.me-bracket__content')).toHaveLength(2)
		expect(bracket.findAll('.me-bracket__sep')).toHaveLength(1)
		expect(bracket.find('.me-bracket__sep').text()).toBe('|')
		expect(bracket.find('.me-bracket__sep').attributes('contenteditable')).toBeUndefined()
		expect(selectionIn('.me-bracket__content')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\left(\\middle|\\right)')
	})

	it('尖括号三段模板插入三条内容段和两条分隔符', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickSeparatorCard(wrapper, 3)

		const bracket = wrapper.find('.me-bracket')
		expect(bracket.find('.me-bracket__open').text()).toBe('⟨')
		expect(bracket.find('.me-bracket__close').text()).toBe('⟩')
		expect(bracket.findAll('.me-bracket__content')).toHaveLength(3)
		expect(bracket.findAll('.me-bracket__sep')).toHaveLength(2)
		expect(lastEmitted(wrapper)).toBe('\\left\\langle\\middle|\\middle|\\right\\rangle')
	})
})

describe('带分隔符的方括号解析与往返', () => {
	const CASES: [string, string, number][] = [
		['\\left( a \\middle| b \\right)', 'paren', 2],
		['\\left\\{ a \\middle| b \\right\\}', 'brace', 2],
		['\\left\\langle a \\middle| b \\right\\rangle', 'angle', 2],
		['\\left\\langle a \\middle| b \\middle| c \\right\\rangle', 'angle', 3]
	]

	it.each(CASES)('%s 解析为 %s 的 %i 段结构并原样序列化', async (latex, formatId, groups) => {
		wrapper = mountEditor(latex)

		const bracket = wrapper.find('.me-bracket')
		expect(bracket.exists()).toBe(true)
		expect((bracket.element as HTMLElement).dataset.bracket).toBe(formatId)
		expect(bracket.findAll('.me-bracket__content')).toHaveLength(groups)
		expect(bracket.findAll('.me-bracket__sep')).toHaveLength(groups - 1)
		expect(bracket.find('.me-bracket__content').text().trim()).toBe('a')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe(latex)
	})

	it('分隔符两侧的段各自独立，可分别输入内容', async () => {
		wrapper = mountEditor('\\left(a\\middle|\\right)')
		const contents = wrapper.findAll('.me-bracket__content')
		const second = contents[1]!.find('.me-text-slot').element as HTMLElement
		placeCaret(second, 0)
		second.textContent = 'b'
		await resyncFromDom(wrapper)

		expect(lastEmitted(wrapper)).toBe('\\left(a\\middle|b\\right)')
	})

	it('某一段为空时仍保留分隔符占位，往返不丢结构', async () => {
		wrapper = mountEditor('\\left\\langle\\middle|\\middle|\\right\\rangle')

		const bracket = wrapper.find('.me-bracket')
		expect(bracket.findAll('.me-bracket__content')).toHaveLength(3)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\left\\langle\\middle|\\middle|\\right\\rangle')
	})
})

describe('带分隔符的方括号光标与删除', () => {
	it('第一段末尾按 → 跳到第二段，第二段开头按 ← 回到第一段', () => {
		wrapper = mountEditor('\\left(a\\middle|b\\right)')
		const contents = wrapper.findAll('.me-bracket__content')
		const first = contents[0]!.find('.me-text-slot').element as HTMLElement
		placeCaret(first, 1)

		pressKey('ArrowRight')
		expect(selectionIn('.me-bracket__content')).toBe(true)
		expect(currentSlot()?.closest('.me-bracket__content')).toBe(contents[1]!.element)

		pressKey('ArrowLeft')
		expect(currentSlot()?.closest('.me-bracket__content')).toBe(contents[0]!.element)
	})

	it('第二段开头退格只回到第一段，不删除整个括号', () => {
		wrapper = mountEditor('\\left(a\\middle|b\\right)')
		const second = wrapper.findAll('.me-bracket__content')[1]!.find('.me-text-slot')
			.element as HTMLElement
		placeCaret(second, 0)

		pressKey('Backspace')

		expect(wrapper.findAll('.me-bracket')).toHaveLength(1)
		expect(selectionIn('.me-bracket__content')).toBe(true)
	})

	it('第一段开头退格整块删除括号', () => {
		wrapper = mountEditor('\\left(a\\middle|b\\right)')
		const first = wrapper.findAll('.me-bracket__content')[0]!.find('.me-text-slot')
			.element as HTMLElement
		placeCaret(first, 0)

		pressKey('Backspace')

		expect(wrapper.findAll('.me-bracket')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})
})

// ============ 单方括号 ============

/** 弹层里的单方括号板块从第 17 张卡开始（12 普通 + 4 带分隔符） */
const pickSingleCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
	await cards[16 + index]!.trigger('click')
}

describe('单方括号弹层', () => {
	it('第三板块有 18 张单侧模板卡，左右成对排列', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)

		const dialog = wrapper.find('[role="dialog"]')
		expect(dialog.findAll('.he-tool-popover__section').map((el) => el.text())).toEqual([
			'带分隔符的方括号',
			'单方括号',
			'事例和堆栈',
			'常用方括号'
		])
		expect(dialog.findAll('.he-tool-card')).toHaveLength(41)
		expect(
			dialog
				.findAll('.he-tool-card')
				.slice(16, 34)
				.map((card) => card.attributes('title'))
		).toEqual([
			'单侧圆括号（左）',
			'单侧圆括号（右）',
			'单侧方括号（左）',
			'单侧方括号（右）',
			'单侧花括号（左）',
			'单侧花括号（右）',
			'单侧尖括号（左）',
			'单侧尖括号（右）',
			'单侧向下取整（左）',
			'单侧向下取整（右）',
			'单侧向上取整（左）',
			'单侧向上取整（右）',
			'单侧绝对值（左）',
			'单侧绝对值（右）',
			'单侧范数（左）',
			'单侧范数（右）',
			'单侧双方括号（左）',
			'单侧双方括号（右）'
		])
	})
})

describe('插入单方括号', () => {
	it('左圆括号只显示左侧字符，右侧空定界符不占位，序列化为 \\left( \\right.', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickSingleCard(wrapper, 0)

		const bracket = wrapper.find('.me-bracket')
		expect(bracket.find('.me-bracket__open').text()).toBe('(')
		expect(bracket.find('.me-bracket__open').classes()).not.toContain('me-bracket__delim--empty')
		expect(bracket.find('.me-bracket__close').classes()).toContain('me-bracket__delim--empty')
		expect(bracket.find('.me-bracket__close').text()).toBe('')
		expect(selectionIn('.me-bracket__content')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\left(\\right.')
	})

	it('右方括号只显示右侧字符，序列化为 \\left. \\right]', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickSingleCard(wrapper, 3)

		const bracket = wrapper.find('.me-bracket')
		expect(bracket.find('.me-bracket__open').classes()).toContain('me-bracket__delim--empty')
		expect(bracket.find('.me-bracket__close').text()).toBe(']')
		expect(lastEmitted(wrapper)).toBe('\\left.\\right]')
	})
})

describe('单方括号解析与往返', () => {
	const CASES: [string, string, string][] = [
		['\\left( x \\right.', 'singleParenOpen', '('],
		['\\left. x \\right)', 'singleParenClose', ')'],
		['\\left[ x \\right.', 'singleBracketOpen', '['],
		['\\left. x \\right]', 'singleBracketClose', ']'],
		['\\left\\{ x \\right.', 'singleBraceOpen', '{'],
		['\\left. x \\right\\}', 'singleBraceClose', '}'],
		['\\left\\langle x \\right.', 'singleAngleOpen', '⟨'],
		['\\left. x \\right\\rangle', 'singleAngleClose', '⟩'],
		['\\left\\lfloor x \\right.', 'singleFloorOpen', '⌊'],
		['\\left. x \\right\\rfloor', 'singleFloorClose', '⌋'],
		['\\left\\lceil x \\right.', 'singleCeilOpen', '⌈'],
		['\\left. x \\right\\rceil', 'singleCeilClose', '⌉'],
		['\\left| x \\right.', 'singleBarOpen', '|'],
		['\\left. x \\right|', 'singleBarClose', '|'],
		['\\left\\| x \\right.', 'singleDbarOpen', '‖'],
		['\\left. x \\right\\|', 'singleDbarClose', '‖'],
		['\\left\\lbrack\\lbrack x \\right.', 'singleDoubleOpen', '⟦'],
		['\\left. x \\right\\rbrack\\rbrack', 'singleDoubleClose', '⟧']
	]

	it.each(CASES)('%s 解析为 %s 并原样序列化', async (latex, formatId, glyph) => {
		wrapper = mountEditor(latex)

		const bracket = wrapper.find('.me-bracket')
		expect(bracket.exists()).toBe(true)
		expect((bracket.element as HTMLElement).dataset.bracket).toBe(formatId)
		expect(bracket.findAll('.me-bracket__delim').map((el) => el.text()).filter(Boolean)).toEqual([glyph])
		expect(bracket.find('.me-bracket__content').text().trim()).toBe('x')

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe(latex)
	})

	it('单侧括号与双侧括号可以互相嵌套', async () => {
		wrapper = mountEditor('\\left(\\left[x\\right.\\right)')

		expect(wrapper.findAll('.me-bracket')).toHaveLength(2)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\left(\\left[x\\right.\\right)')
	})

	it('单侧括号也能整块删除', () => {
		wrapper = mountEditor('\\left( x \\right.')
		const slot = wrapper.find('.me-bracket__content .me-text-slot').element as HTMLElement
		placeCaret(slot, 0)

		pressKey('Backspace')

		expect(wrapper.findAll('.me-bracket')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})
})

// ============ 事例和堆栈 ============

/** 堆栈板块从第 35 张卡开始（12 普通 + 4 带分隔符 + 18 单侧） */
const pickStackCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
	await cards[34 + index]!.trigger('click')
}

/** 常用方括号板块从第 39 张卡开始 */
const pickCommonCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
	await cards[38 + index]!.trigger('click')
}

describe('事例和堆栈弹层', () => {
	it('第四板块有 4 张堆栈模板卡，第五板块有 3 张常用方括号卡', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)

		const cards = wrapper.find('[role="dialog"]').findAll('.he-tool-card')
		expect(cards).toHaveLength(41)
		expect(cards.slice(34, 38).map((card) => card.attributes('title'))).toEqual([
			'花括号两行事例',
			'花括号三行事例',
			'两行堆栈',
			'圆括号两行堆栈'
		])
		expect(cards.slice(38).map((card) => card.attributes('title'))).toEqual([
			'分段函数',
			'圆括号组合数',
			'尖括号组合数'
		])
	})
})

describe('插入事例和堆栈', () => {
	it('两行事例插入左侧花括号与两个可编辑行，光标落在第一行', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickStackCard(wrapper, 0)

		const stack = wrapper.find('.me-stack')
		expect(stack.classes()).toContain('me-stack--cases')
		expect(stack.find('.me-stack__brace').text()).toBe('{')
		expect(stack.findAll('.me-stack__row')).toHaveLength(2)
		expect(selectionIn('.me-stack__row')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\begin{cases}\\\\\\end{cases}')
	})

	it('无定界符两行堆栈插入两行且没有左侧花括号', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickStackCard(wrapper, 2)

		const stack = wrapper.find('.me-stack')
		expect(stack.classes()).not.toContain('me-stack--cases')
		expect(stack.findAll('.me-stack__row')).toHaveLength(2)
		expect(lastEmitted(wrapper)).toBe('\\begin{matrix}\\\\\\end{matrix}')
	})

	it('圆括号堆栈在外层再套一对圆括号，光标仍在堆栈行内', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickStackCard(wrapper, 3)

		const bracket = wrapper.find('.me-bracket')
		expect(bracket.find('.me-bracket__open').text()).toBe('(')
		expect(bracket.find('.me-bracket__close').text()).toBe(')')
		expect(bracket.find('.me-stack').exists()).toBe(true)
		expect(selectionIn('.me-stack__row')).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\left(\\begin{matrix}\\\\\\end{matrix}\\right)')
	})
})

describe('事例和堆栈解析与往返', () => {
	const CASES: [string, string, number][] = [
		['\\begin{cases}a\\\\b\\end{cases}', 'cases', 2],
		['\\begin{cases}a\\\\b\\\\c\\end{cases}', 'cases', 3],
		['\\begin{matrix}x\\\\y\\end{matrix}', 'matrix', 2],
		['\\left(\\begin{matrix}n\\\\k\\end{matrix}\\right)', 'matrix', 2]
	]

	it.each(CASES)('%s 解析为 %s 的 %i 行结构并原样序列化', async (latex, style, rows) => {
		wrapper = mountEditor(latex)

		const stack = wrapper.find('.me-stack')
		expect(stack.exists()).toBe(true)
		expect((stack.element as HTMLElement).dataset.stack).toBe(style)
		expect(stack.findAll('.me-stack__row')).toHaveLength(rows)

		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe(latex)
	})

	it('行内的上下标结构不会切开行', async () => {
		wrapper = mountEditor('\\begin{cases}a^{2}\\\\b\\end{cases}')
		expect(wrapper.findAll('.me-stack__row')).toHaveLength(2)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\begin{cases}a^{2}\\\\b\\end{cases}')
	})

	it('各行内容独立可编辑', async () => {
		wrapper = mountEditor('\\begin{cases}a\\\\b\\end{cases}')
		const rows = wrapper.findAll('.me-stack__row')
		const second = rows[1]!.find('.me-text-slot').element as HTMLElement
		second.textContent = 'c'
		await resyncFromDom(wrapper)

		expect(lastEmitted(wrapper)).toBe('\\begin{cases}a\\\\c\\end{cases}')
	})
})

describe('事例和堆栈光标与删除', () => {
	it('↑ / ↓ 在行间移动', () => {
		wrapper = mountEditor('\\begin{cases}a\\\\b\\end{cases}')
		const rows = wrapper.findAll('.me-stack__row')
		const first = rows[0]!.find('.me-text-slot').element as HTMLElement
		placeCaret(first, 0)

		pressKey('ArrowDown')
		expect(currentSlot()?.closest('.me-stack__row')).toBe(rows[1]!.element)

		pressKey('ArrowUp')
		expect(currentSlot()?.closest('.me-stack__row')).toBe(rows[0]!.element)
	})

	it('第二行开头退格回到第一行，第一行开头退格整块删除堆栈', () => {
		wrapper = mountEditor('\\begin{cases}a\\\\b\\end{cases}')
		const rows = wrapper.findAll('.me-stack__row')
		const second = rows[1]!.find('.me-text-slot').element as HTMLElement
		placeCaret(second, 0)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-stack')).toHaveLength(1)
		expect(currentSlot()?.closest('.me-stack__row')).toBe(rows[0]!.element)

		const first = rows[0]!.find('.me-text-slot').element as HTMLElement
		placeCaret(first, 0)
		pressKey('Backspace')
		expect(wrapper.findAll('.me-stack')).toHaveLength(0)
	})
})

describe('常用方括号', () => {
	it('分段函数卡片插入花括号堆栈与前置文本', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickCommonCard(wrapper, 0)

		const stack = wrapper.find('.me-stack')
		expect(stack.classes()).toContain('me-stack--cases')
		expect(stack.findAll('.me-stack__row')).toHaveLength(2)
		expect(lastEmitted(wrapper)).toBe('f(x)=\\begin{cases}-x, x<0\\\\x, x≥0\\end{cases}')
	})

	it('圆括号组合数与尖括号组合数都插入带定界符的两行堆栈', async () => {
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickCommonCard(wrapper, 1)

		const bracket = wrapper.find('.me-bracket')
		expect(bracket.find('.me-bracket__open').text()).toBe('(')
		expect(bracket.findAll('.me-stack__row')).toHaveLength(2)

		wrapper.unmount()
		wrapper = mountEditor()
		await openBracket(wrapper)
		await pickCommonCard(wrapper, 2)

		const angle = wrapper.find('.me-bracket')
		expect(angle.find('.me-bracket__open').text()).toBe('⟨')
		expect(angle.find('.me-bracket__close').text()).toBe('⟩')
		expect(angle.findAll('.me-stack__row')).toHaveLength(2)
	})
})
