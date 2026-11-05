import {
	ARROW_BASE,
	bracketFormatById,
	bracketFormats,
	derivFormatById
} from '../toolbar/catalog'
import type {
	ArrowKind,
	BracketFormatId,
	DerivFormatId,
	FunctionFormatId,
	StackStyle
} from '../toolbar/catalog'
import { bigOpSignToCommand, functionCommandById, integralSignToCommand } from './commands'
import { getBracketContents, getStackRows, readSlotText } from './dom'

/** DOM → LaTeX：与 `parseLatex` / `renderInto` 互逆，空参数花括号始终保留 */
export const serializeNodes = (container: HTMLElement): string => {
	let result = ''
	let hasContent = false
	for (const child of Array.from(container.children) as HTMLElement[]) {
		if (child.classList.contains('me-script')) {
			const sup = child.querySelector(':scope > .me-script__sup') as HTMLElement | null
			const sub = child.querySelector(':scope > .me-script__sub') as HTMLElement | null
			const parts = `${sub ? `_{${serializeNodes(sub)}}` : ''}${sup ? `^{${serializeNodes(sup)}}` : ''}`
			const isPre = child.classList.contains('me-script--pre')
			// 后置上下标在容器开头时需要空基底，保证 LaTeX 合法
			result += `${isPre || !hasContent ? '{}' : ''}${parts}`
			hasContent = true
		} else if (child.classList.contains('me-frac')) {
			const num = child.querySelector(':scope > .me-frac__num') as HTMLElement | null
			const den = child.querySelector(':scope > .me-frac__den') as HTMLElement | null
			const numerator = num ? serializeNodes(num) : ''
			const denominator = den ? serializeNodes(den) : ''
			if (child.classList.contains('me-frac--skewed')) {
				result += `{}^{${numerator}}\\!/\\!_{${denominator}}`
			} else {
				const command = child.classList.contains('me-frac--small') ? '\\tfrac' : '\\frac'
				result += `${command}{${numerator}}{${denominator}}`
			}
			hasContent = true
		} else if (child.classList.contains('me-root')) {
			const indexEl = child.querySelector(':scope > .me-root__index') as HTMLElement | null
			const radicandEl = child.querySelector(':scope > .me-root__radicand') as HTMLElement | null
			const index = indexEl ? serializeNodes(indexEl) : ''
			const radicand = radicandEl ? serializeNodes(radicandEl) : ''
			result += index ? `\\sqrt[${index}]{${radicand}}` : `\\sqrt{${radicand}}`
			hasContent = true
		} else if (child.classList.contains('me-int')) {
			const sign = child.dataset.sign ?? '∫'
			const subEl = child.querySelector(':scope > .me-int__sub') as HTMLElement | null
			const supEl = child.querySelector(':scope > .me-int__sup') as HTMLElement | null
			const integrandEl = child.querySelector(':scope > .me-int__integrand') as HTMLElement | null
			const command = integralSignToCommand[sign] ?? '\\int'
			// 被积函数始终带花括号：空被积函数若省略花括号，后接文本会被解析吞掉（如 \intdx）
			const sub = subEl !== null ? `_{${serializeNodes(subEl)}}` : ''
			const sup = supEl !== null ? `^{${serializeNodes(supEl)}}` : ''
			result += `${command}${sub}${sup}{${integrandEl ? serializeNodes(integrandEl) : ''}}`
			hasContent = true
		} else if (child.classList.contains('me-bigop')) {
			const sign = child.dataset.sign ?? '∑'
			const subEl = child.querySelector(':scope > .me-bigop__sub') as HTMLElement | null
			const supEl = child.querySelector(':scope > .me-bigop__sup') as HTMLElement | null
			const operandEl = child.querySelector(':scope > .me-bigop__operand') as HTMLElement | null
			const command = bigOpSignToCommand[sign] ?? '\\sum'
			// 行内式补 \nolimits，渲染时限界排右上/右下而不是上下堆叠
			const nolimits = child.classList.contains('me-bigop--inline') ? '\\nolimits' : ''
			// 表达式始终带花括号：空表达式若省略花括号，后接文本会被解析吞掉（如 \sumdx）
			const sub = subEl !== null ? `_{${serializeNodes(subEl)}}` : ''
			const sup = supEl !== null ? `^{${serializeNodes(supEl)}}` : ''
			result += `${command}${nolimits}${sub}${sup}{${operandEl ? serializeNodes(operandEl) : ''}}`
			hasContent = true
		} else if (child.classList.contains('me-bracket')) {
			const formatId = (child.dataset.bracket ?? 'paren') as BracketFormatId
			const format = bracketFormatById.get(formatId) ?? bracketFormats[0]
			const contentEls = getBracketContents(child)
			const inner = contentEls.map((el) => serializeNodes(el)).join('\\middle|')
			// 左定界符是命令（\langle、\lbrack）时，紧跟字母会被并成非法命令名（如 \langlex）
			const sep = /[a-zA-Z]$/.test(format.left) && /^[a-zA-Z]/.test(inner) ? ' ' : ''
			// 右定界符同理：\right\rangle 后紧跟字母会并成 \rangleb
			const nextEl = child.nextElementSibling as HTMLElement | null
			const nextText = nextEl?.classList.contains('me-text-slot') ? readSlotText(nextEl) : ''
			const sepAfter = /[a-zA-Z]$/.test(format.right) && /^[a-zA-Z]/.test(nextText) ? ' ' : ''
			result += `\\left${format.left}${sep}${inner}\\right${format.right}${sepAfter}`
			hasContent = true
		} else if (child.classList.contains('me-stack')) {
			const style = (child.dataset.stack ?? 'matrix') as StackStyle
			const rows = getStackRows(child).map((row) => serializeNodes(row))
			result += `\\begin{${style}}${rows.join('\\\\')}\\end{${style}}`
			hasContent = true
		} else if (child.classList.contains('me-func')) {
			const name = (child.dataset.func ?? 'sin') as FunctionFormatId
			const subEl = child.querySelector(':scope > .me-func__sub') as HTMLElement | null
			const argEl = child.querySelector(':scope > .me-func__arg') as HTMLElement | null
			const command = functionCommandById.get(name) ?? `\\${name}`
			// 下标与参数始终带花括号：省略时后接文本会被解析吞掉（如 \sinx、\log_a x）
			const sub = subEl ? `_{${serializeNodes(subEl)}}` : ''
			result += `${command}${sub}{${argEl ? serializeNodes(argEl) : ''}}`
			hasContent = true
		} else if (child.classList.contains('me-deriv')) {
			const id = (child.dataset.deriv ?? 'dot') as DerivFormatId
			const format = derivFormatById.get(id)
			const argEl = child.querySelector(':scope > .me-deriv__arg') as HTMLElement | null
			const labelEl = child.querySelector(':scope > .me-deriv__label') as HTMLElement | null
			const argument = argEl ? serializeNodes(argEl) : ''
			// 花括号始终保留，保证空参数往返并被正确解析，也不会吞掉后接文本
			const base = `${format?.command ?? '\\dot'}{${argument}}`
			result += labelEl
				? `${base}${format?.placement === 'under' ? '_' : '^'}{${serializeNodes(labelEl)}}`
				: base
			hasContent = true
		} else if (child.classList.contains('me-op')) {
			const variant = (child.dataset.op ?? 'stackrel') as 'stackrel' | 'triangleq'
			const topEl = child.querySelector(':scope > .me-op__top') as HTMLElement | null
			const top = topEl ? serializeNodes(topEl) : ''
			// △ 未被改动时保持 \triangleq 缩写；记号含命令（嵌套结构）时不能包进 \mathrm，原样输出
			if (variant === 'triangleq' && top === '△') {
				result += '\\triangleq'
			} else if (!top) {
				result += '\\stackrel{}{=}'
			} else if (top.includes('\\')) {
				result += `\\stackrel{${top}}{=}`
			} else {
				result += `\\stackrel{\\mathrm{${top}}}{=}`
			}
			hasContent = true
		} else if (child.classList.contains('me-arrow')) {
			const kind = (child.dataset.arrow ?? 'right') as ArrowKind
			const aboveEl = child.querySelector(':scope > .me-arrow__above') as HTMLElement | null
			const belowEl = child.querySelector(':scope > .me-arrow__below') as HTMLElement | null
			const above = aboveEl ? serializeNodes(aboveEl) : ''
			const below = belowEl ? serializeNodes(belowEl) : ''
			// 左右箭头走 amsmath \xleftarrow/\xrightarrow；其余基字形不可伸展，用 \overset/\underset 组合
			if (kind === 'left' || kind === 'right') {
				const command = kind === 'left' ? '\\xleftarrow' : '\\xrightarrow'
				result += `${command}${belowEl ? `[${below}]` : ''}{${above}}`
			} else {
				const base = ARROW_BASE[kind]
				result += aboveEl
					? `\\overset{${above}}{${belowEl ? `\\underset{${below}}{${base}}` : base}}`
					: `\\underset{${below}}{${base}}`
			}
			hasContent = true
		} else if (child.classList.contains('me-text-slot')) {
			const value = readSlotText(child)
			if (value) {
				result += value
				hasContent = true
			}
		}
	}
	return result
}
