import type {
	ArrowKind,
	BracketFormatId,
	DerivFormatId,
	FunctionFormatId,
	StackStyle
} from '../toolbar/catalog'
import { bracketFormatByDelims } from '../toolbar/catalog'
import {
	bigOpCommands,
	derivCommands,
	fractionCommands,
	functionCommands,
	integralCommands
} from './commands'
import type { ParsedNode } from './types'

const readGroup = (source: string, start: number): { content: string; end: number } | null => {
	if (source[start] !== '{') return null
	let depth = 0
	for (let i = start; i < source.length; i++) {
		if (source[i] === '\\') {
			i++
			continue
		}
		if (source[i] === '{') depth++
		else if (source[i] === '}') {
			depth--
			if (depth === 0) return { content: source.slice(start + 1, i), end: i + 1 }
		}
	}
	return null
}

/** 跳过空白与负向细空格 \!，用于兼容斜式的不同写法 */
const skipSpacing = (source: string, start: number): number => {
	let cursor = start
	for (;;) {
		while (/\s/.test(source[cursor] ?? '')) cursor++
		if (source.startsWith('\\!', cursor)) {
			cursor += 2
			continue
		}
		return cursor
	}
}

/**
 * 解析斜式分式 `{}^{a}\!/\!_{b}`（也兼容 `{}^{a}/_{b}`）。
 * 结构：空组 + 上标分子 + 斜杠 + 下标分母。
 */
const readSkewedFraction = (
	source: string,
	start: number
): { numerator: string; denominator: string; end: number } | null => {
	if (!source.startsWith('{}^{', start)) return null
	const numerator = readGroup(source, start + 3)
	if (!numerator) return null
	let cursor = skipSpacing(source, numerator.end)
	if (source[cursor] !== '/') return null
	cursor = skipSpacing(source, cursor + 1)
	if (source[cursor] !== '_') return null
	cursor = skipSpacing(source, cursor + 1)
	const denominator = readGroup(source, cursor)
	if (!denominator) return null
	return { numerator: numerator.content, denominator: denominator.content, end: denominator.end }
}

/** 读取上下标参数：{...}、\command 或单个字符 */
const readScriptArgument = (source: string, start: number): { content: string; end: number } | null => {
	let cursor = start
	while (/\s/.test(source[cursor] ?? '')) cursor++
	if (source[cursor] === '{') return readGroup(source, cursor)
	if (source[cursor] === '\\') {
		const match = source.slice(cursor).match(/^\\[a-zA-Z]+/)
		if (match) return { content: match[0], end: cursor + match[0].length }
	}
	if (cursor < source.length) return { content: source[cursor], end: cursor + 1 }
	return null
}

/** 连续读取 ^{...} / _{...}，支持上下标同时存在 */
const readScriptParts = (
	source: string,
	start: number
): { sup: string | null; sub: string | null; end: number } | null => {
	let cursor = start
	let sup: string | null = null
	let sub: string | null = null
	let matched = false
	while (cursor < source.length && (source[cursor] === '^' || source[cursor] === '_')) {
		const marker = source[cursor]
		const argument = readScriptArgument(source, cursor + 1)
		if (!argument) break
		if (marker === '^') sup = argument.content
		else sub = argument.content
		cursor = argument.end
		matched = true
	}
	return matched ? { sup, sub, end: cursor } : null
}

/** 前置上下标：{}^{...} / {}_{...}，不消费后面的基底 */
const readPrescript = (
	source: string,
	start: number
): { sup: string | null; sub: string | null; end: number } | null => {
	if (source[start] !== '{' || source[start + 1] !== '}') return null
	const cursor = skipSpacing(source, start + 2)
	if (source[cursor] !== '^' && source[cursor] !== '_') return null
	return readScriptParts(source, cursor)
}

/**
 * 解析根式：`\sqrt{x}` / `\sqrt[n]{x}`（也兼容 `\sqrt x`、`\sqrt[n]x`）。
 * index 为 null 表示没有根指数，radicand 为被开方数。
 */
