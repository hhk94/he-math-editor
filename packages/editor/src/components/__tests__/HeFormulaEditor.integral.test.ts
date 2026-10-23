import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HeFormulaEditor from '../HeFormulaEditor.vue'
import { i18n } from '../../i18n'

/**
 * 积分弹层与结构化积分的单元测试
 * 覆盖：弹层双栏 18 卡（积分 + 围道积分）+ 底部微分栏 3 卡 / 插入槽位与序列化 / LaTeX 解析 / 往返契约 / 键盘导航 / 整块删除
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

/** 打开积分弹层 */
const openIntegral = async (wrapper: VueWrapper<any>) => {
	await wrapper.find('button[title="积分"]').trigger('click')
}

/** 点击积分弹层里的第 n 张格式卡（顺序同 integralFormats：∫/∬/∭ × 无限界/仅上限/上下限） */
const pickCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.findAll('.he-tool-popover .he-tool-card')
	await cards[index]!.trigger('click')
}

/** 点击围道积分栏里的第 n 张格式卡（顺序同 contourFormats：∮/∯/∰ × 无限界/仅上限/上下限） */
const pickContourCard = async (wrapper: VueWrapper<any>, index: number) => {
	const cards = wrapper.findAll('.he-tool-popover__col')[1]!.findAll('.he-tool-card')
	await cards[index]!.trigger('click')
}

/** 点击底部微分栏里的第 n 张卡（顺序同 differentialFormats：dx / dy / dθ） */
const pickDifferentialCard = async (wrapper: VueWrapper<any>, index: number) => {
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

describe('积分弹层', () => {
	it('点击积分按钮打开双栏弹层：左积分 9 卡 + 右围道积分 9 卡', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)

		const popover = wrapper.find('.he-tool-popover')
		expect(popover.exists()).toBe(true)
		expect(popover.attributes('aria-label')).toBe('积分')
		expect(popover.find('.he-tool-popover__header').text()).toBe('积分')

		// 双栏：左积分、右围道积分，各带栏目标题
		const cols = popover.findAll('.he-tool-popover__col')
		expect(cols).toHaveLength(2)
		expect(cols[0]!.find('.he-tool-popover__section').text()).toBe('积分')
		expect(cols[1]!.find('.he-tool-popover__section').text()).toBe('围道积分')

		const cards = popover.findAll('.he-tool-card')
		expect(cards).toHaveLength(21)
		expect(cards[0]!.attributes('title')).toBe('不定积分')
		expect(cards[1]!.attributes('title')).toBe('积分（上限）')
		expect(cards[2]!.attributes('title')).toBe('定积分')
		expect(cards[3]!.attributes('title')).toBe('二重积分')
		expect(cards[5]!.attributes('title')).toBe('二重定积分')
		expect(cards[6]!.attributes('title')).toBe('三重积分')
		expect(cards[8]!.attributes('title')).toBe('三重定积分')
		// 右栏围道积分：∮ / ∯ / ∰ 各三种限界
		expect(cards[9]!.attributes('title')).toBe('围道积分')
		expect(cards[10]!.attributes('title')).toBe('围道积分（上限）')
		expect(cards[11]!.attributes('title')).toBe('围道定积分')
		expect(cards[12]!.attributes('title')).toBe('二重围道积分')
		expect(cards[14]!.attributes('title')).toBe('二重围道定积分')
		expect(cards[15]!.attributes('title')).toBe('三重围道积分')
		expect(cards[17]!.attributes('title')).toBe('三重围道定积分')
		// 底部微分栏：dx / dy / dθ
		expect(cards[18]!.attributes('title')).toBe('微分 dx')
		expect(cards[19]!.attributes('title')).toBe('微分 dy')
		expect(cards[20]!.attributes('title')).toBe('微分 dθ')
	})

	it('格式卡预览按限界类型区分：无限界无限界槽、仅上限只有上限槽、上下限两者都有', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)

		const cards = wrapper.findAll('.he-tool-popover .he-tool-card')
		// 无限界
		expect(cards[0]!.find('.math-int__sub').exists()).toBe(false)
		expect(cards[0]!.find('.math-int__sup').exists()).toBe(false)
		// 仅上限
		expect(cards[1]!.find('.math-int__sub').exists()).toBe(false)
		expect(cards[1]!.find('.math-int__sup').exists()).toBe(true)
		// 上下限
		expect(cards[2]!.find('.math-int__sub').exists()).toBe(true)
		expect(cards[2]!.find('.math-int__sup').exists()).toBe(true)
		// 三种卡都有被积函数槽
		for (const index of [0, 1, 2]) {
			expect(cards[index]!.find('.math-int__integrand').exists()).toBe(true)
		}
	})

	it('再次点击积分按钮切换关闭弹层', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		expect(wrapper.find('.he-tool-popover').exists()).toBe(true)
		await openIntegral(wrapper)
		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
	})

	it('打开其他弹层时积分弹层关闭', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await wrapper.find('button[title="分数"]').trigger('click')
		expect(wrapper.find('.he-tool-popover[aria-label="积分"]').exists()).toBe(false)
	})
})

