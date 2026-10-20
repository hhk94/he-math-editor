/**
 * 公式解析：编辑器扫描、markdown-it 渲染共用同一套规则。
 * 规则与 MathJax 对齐：开 $ 后、闭 $ 前不能是空白；行内公式不跨行；\$ 不参与配对。
 */

/** 公式匹配结果，from/to 为包含分隔符的文档偏移 */
export interface FormulaMatch {
	from: number
	to: number
	latex: string
	display: boolean
}

/**
 * 尝试解析 start 处的公式，解析失败返回 null。
 * end 用于限定扫描范围（markdown-it 的 posMax），默认到文本末尾。
 */
export const matchFormulaAt = (text: string, start: number, end = text.length): FormulaMatch | null => {
	if (start >= end || text[start] !== '$') return null

	const display = text[start + 1] === '$'
	const openLen = display ? 2 : 1
	const contentStart = start + openLen
	if (contentStart >= end) return null
	// 行内公式开 $ 后不能是空白；行间公式允许换行与首尾空白
	if (!display && /\s/.test(text[contentStart])) return null

	let pos = contentStart
	let closeStart = -1
	while (pos < end) {
		const ch = text[pos]
		if (ch === '\\') {
			// 反斜杠转义：跳过下一个字符，避免 \$ 被当作闭合符
			pos += 2
			continue
		}
		if (ch === '$') {
			if (display) {
				if (text[pos + 1] === '$') {
					closeStart = pos
					break
				}
				pos++
				continue
			}
			if (text[pos + 1] === '$') {
				// $$ 不是行内公式的闭合符
				pos += 2
				continue
			}
			closeStart = pos
			break
		}
		if (!display && ch === '\n') break
		pos++
	}
	if (closeStart === -1) return null

	const rawLatex = text.slice(contentStart, closeStart)
	if (!rawLatex.trim()) return null
	// 行内公式闭 $ 前不能是空白；行间公式允许换行与首尾空白
	if (!display && /\s$/.test(rawLatex)) return null
	const latex = display ? rawLatex.trim() : rawLatex

	return { from: start, to: closeStart + openLen, latex, display }
}

/** 扫描全文，找出所有 $...$ / $$...$$ 公式 */
export const scanFormulas = (text: string): FormulaMatch[] => {
	const matches: FormulaMatch[] = []
	const len = text.length
	let i = 0
	while (i < len) {
		if (text[i] === '\\') {
			i += 2
			continue
		}
		if (text[i] !== '$') {
			i++
			continue
		}
		const match = matchFormulaAt(text, i, len)
		if (match) {
			matches.push(match)
			i = match.to
			continue
		}
		// 解析失败时跳过开分隔符，继续向后扫描
		i += text[i + 1] === '$' ? 2 : 1
	}
	return matches
}