const readRoot = (
	source: string,
	start: number
): { index: string | null; radicand: string; end: number } | null => {
	if (!source.startsWith('\\sqrt', start)) return null
	let cursor = start + 5
	let index: string | null = null
	const bracketStart = skipSpacing(source, cursor)
	if (source[bracketStart] === '[') {
		const close = source.indexOf(']', bracketStart + 1)
		if (close === -1) return null
		index = source.slice(bracketStart + 1, close).trim()
		cursor = close + 1
	}
	const argument = readScriptArgument(source, cursor)
	if (!argument) return null
	return { index, radicand: argument.content, end: argument.end }
}

/**
 * 解析积分：`\int` / `\iint` / `\iiint`（兼容 `\limits`），
 * 限界用 `_{a}^{b}` 读取，被积函数取一个参数；结尾没有内容时被积函数为空。
 */
const readIntegral = (
	source: string,
	start: number
): { sign: string; sub: string | null; sup: string | null; integrand: string; end: number } | null => {
	const matched = integralCommands.find(({ command }) => source.startsWith(command, start))
	if (!matched) return null
	let cursor = start + matched.command.length
	if (source.startsWith('\\limits', cursor)) cursor += 7
	const parts = readScriptParts(source, cursor)
	let sub: string | null = null
	let sup: string | null = null
	if (parts) {
		sub = parts.sub
		sup = parts.sup
		cursor = parts.end
	}
	const argument = readScriptArgument(source, cursor)
	if (!argument) return { sign: matched.sign, sub, sup, integrand: '', end: cursor }
	return { sign: matched.sign, sub, sup, integrand: argument.content, end: argument.end }
}

/**
 * 解析大型运算符：`\sum`（兼容 `\limits` 与 `\nolimits`）。
 * \nolimits 表示行内式（限界排右上/右下，优先判断，避免被 \limits 分支误吃）；
 * 限界用 `_{a}^{b}` 读取，表达式取一个参数，结尾没有内容时为空。
 */
const readBigOp = (
	source: string,
	start: number
): {
	sign: string
	inline: boolean
	sub: string | null
	sup: string | null
	operand: string
	end: number
} | null => {
	const matched = bigOpCommands.find(({ command }) => source.startsWith(command, start))
	if (!matched) return null
	let cursor = start + matched.command.length
	let inline = false
	if (source.startsWith('\\nolimits', cursor)) {
		inline = true
		cursor += 9
	} else if (source.startsWith('\\limits', cursor)) {
		cursor += 7
	}
	const parts = readScriptParts(source, cursor)
	let sub: string | null = null
	let sup: string | null = null
	if (parts) {
		sub = parts.sub
		sup = parts.sup
		cursor = parts.end
	}
	const argument = readScriptArgument(source, cursor)
	if (!argument) return { sign: matched.sign, inline, sub, sup, operand: '', end: cursor }
	return { sign: matched.sign, inline, sub, sup, operand: argument.content, end: argument.end }
}

/** 判断 position 处是否为独立命令（避免把 \leftarrow 误判为 \left） */
const isCommandAt = (source: string, position: number, command: string): boolean => {
	if (!source.startsWith(command, position)) return false
	const next = source[position + command.length] ?? ''
	return !/[a-zA-Z]/.test(next)
}

/**
 * 解析函数：`\sin` / `\cos` / `\tan` / `\csc` / `\sec` / `\cot`，
 * 反函数 `\sin^{-1}` 等、双曲函数 `\sinh` / `\cosh` / `\tanh` / `\csch` / `\sech` / `\coth`
 * 与反双曲函数 `\sinh^{-1}` 等（均先于普通命令匹配）；极限和对数 `\lim` / `\min` / `\max` / `\log` / `\ln`
 * 支持可选的 `_{...}` 下标（log 底数 / 极限条件）。
 * 参数取一个参数（{...}、单字符或命令）；没有参数时交给主循环按文本处理。
 */
