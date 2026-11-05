/**
 * 结构化编辑区的 DOM 工具与类名契约：槽位文本读取、括号段 / 堆栈行查询、
 * 大型运算符无障碍文案 key。渲染、序列化与交互逻辑共用这一份实现。
 */
/** 大型运算符无障碍名称：按符号取对应文案前缀（∑ 求和 / ∏ 乘积 / ∐ 副积 / ⋃ 并集 / ⋂ 交集 / ⋁ 或运算 / ⋀ 与运算） */
const bigOpAriaPrefix: Record<string, string> = {
	'∑': 'bigop',
	'∏': 'prod',
	'∐': 'coprod',
	'⋃': 'union',
	'⋂': 'intersection',
	'⋁': 'bigvee',
	'⋀': 'bigwedge'
}
export const bigOpAriaKey = (sign: string, part: 'Sub' | 'Sup' | 'Operand') =>
	`formula.aria.${bigOpAriaPrefix[sign] ?? 'bigop'}${part}`

/** 槽位所属运算符的符号，用于切换语言时按类型刷新无障碍名称 */
export const bigOpSignOf = (slot: Element): string =>
	(slot.closest('.me-bigop') as HTMLElement | null)?.dataset.sign ?? '∑'

export const getBracketContents = (bracket: HTMLElement): HTMLElement[] =>
	Array.from(bracket.querySelectorAll(':scope > .me-bracket__content')) as HTMLElement[]

export const getStackRows = (stack: HTMLElement): HTMLElement[] =>
	Array.from(stack.querySelectorAll(':scope > .me-stack__rows > .me-stack__row')) as HTMLElement[]

/** 过滤空槽占位用的零宽空格 */
export const stripPlaceholder = (value: string): string => value.replace(/\u200b/g, '')

/** 读取槽位文本，过滤空槽占位用的零宽空格 */
export const readSlotText = (slot: HTMLElement): string => stripPlaceholder(slot.textContent ?? '')