// ============ 插入 ============

describe('插入积分', () => {
	it('插入不定积分：仅被积函数，序列化 \\int{}，焦点落在被积函数', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 0)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
		const integral = wrapper.find('.me-int')
		expect(integral.exists()).toBe(true)
		expect((integral.element as HTMLElement).dataset.sign).toBe('∫')
		expect(integral.find('.me-int__sub').exists()).toBe(false)
		expect(integral.find('.me-int__sup').exists()).toBe(false)
		expect(lastEmitted(wrapper)).toBe('\\int{}')
		expect(selectionIn('.me-int__integrand')).toBe(true)
	})

	it('插入仅上限积分：序列化 \\int^{}{}，焦点落在上限', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 1)

		const integral = wrapper.find('.me-int')
		expect(integral.find('.me-int__sub').exists()).toBe(false)
		expect(integral.find('.me-int__sup').exists()).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\int^{}{}')
		expect(selectionIn('.me-int__sup')).toBe(true)
	})

	it('插入定积分：上下限槽位齐全，序列化 \\int_{}^{}{}，焦点落在下限', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 2)

		const integral = wrapper.find('.me-int')
		expect(integral.find('.me-int__sub').exists()).toBe(true)
		expect(integral.find('.me-int__sup').exists()).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\int_{}^{}{}')
		expect(selectionIn('.me-int__sub')).toBe(true)
	})

	it('插入二重定积分：dataset.sign 为 ∬，反查 \\iint 命令', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 5)
		expect((wrapper.find('.me-int').element as HTMLElement).dataset.sign).toBe('∬')
		expect(lastEmitted(wrapper)).toBe('\\iint_{}^{}{}')
	})

	it('插入三重积分：dataset.sign 为 ∭，反查 \\iiint 命令', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 6)
		expect((wrapper.find('.me-int').element as HTMLElement).dataset.sign).toBe('∭')
		expect(lastEmitted(wrapper)).toBe('\\iiint{}')
	})

	it('插入三重定积分：序列化 \\iiint_{}^{}{}', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 8)
		expect((wrapper.find('.me-int').element as HTMLElement).dataset.sign).toBe('∭')
		expect(lastEmitted(wrapper)).toBe('\\iiint_{}^{}{}')
	})
})

// ============ 围道积分 ============