const readFunction = (
	source: string,
	start: number
): { name: FunctionFormatId; sub: string | null; argument: string; end: number } | null => {
	const matched = functionCommands.find(({ command }) => isCommandAt(source, start, command))
	if (!matched) return null
	let cursor = start + matched.command.length
	let sub: string | null = null
	if (source[cursor] === '_') {
		const subArgument = readScriptArgument(source, cursor + 1)
		if (!subArgument) return null
		sub = subArgument.content
		cursor = subArgument.end
	}
	const argument = readScriptArgument(source, cursor)
	if (!argument) return null
	return { name: matched.name, sub, argument: argument.content, end: argument.end }
}

/**
 * 解析导数符号：`\dot{x}` / `\hat{x}` / `\overbrace{x}` 等，也兼容 `\dot x` 单字符参数。
 * `\overbrace{x}^{标签}` / `\underbrace{x}_{标签}` 会把紧跟的标记收进标签槽。
 * 没有参数时交给主循环按文本处理；`isCommandAt` 词边界保证 \dots 等更长命令不被误判。
 */
const readDeriv = (
	source: string,
	start: number
): { id: DerivFormatId; argument: string; label: string | null; end: number } | null => {
	const matched = derivCommands.find(({ command }) => isCommandAt(source, start, command))
	if (!matched) return null
	const argument = readScriptArgument(source, start + matched.command.length)
	if (!argument) return null
	let end = argument.end
	let label: string | null = null
	const marker = matched.id === 'overbrace' ? '^' : matched.id === 'underbrace' ? '_' : ''
	if (marker && source[end] === marker) {
		const labelArgument = readScriptArgument(source, end + 1)
		if (labelArgument) {
			label = labelArgument.content
			end = labelArgument.end
		}
	}
	return { id: matched.id, argument: argument.content, label, end }
}

/** 剥掉整体的 `\mathrm{...}` 外壳：\stackrel 记号序列化时用它保证预览直立渲染，编辑区只显示内部文本 */
const stripMathrm = (content: string): string => {
	let cursor = 0
	while (/\s/.test(content[cursor] ?? '')) cursor++
	if (!content.startsWith('\\mathrm', cursor)) return content
	const inner = readGroup(content, skipSpacing(content, cursor + '\\mathrm'.length))
	if (!inner || skipSpacing(content, inner.end) !== content.length) return content
	return inner.content
}

/**
 * 解析上置叠等号：`\stackrel{记号}{=}`（第二个参数必须是等号，其他底座按文本保留）与 `\triangleq`。
 * `isCommandAt` 词边界保证 \stackrello 之类的前缀不被误判。
 */
const readOp = (
	source: string,
	start: number
): { variant: 'stackrel' | 'triangleq'; top: string; end: number } | null => {
	if (isCommandAt(source, start, '\\triangleq')) {
		return { variant: 'triangleq', top: '△', end: start + '\\triangleq'.length }
	}
	if (!isCommandAt(source, start, '\\stackrel')) return null
	let cursor = skipSpacing(source, start + '\\stackrel'.length)
	const top = readGroup(source, cursor)
	if (!top) return null
	cursor = skipSpacing(source, top.end)
	const base = readGroup(source, cursor)
	if (!base || base.content !== '=') return null
	return { variant: 'stackrel', top: stripMathrm(top.content), end: base.end }
}

/** 读取 `[...]` 可选参数组（支持方括号嵌套），供 \xleftarrow[下方] 使用 */
const readBracketGroup = (
	source: string,
	start: number
): { content: string; end: number } | null => {
	if (source[start] !== '[') return null
	let depth = 0
	for (let i = start; i < source.length; i++) {
		if (source[i] === '[') depth++
		else if (source[i] === ']') {
			depth--
			if (depth === 0) return { content: source.slice(start + 1, i), end: i + 1 }
		}
	}
	return null
}

const ARROW_BASE_KINDS = new Map<string, ArrowKind>([
	['\\Leftarrow', 'doubleLeft'],
	['\\Rightarrow', 'doubleRight'],
	['\\leftrightarrow', 'leftRight'],
	['\\Leftrightarrow', 'leftRightDouble']
])

