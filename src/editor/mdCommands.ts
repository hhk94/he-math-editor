import { EditorSelection } from '@codemirror/state'
import type { ChangeSpec, Line } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

/** 选区覆盖的首末行 */
const selectedLines = (view: EditorView) => {
	const { from, to } = view.state.selection.main
	return { fromLine: view.state.doc.lineAt(from), toLine: view.state.doc.lineAt(to) }
}

/** 标题：H1~H6，重复点击同一级别则取消 */
export const toggleHeading = (view: EditorView, level: number) => {
	const { fromLine, toLine } = selectedLines(view)
	const target = `${'#'.repeat(level)} `
	const changes: ChangeSpec[] = []
	for (let n = fromLine.number; n <= toLine.number; n++) {
		const line = view.state.doc.line(n)
		const match = line.text.match(/^(#{1,6})\s+/)
		if (match && match[1].length === level) {
			changes.push({ from: line.from, to: line.from + match[0].length })
		} else if (match) {
			changes.push({ from: line.from, to: line.from + match[0].length, insert: target })
		} else {
			changes.push({ from: line.from, insert: target })
		}
	}
	view.dispatch({ changes })
}

/** 行前缀切换：引用 / 无序列表 / 有序列表 / 任务列表。全部行已带前缀时取消，否则补齐 */
const toggleLinePrefix = (view: EditorView, pattern: RegExp, prefix: string | ((index: number) => string)) => {
	const { fromLine, toLine } = selectedLines(view)
	const lines: Line[] = []
	for (let n = fromLine.number; n <= toLine.number; n++) {
		const line = view.state.doc.line(n)
		if (line.text.trim()) lines.push(line)
	}
	if (!lines.length) return
	const allMarked = lines.every((line) => pattern.test(line.text))
	const changes: ChangeSpec[] = []
	let index = 0
	for (const line of lines) {
		const match = line.text.match(pattern)
		if (allMarked && match) {
			changes.push({ from: line.from, to: line.from + match[0].length })
		} else if (!allMarked && !match) {
			changes.push({ from: line.from, insert: typeof prefix === 'function' ? prefix(index) : prefix })
		}
		index++
	}
	view.dispatch({ changes })
}

export const toggleQuote = (view: EditorView) => toggleLinePrefix(view, /^>\s?/, '> ')
export const toggleBulletList = (view: EditorView) => toggleLinePrefix(view, /^[-*+]\s+/, '- ')
export const toggleTaskList = (view: EditorView) => toggleLinePrefix(view, /^[-*+]\s+\[[ xX]\]\s+/, '- [ ] ')
export const toggleOrderedList = (view: EditorView) => toggleLinePrefix(view, /^\d+\.\s+/, (i) => `${i + 1}. `)

/** 内联包裹切换：**加粗**、*斜体*、~~删除线~~、`行内代码`。已有包裹时取消 */
export const toggleWrap = (view: EditorView, mark: string, placeholder = '') => {
	const { from, to, empty } = view.state.selection.main
	const doc = view.state.doc
	const before = doc.sliceString(Math.max(0, from - mark.length), from)
	const after = doc.sliceString(to, Math.min(doc.length, to + mark.length))
	if (before === mark && after === mark) {
		view.dispatch({
			changes: [
				{ from: from - mark.length, to: from },
				{ from: to, to: to + mark.length }
			],
			selection: EditorSelection.range(from - mark.length, to - mark.length)
		})
		return
	}
	const text = empty ? placeholder : doc.sliceString(from, to)
	view.dispatch({
		changes: { from, to, insert: mark + text + mark },
		selection: EditorSelection.range(from + mark.length, from + mark.length + text.length)
	})
}

/** 在光标处插入块级内容，当前行非空时自动补空行 */
export const insertBlock = (view: EditorView, text: string) => {
	const { from, to } = view.state.selection.main
	const line = view.state.doc.lineAt(from)
	const needBlank = from !== line.from || line.text.trim().length > 0
	const insert = (needBlank ? '\n\n' : '') + text
	view.dispatch({
		changes: { from, to, insert },
		selection: EditorSelection.cursor(from + insert.length)
	})
}

/** 代码块：``` 围栏切换 */
export const toggleCodeBlock = (view: EditorView) => {
	const doc = view.state.doc
	const { from, to } = view.state.selection.main
	const fromLine = doc.lineAt(from)
	const toLine = doc.lineAt(to)
	const prev = fromLine.number > 1 ? doc.line(fromLine.number - 1).text.trim() : ''
	const next = toLine.number < doc.lines ? doc.line(toLine.number + 1).text.trim() : ''
	if (prev.startsWith('```') && next.startsWith('```')) {
		const prevLine = doc.line(fromLine.number - 1)
		const nextLine = doc.line(toLine.number + 1)
		view.dispatch({
			changes: [
				{ from: prevLine.from, to: Math.min(prevLine.to + 1, doc.length) },
				{ from: nextLine.from, to: Math.min(nextLine.to + 1, doc.length) }
			]
		})
		return
	}
	const text = doc.sliceString(fromLine.from, toLine.to)
	view.dispatch({
		changes: { from: fromLine.from, to: toLine.to, insert: `\`\`\`\n${text}\n\`\`\`` }
	})
}

/** 链接：选中文本作为链接文字，插入后选中 URL 占位 */
export const insertLink = (view: EditorView) => {
	const { from, to, empty } = view.state.selection.main
	const text = empty ? '链接文字' : view.state.doc.sliceString(from, to)
	const url = 'https://'
	view.dispatch({
		changes: { from, to, insert: `[${text}](${url})` },
		selection: EditorSelection.range(from + text.length + 3, from + text.length + 3 + url.length)
	})
}

/** 图片：插入后选中 alt 占位 */
export const insertImage = (view: EditorView) => {
	const { from, to } = view.state.selection.main
	const alt = '图片描述'
	const url = 'https://'
	view.dispatch({
		changes: { from, to, insert: `![${alt}](${url})` },
		selection: EditorSelection.range(from + 2, from + 2 + alt.length)
	})
}

/** 3 列示例表格 */
export const insertTable = (view: EditorView) =>
	insertBlock(view, '| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n|  |  |  |')

/** 分割线 */
export const insertHr = (view: EditorView) => insertBlock(view, '---')
