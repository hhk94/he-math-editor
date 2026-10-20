import { syntaxTree } from '@codemirror/language'
import { RangeSetBuilder, StateField } from '@codemirror/state'
import type { EditorState, Extension } from '@codemirror/state'
import { Decoration, EditorView, WidgetType } from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'
import mathJaxService from '@/utils/mathjax'
import { scanFormulas } from '@/core/formula'
import type { FormulaMatch } from '@/core/formula'

export { scanFormulas }

/** 公式在文档中的定位信息，点击公式标签时回传 */
export type FormulaRef = FormulaMatch

export type FormulaEditHandler = (formula: FormulaRef) => void

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
	const buildDecorations = (state: EditorState): DecorationSet => {
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

	// 块级装饰只能由 StateField 提供，不能通过 ViewPlugin
	const decorations = StateField.define<DecorationSet>({
		create: (state) => buildDecorations(state),
		update: (value, tr) => (tr.docChanged ? buildDecorations(tr.state) : value),
		provide: (field) => EditorView.decorations.from(field)
	})

	// 原子范围：光标跳过公式标签，删除操作把公式视为一个整体
	const atomic = EditorView.atomicRanges.of((view) => view.state.field(decorations))

	return [decorations, atomic]
}