/**
 * 解析带标注箭头：`\xleftarrow[下方]{上方}` / `\xrightarrow{上方}`（amsmath，本地 MathJax 原生支持），
 * 以及 `\overset / \underset` 包裹双线箭头、左右箭头底座的组合形式（\xLeftarrow 等可拉伸宏不在
 * 本地 MathJax 构建内，extpfeil 只登记了 autoload 依赖、离线不可用）。内核不是已知底座时按原文保留。
 */
const readArrow = (
	source: string,
	start: number
): { kind: ArrowKind; above: string | null; below: string | null; end: number } | null => {
	for (const [command, kind] of [
		['\\xleftarrow', 'left'],
		['\\xrightarrow', 'right']
	] as const) {
		if (!isCommandAt(source, start, command)) continue
		let cursor = skipSpacing(source, start + command.length)
		let belowText: string | null = null
		if (source[cursor] === '[') {
			const optional = readBracketGroup(source, cursor)
			if (!optional) return null
			belowText = optional.content
			cursor = skipSpacing(source, optional.end)
		}
		const aboveGroup = readGroup(source, cursor)
		if (!aboveGroup) return null
		return { kind, above: aboveGroup.content, below: belowText, end: aboveGroup.end }
	}
	let wrapper: 'above' | 'below'
	let commandLength: number
	if (isCommandAt(source, start, '\\overset')) {
		wrapper = 'above'
		commandLength = '\\overset'.length
	} else if (isCommandAt(source, start, '\\underset')) {
		wrapper = 'below'
		commandLength = '\\underset'.length
	} else {
		return null
	}
	let cursor = skipSpacing(source, start + commandLength)
	const first = readGroup(source, cursor)
	if (!first) return null
	cursor = skipSpacing(source, first.end)
	const second = readGroup(source, cursor)
	if (!second) return null
	let aboveText: string | null = null
	let belowText: string | null = null
	if (wrapper === 'above') aboveText = first.content
	else belowText = first.content
	let baseContent = second.content
	let kind = ARROW_BASE_KINDS.get(baseContent) ?? null
	if (!kind) {
		// 双槽形态：\overset{上}{\underset{下}{底座}} 或 \underset{下}{\overset{上}{底座}}
		let innerWrapper: 'above' | 'below'
		let innerLength: number
		if (isCommandAt(baseContent, 0, '\\underset')) {
			innerWrapper = 'below'
			innerLength = '\\underset'.length
		} else if (isCommandAt(baseContent, 0, '\\overset')) {
			innerWrapper = 'above'
			innerLength = '\\overset'.length
		} else {
			return null
		}
		let innerCursor = skipSpacing(baseContent, innerLength)
		const innerFirst = readGroup(baseContent, innerCursor)
		if (!innerFirst) return null
		innerCursor = skipSpacing(baseContent, innerFirst.end)
		const innerSecond = readGroup(baseContent, innerCursor)
		if (!innerSecond) return null
		kind = ARROW_BASE_KINDS.get(innerSecond.content) ?? null
		if (!kind || skipSpacing(baseContent, innerSecond.end) !== baseContent.length) return null
		if (innerWrapper === 'above') aboveText = innerFirst.content
		else belowText = innerFirst.content
	}
	if (aboveText === null && belowText === null) return null
	return { kind, above: aboveText, below: belowText, end: second.end }
}

/** 读取定界符 token：`\` 开头读命令名，否则读单个字符；\lbrack 连写两次视为双方括号 */
const readDelimiterToken = (source: string, start: number): { token: string; end: number } | null => {
	if (start >= source.length) return null
	if (source[start] === '\\') {
		const matched = /^\\[a-zA-Z]+/.exec(source.slice(start))
		if (!matched) {
			// 单字符转义（如 \{ \} \|）
			return { token: source.slice(start, start + 2), end: start + 2 }
		}
		let token = matched[0]
		let end = start + token.length
		if (token === '\\lbrack' && source.startsWith('\\lbrack', end)) {
			token += '\\lbrack'
			end += 7
		} else if (token === '\\rbrack' && source.startsWith('\\rbrack', end)) {
			token += '\\rbrack'
			end += 7
		}
		return { token, end }
	}
	return { token: source[start], end: start + 1 }
}

