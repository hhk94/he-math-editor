export default {
	common: {
		switchToEnglish: 'Switch to English',
		switchToChinese: '切换到中文'
	},
	nav: {
		ariaLabel: 'Demo pages',
		editor: 'HeMdEditor',
		input: 'Formula Input',
		viewer: 'HeMdViewer',
		wysiwyg: 'HeMdWysiwyg'
	},
	pageTitles: {
		editor: 'HeMdEditor · Split Editor',
		input: 'Formula Input · Keyboard Digits and Symbols',
		viewer: 'HeMdViewer · Read-only Rendering',
		wysiwyg: 'HeMdWysiwyg · Single-column WYSIWYG'
	},
	editorPage: {
		title: 'HeMdEditor · Split Editor',
		subtitle: 'Write Markdown on the left and render typography and formulas on the right; formulas are embedded as atomic tags.',
		editorTitle: 'Markdown Editor HeMdEditor',
		editorDesc: 'The toolbar covers common Markdown syntax. Formulas are embedded as atomic tags; click a tag to open the formula editor. Formulas cannot be edited partially in the document.',
		dialogTitle: 'Formula Dialog HeFormulaDialog',
		dialogDesc: 'Click the button to open the dialog. After confirming, the LaTeX result is passed back to the page.',
		openDialog: 'Open formula editor',
		currentLatex: 'Current LaTeX:',
		notSet: '(not set)',
		renderResult: 'MathJax output',
		inlineTitle: 'Inline Input HeMathInput + Live Preview HeMathPreview',
		inlineDesc: 'Both components can be reused directly: the input binds LaTeX via v-model, and the preview typesets with MathJax.',
		formulaArea: 'Formula editor',
		livePreview: 'Live preview',
		commonSymbols: 'Common symbols'
	},
	inputPage: {
		title: 'Formula Input · Keyboard Digits and Symbols',
		subtitle: 'Custom input experiment: HeFormulaEditor is placed directly on the page and shares the same UI component with the formula dialog.',
		cardDesc: 'Keyboard input is rendered with KaTeX math fonts: digits and operators use KaTeX_Main, variables use KaTeX_Math italic; *, -, and / are converted to ×, −, ÷.'
	},
	viewerPage: {
		title: 'HeMdViewer · Read-only Rendering',
		subtitle: 'Renders Markdown returned by the backend, without the editor, toolbar, or formula input.',
		cardTitle: 'Read-only rendering',
		cardDesc: 'Depends only on markdown-it and MathJax; CodeMirror and MathLive are not loaded.',
		emptyTitle: 'Empty state',
		emptyDesc: 'Use emptyText to provide placeholder text when the content is empty.',
		emptyText: 'No content'
	},
	wysiwygPage: {
		title: 'HeMdWysiwyg · Single-column WYSIWYG',
		subtitle: 'Render headings, lists, and bold styles directly in the editor, showing Markdown markers on the focused line.',
		cardTitle: 'Single-column editing mode',
		badge: 'In development',
		desc: 'This mode will reuse the CodeMirror core and formula atomization of HeMdEditor to hide Markdown markers and render block styles with decorations. It is not implemented yet.',
		plannedTitle: 'Planned capabilities',
		plannedStyles: 'Instant styling for headings, bold, italic, strikethrough, and inline code',
		plannedBlocks: 'Line-level layout for ordered/unordered lists, quotes, and code blocks',
		plannedFormula: 'Formula tags and HeFormulaDialog share the same core',
		plannedMarkers: 'Markdown markers reappear on the focused line for precise editing'
	}
}