describe('围道积分', () => {
	it('围道栏 9 张卡：∮ / ∯ / ∰ 三行 × 三种限界', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)

		const cards = wrapper.findAll('.he-tool-popover__col')[1]!.findAll('.he-tool-card')
		expect(cards).toHaveLength(9)
		// ∮ / ∯ / ∰ 三行
		expect(cards[0]!.find('.math-int__sign').text()).toBe('∮')
		expect(cards[3]!.find('.math-int__sign').text()).toBe('∯')
		expect(cards[6]!.find('.math-int__sign').text()).toBe('∰')
		// 无限界 / 仅上限 / 上下限
		expect(cards[0]!.find('.math-int__sub').exists()).toBe(false)
		expect(cards[0]!.find('.math-int__sup').exists()).toBe(false)
		expect(cards[1]!.find('.math-int__sub').exists()).toBe(false)
		expect(cards[1]!.find('.math-int__sup').exists()).toBe(true)
		expect(cards[2]!.find('.math-int__sub').exists()).toBe(true)
		expect(cards[2]!.find('.math-int__sup').exists()).toBe(true)
		// 每张卡都有被积函数槽
		for (const index of [0, 1, 2]) {
			expect(cards[index]!.find('.math-int__integrand').exists()).toBe(true)
		}
	})

	it('插入围道积分：dataset.sign 为 ∮，序列化 \\oint{}，焦点落在被积函数', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickContourCard(wrapper, 0)

		const integral = wrapper.find('.me-int')
		expect((integral.element as HTMLElement).dataset.sign).toBe('∮')
		expect(lastEmitted(wrapper)).toBe('\\oint{}')
		expect(selectionIn('.me-int__integrand')).toBe(true)
	})

	it('插入围道定积分：序列化 \\oint_{}^{}{}，焦点落在下限', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickContourCard(wrapper, 2)

		const integral = wrapper.find('.me-int')
		expect(integral.find('.me-int__sub').exists()).toBe(true)
		expect(integral.find('.me-int__sup').exists()).toBe(true)
		expect(lastEmitted(wrapper)).toBe('\\oint_{}^{}{}')
		expect(selectionIn('.me-int__sub')).toBe(true)
	})

	it('插入二重/三重围道积分：∯ 反查 \\oiint、∰ 反查 \\oiiint', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickContourCard(wrapper, 5)
		expect((wrapper.find('.me-int').element as HTMLElement).dataset.sign).toBe('∯')
		expect(lastEmitted(wrapper)).toBe('\\oiint_{}^{}{}')

		wrapper.unmount()
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickContourCard(wrapper, 6)
		expect((wrapper.find('.me-int').element as HTMLElement).dataset.sign).toBe('∰')
		expect(lastEmitted(wrapper)).toBe('\\oiiint{}')
	})

	it('解析 \\oint_{C}{f(z)dz}，\\oiint / \\oiiint 最长优先匹配', () => {
		wrapper = mountEditor('\\oint_{C}{f(z)dz}')
		expect(wrapper.findAll('.me-int')).toHaveLength(1)
		expect(wrapper.find('.me-int__sign').text()).toBe('∮')
		expect(wrapper.find('.me-int__sub').text()).toBe('C')
		expect(wrapper.find('.me-int__integrand').text()).toBe('f(z)dz')

		wrapper.unmount()
		wrapper = mountEditor('\\oiint_{S}{E}')
		expect((wrapper.find('.me-int').element as HTMLElement).dataset.sign).toBe('∯')

		wrapper.unmount()
		wrapper = mountEditor('\\oiiint_{V}{1}')
		expect((wrapper.find('.me-int').element as HTMLElement).dataset.sign).toBe('∰')
	})

	it('围道积分序列化往返：\\oint_{C}{f(z)dz} 保持不变', async () => {
		wrapper = mountEditor('\\oint_{C}{f(z)dz}')
		;(wrapper.find('.he-formula-editable').element as HTMLElement).dispatchEvent(
			new Event('input')
		)
		await nextTick()
		expect(lastEmitted(wrapper)).toBe('\\oint_{C}{f(z)dz}')
	})

	it('围道积分复用积分键盘导航与整块删除', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickContourCard(wrapper, 2)
		expect(selectionIn('.me-int__sub')).toBe(true)

		pressKey('ArrowUp')
		expect(selectionIn('.me-int__sup')).toBe(true)
		pressKey('ArrowDown')
		expect(selectionIn('.me-int__sub')).toBe(true)
		pressKey('Backspace')
		expect(wrapper.findAll('.me-int')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})
})

// ============ 微分 ============