/**
 * 解析 `\begin{cases}` 竖向堆栈环境：按顶层的 `\\` 切分成多行。
 * 嵌套环境或花括号里的 `\\` 不作为行分隔；缺少 `\end` 时返回 null 交给主循环按文本处理。
 */
const readStack = (
	source: string,
	start: number
): { style: StackStyle; rows: string[]; end: number } | null => {
	if (!source.startsWith('\\begin{cases}', start)) return null
	const style: StackStyle = 'cases'
	const endTag = '\\end{cases}'
	const bodyStart = start + '\\begin{cases}'.length
	let envDepth = 0
	let braceDepth = 0
	let bodyEnd = -1
	const breaks: { start: number; end: number }[] = []
	let scan = bodyStart
	while (scan < source.length) {
		if (source[scan] === '\\') {
			if (isCommandAt(source, scan, '\\begin')) {
				envDepth++
				scan += 6
				continue
			}
			if (isCommandAt(source, scan, '\\end')) {
				if (envDepth === 0) {
					if (!source.startsWith(endTag, scan)) return null
					bodyEnd = scan
					break
				}
				envDepth--
				scan += 4
				continue
			}
			if (envDepth === 0 && braceDepth === 0 && source[scan + 1] === '\\') {
				breaks.push({ start: scan, end: scan + 2 })
				scan += 2
				continue
			}
			scan += 2
			continue
		}
		if (source[scan] === '{') braceDepth++
		else if (source[scan] === '}') braceDepth--
		scan++
	}
	if (bodyEnd === -1) return null

	const rows: string[] = []
	let rowStart = bodyStart
	for (const item of breaks) {
		rows.push(source.slice(rowStart, item.start))
		rowStart = item.end
	}
	rows.push(source.slice(rowStart, bodyEnd))
	return { style, rows, end: bodyEnd + endTag.length }
}

/**
 * 解析 `\begin{matrix}` 矩阵环境：顶层的 `\\` 切行、`&` 切列。
 * 嵌套环境或花括号里的分隔符不参与切分；缺少 `\end` 时返回 null 交给主循环按文本处理。
 */
const readMatrix = (source: string, start: number): { rows: string[][]; end: number } | null => {
	if (!source.startsWith('\\begin{matrix}', start)) return null
	const endTag = '\\end{matrix}'
	const bodyStart = start + '\\begin{matrix}'.length
	let envDepth = 0
	let braceDepth = 0
	let bodyEnd = -1
	const markers: { type: 'row' | 'cell'; start: number; end: number }[] = []
	let scan = bodyStart
	while (scan < source.length) {
		if (source[scan] === '\\') {
			if (isCommandAt(source, scan, '\\begin')) {
				envDepth++
				scan += 6
				continue
			}
			if (isCommandAt(source, scan, '\\end')) {
				if (envDepth === 0) {
					if (!source.startsWith(endTag, scan)) return null
					bodyEnd = scan
					break
				}
				envDepth--
				scan += 4
				continue
			}
			if (envDepth === 0 && braceDepth === 0 && source[scan + 1] === '\\') {
				markers.push({ type: 'row', start: scan, end: scan + 2 })
				scan += 2
				continue
			}
			scan += 2
			continue
		}
		if (source[scan] === '{') braceDepth++
		else if (source[scan] === '}') braceDepth--
		else if (source[scan] === '&' && envDepth === 0 && braceDepth === 0) {
			markers.push({ type: 'cell', start: scan, end: scan + 1 })
		}
		scan++
	}
	if (bodyEnd === -1) return null

	const rows: string[][] = []
	let cursor = bodyStart
	let cells: string[] = []
	for (const marker of markers) {
		cells.push(source.slice(cursor, marker.start))
		cursor = marker.end
		if (marker.type === 'row') {
			rows.push(cells)
			cells = []
		}
	}
	cells.push(source.slice(cursor, bodyEnd))
	rows.push(cells)
	return { rows, end: bodyEnd + endTag.length }
}

