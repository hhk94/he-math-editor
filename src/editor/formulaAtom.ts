import { syntaxTree } from '@codemirror/language'
import { RangeSetBuilder } from '@codemirror/state'
import type { EditorState, Extension } from '@codemirror/state'
import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view'
import type { DecorationSet, ViewUpdate } from '@codemirror/view'
import mathJaxService from '@/utils/mathjax'

/** 公式在文档中的定位信息，点击公式标签时回传 */
export interface FormulaRef {
	from: number
	to: number
	latex: string
	display: boolean
}

export type FormulaEditHandler = (formula: FormulaRef) => void

interface FormulaMatch {
	from: number
	to: number
	latex: string
	display: boolean
}

/** 判断 pos 处的字符是否被反斜杠转义（前面有奇数个 \） */
const isEscaped = (text: string, pos: number): boolean => {
	let slashes = 0
	for (let i = pos - 1; i >= 0 && text[i] === '\\'; i--) slashes++
	return slashes % 2 === 1
}

/**
 * 扫描全文，找出 $...$ / $$...$$ 公式。
 * 规则与 MathJax 对齐：开 $ 后、闭 $ 前不能是空白；行内公式不跨行；\$ 不参与配对。
 */
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
		const display = text[i + 1] === '$'
		const openLen = display ? 2 : 1
		const contentStart = i + openLen
		if (contentStart >= len || /\s/.test(text[contentStart])) {
			i = contentStart
			continue
		}
		let j = contentStart
		let closeStart = -1
		while (j < len) {
			const ch = text[j]
			if (ch === '\\') {
				j += 2
				continue
			}
			if (ch === '$') {
				if (display) {
					if (text[j + 1] === '$') {
						closeStart = j
						break
					}
					j++
					continue
				}
				if (text[j + 1] === '$') {
					// $$ 不是行内公式的闭合符
					j += 2
					continue
				}
				closeStart = j
				break
			}
			if (!display && ch === '\n') break
			j++
		}
		if (closeStart === -1) {
			i = contentStart
			continue
		}
		const latex = text.slice(contentStart, closeStart)
		if (!latex.trim() || /\s$/.test(latex)) {
			i = contentStart
			continue
		}
		matches.push({ from: i, to: closeStart + openLen, latex, display })
		i = closeStart + openLen
	}
	return matches
}

/** 收集 Markdown 代码区（围栏/缩进代码块、行内代码）范围，公式扫描需跳过 */
const collectCodeRanges = (state: EditorState): { from: number; to: number }[] => {
	const ranges: { from: number; to: number }[] = []
	syntaxTree(state).iterate({
		enter: (node) => {
			const name = node.type.name
			if (name === 'FencedCode' || name === 'IndentedCode' || name === 'InlineCode') {
				ranges.push({ from: node.from, to: node.to })
				return false
			}
			return true
		}
	})
	return ranges
}

class FormulaWidget extends WidgetType {
	constructor(
		readonly latex: string,
		readonly display: boolean,
		readonly from: number,
		readonly to: number,
		readonly onEdit: FormulaEditHandler
	) {
		super()
	}

	eq(other: FormulaWidget): boolean {
		return other.latex === this.latex && other.display === this.display && other.from === this.from
	}

	toDOM(): HTMLElement {
		const el = document.createElement(this.display ? 'div' : 'span')
		el.className = this.display ? 'he-formula-atom he-formula-atom--display' : 'he-formula-atom'
		el.title = '点击编辑公式'
		el.textContent = this.display ? `\\[${this.latex}\\]` : `\\(${this.latex}\\)`
		el.addEventListener('mousedown', (event: Event) => {
			event.preventDefault()
			event.stopPropagation()
			this.onEdit({ from: this.from, to: this.to, latex: this.latex, display: this.display })
		})
		// MathJax 排版；加载未完成时自动入队，失败则退化为源码文本
		queueMicrotask(() => {
			void mathJaxService.renderElement(el)
		})
		return el
	}
}

/**
 * 公式原子化扩展：
 * 将 $...$ / $$...$$ 替换为整体标签（MathJax 渲染），光标不可进入公式内部、
 * 不可局部删除（退格按整体处理），点击标签通过 onEdit 回调打开公式编辑器。
 */
export const formulaAtom = (onEdit: FormulaEditHandler): Extension => {
	const buildDecorations = (view: EditorView): DecorationSet => {
		const { state } = view
		const text = state.doc.toString()
		const codeRanges = collectCodeRanges(state)
		const builder = new RangeSetBuilder<Decoration>()
		for (const match of scanFormulas(text)) {
			if (codeRanges.some((r) => match.from < r.to && match.to > r.from)) continue
			const multiline = state.doc.lineAt(match.from).number !== state.doc.lineAt(match.to).number
			const widget = new FormulaWidget(match.latex, match.display, match.from, match.to, onEdit)
			if (multiline) {
				// 跨行替换装饰必须是覆盖整行的块级装饰
				const fromLine = state.doc.lineAt(match.from)
				const toLine = state.doc.lineAt(match.to)
				builder.add(fromLine.from, toLine.to, Decoration.replace({ widget, block: true }))
			} else {
				builder.add(match.from, match.to, Decoration.replace({ widget }))
			}
		}
		return builder.finish()
	}

	const plugin = ViewPlugin.fromClass(
		class {
			decorations: DecorationSet

			constructor(readonly view: EditorView) {
				this.decorations = buildDecorations(view)
			}

			update(update: ViewUpdate) {
				if (
					update.docChanged ||
					update.viewportChanged ||
					syntaxTree(update.state) !== syntaxTree(update.startState)
				) {
					this.decorations = buildDecorations(this.view)
				}
			}
		},
		{ decorations: (value) => value.decorations }
	)

	// 原子范围：光标跳过公式标签，删除操作把公式视为一个整体
	const atomic = EditorView.atomicRanges.of((view) => view.plugin(plugin)?.decorations ?? Decoration.none)

	return [plugin, atomic]
}