describe('微分', () => {
	it('底部微分栏 3 张卡：dx / dy / dθ，纯文本预览', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)

		const cards = wrapper.findAll('.he-tool-popover__grid')[2]!.findAll('.he-tool-card')
		expect(cards).toHaveLength(3)
		expect(cards[0]!.attributes('title')).toBe('微分 dx')
		expect(cards[1]!.attributes('title')).toBe('微分 dy')
		expect(cards[2]!.attributes('title')).toBe('微分 dθ')
		expect(cards[0]!.find('.he-tool-card__preview').text()).toBe('dx')
		expect(cards[2]!.find('.he-tool-card__preview').text()).toBe('dθ')
	})

	it('点击 dx 卡：插入文本 dx 并关闭弹层', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickDifferentialCard(wrapper, 0)

		expect(wrapper.find('.he-tool-popover').exists()).toBe(false)
		expect(lastEmitted(wrapper)).toBe('dx')
	})

	it('点击 dθ 卡：插入 Unicode 文本 dθ', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickDifferentialCard(wrapper, 2)
		expect(lastEmitted(wrapper)).toBe('dθ')
	})

	it('光标在被积函数槽内点 dx：插入 \\int{dx}', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 0)
		expect(selectionIn('.me-int__integrand')).toBe(true)

		await openIntegral(wrapper)
		await pickDifferentialCard(wrapper, 0)
		expect(lastEmitted(wrapper)).toBe('\\int{dx}')
	})
})

// ============ 解析渲染 ============

describe('积分解析渲染', () => {
	it('解析 \\int_{0}^{1}{f(x)}：下限 / 上限 / 被积函数分别渲染', () => {
		wrapper = mountEditor('\\int_{0}^{1}{f(x)}')
		expect(wrapper.findAll('.me-int')).toHaveLength(1)
		expect(wrapper.find('.me-int__sign').text()).toBe('∫')
		expect(wrapper.find('.me-int__sub').text()).toBe('0')
		expect(wrapper.find('.me-int__sup').text()).toBe('1')
		expect(wrapper.find('.me-int__integrand').text()).toBe('f(x)')
	})

	it('解析兼容 \\limits 修饰符', () => {
		wrapper = mountEditor('\\int\\limits_{a}^{b}{x}')
		expect(wrapper.findAll('.me-int')).toHaveLength(1)
		expect(wrapper.find('.me-int__sub').text()).toBe('a')
		expect(wrapper.find('.me-int__sup').text()).toBe('b')
		expect(wrapper.find('.me-int__integrand').text()).toBe('x')
	})

	it('最长优先匹配：\\iint / \\iiint 不被拆成 \\int 加文本', () => {
		wrapper = mountEditor('\\iint_{D}{f}')
		expect(wrapper.findAll('.me-int')).toHaveLength(1)
		expect((wrapper.find('.me-int').element as HTMLElement).dataset.sign).toBe('∬')
		expect(wrapper.find('.me-int__sign').text()).toBe('∬')
		expect(wrapper.find('.me-int__sub').text()).toBe('D')

		wrapper.unmount()
		wrapper = mountEditor('\\iiint_{V}{1}')
		expect(wrapper.findAll('.me-int')).toHaveLength(1)
		expect((wrapper.find('.me-int').element as HTMLElement).dataset.sign).toBe('∭')
		expect(wrapper.find('.me-int__sign').text()).toBe('∭')
	})

	it('解析没有被积函数的积分：补空被积函数槽位', () => {
		wrapper = mountEditor('\\int_{0}^{1}')
		const integrand = wrapper.find('.me-int__integrand')
		expect(integrand.exists()).toBe(true)
		expect(integrand.find('.me-text-slot').exists()).toBe(true)
	})

	it('被积函数支持嵌套分式与上下标', () => {
		wrapper = mountEditor('\\int_{0}^{1}{\\frac{a}{b}x^{2}}')
		const integrand = wrapper.find('.me-int__integrand')
		expect(integrand.find('.me-frac__num').text()).toBe('a')
		expect(integrand.find('.me-frac__den').text()).toBe('b')
		expect(integrand.find('.me-script__sup').text()).toBe('2')
	})

	it('限界与被积函数槽位带 aria-label', () => {
		wrapper = mountEditor('\\int_{0}^{1}{f(x)}')
		expect(wrapper.find('.me-int__sub').attributes('aria-label')).toBe('积分下限')
		expect(wrapper.find('.me-int__sup').attributes('aria-label')).toBe('积分上限')
		expect(wrapper.find('.me-int__integrand').attributes('aria-label')).toBe('被积函数')
	})
})

// ============ 序列化往返 ============