/**
 * 解析 `\left ... \right` 括号：先按深度找到配对的 `\right`，再用 (left, right)
 * 精确匹配 12 种模板；匹配失败返回 null，交给主循环按普通文本处理。
 * 内容里的 `\middle|` 会把内容切成多段（带分隔符的括号），单段时按普通括号处理。
 */
const readBracket = (
	source: string,
	start: number
): { format: BracketFormatId; groups: string[]; end: number } | null => {
	if (!isCommandAt(source, start, '\\left')) return null
	let cursor = start + 5
	while (/\s/.test(source[cursor] ?? '')) cursor++
	const leftToken = readDelimiterToken(source, cursor)
	if (!leftToken) return null
	cursor = leftToken.end

	// 深度扫描：嵌套的 \left 需要跳过，避免把内层 \right 错当配对
	let depth = 1
	let scan = cursor
	let contentEnd = -1
	const pieces: { start: number; end: number }[] = []
	while (scan < source.length) {
		if (isCommandAt(source, scan, '\\left')) {
			depth++
			scan += 5
			continue
		}
		if (isCommandAt(source, scan, '\\right')) {
			depth--
			if (depth === 0) {
				contentEnd = scan
				break
			}
			scan += 6
			continue
		}
		if (depth === 1 && isCommandAt(source, scan, '\\middle')) {
			let next = scan + 7
			while (/\s/.test(source[next] ?? '')) next++
			const sepToken = readDelimiterToken(source, next)
			if (!sepToken) return null
			pieces.push({ start: scan, end: sepToken.end })
			scan = sepToken.end
			continue
		}
		scan++
	}
	if (contentEnd === -1) return null

	let rightCursor = contentEnd + 6
	while (/\s/.test(source[rightCursor] ?? '')) rightCursor++
	const rightToken = readDelimiterToken(source, rightCursor)
	if (!rightToken) return null
	const format = bracketFormatByDelims.get(`${leftToken.token}\u0000${rightToken.token}`)
	if (!format) return null
	const groups: string[] = []
	let groupStart = cursor
	for (const piece of pieces) {
		groups.push(source.slice(groupStart, piece.start))
		groupStart = piece.end
	}
	groups.push(source.slice(groupStart, contentEnd))
	return {
		format,
		groups,
		end: rightToken.end
	}
}

