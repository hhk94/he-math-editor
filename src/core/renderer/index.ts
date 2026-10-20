import MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import { matchFormulaAt } from '@/core/formula'
import mathJaxService from '@/utils/mathjax'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('java', java)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('python', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)

/** 围栏代码块高亮；未知语言返回空字符串，交给 markdown-it 转义输出纯文本 */
const highlightCode = (code: string, language: string): string => {
	const lang = language.toLowerCase()
	if (!lang || !hljs.getLanguage(lang)) return ''
	try {
		return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
	} catch {
		return ''
	}
}

/**
 * Markdown 渲染器：markdown-it + 数学规则 + 代码高亮。
 * 公式由 core/formula 统一解析，输出 MathJax 的显式分隔符 \(...\) / \[...\]。
 */
export const markdownRenderer = new MarkdownIt({
	html: false,
	linkify: true,
	breaks: false,
	highlight: highlightCode
})

const mathInlineRule = (state: StateInline, silent: boolean): boolean => {
	const match = matchFormulaAt(state.src, state.pos, state.posMax)
	if (!match) return false
	if (!silent) {
		const token = state.push(match.display ? 'math_display' : 'math_inline', '', 0)
		token.content = match.latex
		token.markup = match.display ? '$$' : '$'
	}
	state.pos = match.to
	return true
}

markdownRenderer.inline.ruler.after('escape', 'math_inline', mathInlineRule)
markdownRenderer.renderer.rules.math_inline = (tokens, idx) =>
	`<span class="he-math">\\(${markdownRenderer.utils.escapeHtml(tokens[idx].content)}\\)</span>`
markdownRenderer.renderer.rules.math_display = (tokens, idx) =>
	`<div class="he-math he-math--display">\\[${markdownRenderer.utils.escapeHtml(tokens[idx].content)}\\]</div>`

/** Markdown 源码转 HTML（不含 MathJax 排版） */
export const renderMarkdownHtml = (markdown: string): string => markdownRenderer.render(markdown)

/** 将 Markdown 渲染进指定元素，并用 MathJax 排版其中的公式 */
export const renderMarkdownInto = async (element: HTMLElement, markdown: string): Promise<void> => {
	element.innerHTML = renderMarkdownHtml(markdown)
	await mathJaxService.renderElement(element)
}