describe('积分序列化往返', () => {
	/** 渲染完成后派发 input 事件，触发可编辑区同步序列化 */
	const resyncFromDom = async (current: VueWrapper<any>) => {
		;(current.find('.he-formula-editable').element as HTMLElement).dispatchEvent(
			new Event('input')
		)
		await nextTick()
	}

	it('渲染后派发 input 事件还原相同 LaTeX', async () => {
		wrapper = mountEditor('\\int_{0}^{1}{f(x)}')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\int_{0}^{1}{f(x)}')
	})

	it('\\limits 在往返时被规整掉', async () => {
		wrapper = mountEditor('\\int\\limits_{a}^{b}{x}')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\int_{a}^{b}{x}')
	})

	it('被积函数花括号始终保留：\\int x 补全为 \\int{x}', async () => {
		wrapper = mountEditor('\\int x')
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\int{x}')
	})

	it('空被积函数后接文本不被吞：\\int{}dx 往返保持不变', async () => {
		wrapper = mountEditor('\\int{}dx')
		expect(wrapper.find('.me-int__integrand').exists()).toBe(true)
		await resyncFromDom(wrapper)
		expect(lastEmitted(wrapper)).toBe('\\int{}dx')
	})
})

// ============ 键盘导航 ============

describe('积分键盘导航', () => {
	it('定积分插入后：下限 ↑ 到上限', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 2)
		expect(selectionIn('.me-int__sub')).toBe(true)

		pressKey('ArrowUp')
		expect(selectionIn('.me-int__sup')).toBe(true)
	})

	it('上限 ↓ 回下限', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 2)
		pressKey('ArrowUp')
		pressKey('ArrowDown')
		expect(selectionIn('.me-int__sub')).toBe(true)
	})

	it('下限 ↓ 进入被积函数', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 2)
		pressKey('ArrowDown')
		expect(selectionIn('.me-int__integrand')).toBe(true)
	})

	it('被积函数 ↑ 回到最近的限界（上限末尾）', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 2)
		pressKey('ArrowDown')
		pressKey('ArrowUp')
		expect(selectionIn('.me-int__sup')).toBe(true)
	})

	it('仅上限积分：上限 ↓ 直接进被积函数', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 1)
		expect(selectionIn('.me-int__sup')).toBe(true)
		pressKey('ArrowDown')
		expect(selectionIn('.me-int__integrand')).toBe(true)
	})

	it('下限开头 ← 跳出积分落到前方文本槽', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 2)
		expect(selectionIn('.me-int__sub')).toBe(true)

		pressKey('ArrowLeft')
		expect(selectionIn('.me-int')).toBe(false)
	})
})

// ============ 整块删除 ============

describe('积分整块删除', () => {
	it('下限开头 Backspace 整块删除积分', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 2)
		expect(wrapper.findAll('.me-int')).toHaveLength(1)
		expect(selectionIn('.me-int__sub')).toBe(true)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-int')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('无限界积分在被积函数开头 Backspace 整块删除', async () => {
		wrapper = mountEditor()
		await openIntegral(wrapper)
		await pickCard(wrapper, 0)
		expect(selectionIn('.me-int__integrand')).toBe(true)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-int')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('被积函数末尾 Delete 整块删除积分', async () => {
		wrapper = mountEditor('\\int_{0}^{1}{f(x)}')
		const slot = wrapper.find('.me-int__integrand .me-text-slot')
		expect(slot.exists()).toBe(true)
		focusSlotEnd(slot.element as HTMLElement)

		pressKey('Delete')
		expect(wrapper.findAll('.me-int')).toHaveLength(0)
		expect(lastEmitted(wrapper)).toBe('')
	})

	it('有上下限时被积函数开头 Backspace 不删除（保留限界入口）', async () => {
		wrapper = mountEditor('\\int_{0}^{1}{f(x)}')
		const slot = wrapper.find('.me-int__integrand .me-text-slot')
		focusSlotEnd(slot.element as HTMLElement)
		// 先回到被积函数开头
		const range = document.createRange()
		range.setStart((slot.element as HTMLElement).firstChild!, 0)
		range.collapse(true)
		const selection = window.getSelection()
		selection?.removeAllRanges()
		selection?.addRange(range)

		pressKey('Backspace')
		expect(wrapper.findAll('.me-int')).toHaveLength(1)
	})
})