/** 递归解析 \frac / \tfrac / 斜式 / 上下标 / 根式：子结构里的内容会继续结构化 */
export const parseLatex = (source: string): ParsedNode[] => {
	const nodes: ParsedNode[] = []
	let buffer = ''
	let i = 0
	const flush = () => {
		if (buffer) {
			nodes.push({ type: 'text', value: buffer })
			buffer = ''
		}
	}
	while (i < source.length) {
		const skewed = readSkewedFraction(source, i)
		if (skewed) {
			flush()
			nodes.push({
				type: 'fraction',
				style: 'skewed',
				numerator: parseLatex(skewed.numerator),
				denominator: parseLatex(skewed.denominator)
			})
			i = skewed.end
			continue
		}
		const prescript = readPrescript(source, i)
		if (prescript) {
			flush()
			nodes.push({
				type: 'script',
				pre: true,
				sup: prescript.sup !== null ? parseLatex(prescript.sup) : null,
				sub: prescript.sub !== null ? parseLatex(prescript.sub) : null
			})
			i = prescript.end
			continue
		}
		if (source[i] === '^' || source[i] === '_') {
			const postscript = readScriptParts(source, i)
			if (postscript) {
				flush()
				nodes.push({
					type: 'script',
					pre: false,
					sup: postscript.sup !== null ? parseLatex(postscript.sup) : null,
					sub: postscript.sub !== null ? parseLatex(postscript.sub) : null
				})
				i = postscript.end
				continue
			}
		}
		const rootNode = readRoot(source, i)
		if (rootNode) {
			flush()
			nodes.push({
				type: 'root',
				index: rootNode.index !== null ? parseLatex(rootNode.index) : null,
				radicand: parseLatex(rootNode.radicand)
			})
			i = rootNode.end
			continue
		}
		const integralNode = readIntegral(source, i)
		if (integralNode) {
			flush()
			nodes.push({
				type: 'integral',
				sign: integralNode.sign,
				sub: integralNode.sub !== null ? parseLatex(integralNode.sub) : null,
				sup: integralNode.sup !== null ? parseLatex(integralNode.sup) : null,
				integrand: parseLatex(integralNode.integrand)
			})
			i = integralNode.end
			continue
		}
		const bigOpNode = readBigOp(source, i)
		if (bigOpNode) {
			flush()
			nodes.push({
				type: 'bigop',
				sign: bigOpNode.sign,
				inline: bigOpNode.inline,
				sub: bigOpNode.sub !== null ? parseLatex(bigOpNode.sub) : null,
				sup: bigOpNode.sup !== null ? parseLatex(bigOpNode.sup) : null,
				operand: parseLatex(bigOpNode.operand)
			})
			i = bigOpNode.end
			continue
		}
		const functionNode = readFunction(source, i)
		if (functionNode) {
			flush()
			nodes.push({
				type: 'func',
				name: functionNode.name,
				sub: functionNode.sub !== null ? parseLatex(functionNode.sub) : null,
				argument: parseLatex(functionNode.argument)
			})
			i = functionNode.end
			continue
		}
		const derivNode = readDeriv(source, i)
		if (derivNode) {
			flush()
			nodes.push({
				type: 'deriv',
				id: derivNode.id,
				argument: parseLatex(derivNode.argument),
				label: derivNode.label !== null ? parseLatex(derivNode.label) : null
			})
			i = derivNode.end
			continue
		}
		const opNode = readOp(source, i)
		if (opNode) {
			flush()
			nodes.push({ type: 'relop', variant: opNode.variant, top: parseLatex(opNode.top) })
			i = opNode.end
			continue
		}
		const arrowNode = readArrow(source, i)
		if (arrowNode) {
			flush()
			nodes.push({
				type: 'arrow',
				kind: arrowNode.kind,
				above: arrowNode.above !== null ? parseLatex(arrowNode.above) : null,
				below: arrowNode.below !== null ? parseLatex(arrowNode.below) : null
			})
			i = arrowNode.end
			continue
		}
		const bracketNode = readBracket(source, i)
		if (bracketNode) {
			flush()
			nodes.push({
				type: 'bracket',
				format: bracketNode.format,
				groups: bracketNode.groups.map((group) => parseLatex(group))
			})
			i = bracketNode.end
			continue
		}
		const stackNode = readStack(source, i)
		if (stackNode) {
			flush()
			nodes.push({
				type: 'stack',
				style: stackNode.style,
				rows: stackNode.rows.map((row) => parseLatex(row))
			})
			i = stackNode.end
			continue
		}
		const matrixNode = readMatrix(source, i)
		if (matrixNode) {
			flush()
			nodes.push({
				type: 'matrix',
				rows: matrixNode.rows.map((row) => row.map((cell) => parseLatex(cell)))
			})
			i = matrixNode.end
			continue
		}
		const matched = fractionCommands.find(({ command }) => source.startsWith(command, i))
		if (matched) {
			let cursor = i + matched.command.length
			while (/\s/.test(source[cursor] ?? '')) cursor++
			const numerator = readGroup(source, cursor)
			if (numerator) {
				cursor = numerator.end
				while (/\s/.test(source[cursor] ?? '')) cursor++
				const denominator = readGroup(source, cursor)
				if (denominator) {
					flush()
					nodes.push({
						type: 'fraction',
						style: matched.style,
						numerator: parseLatex(numerator.content),
						denominator: parseLatex(denominator.content)
					})
					i = denominator.end
					continue
				}
			}
		}
		buffer += source[i]
		i++
	}
	flush()
	return nodes
}
