export default {
	common: {
		switchToEnglish: '切换到英文',
		switchToChinese: '切换到中文'
	},
	nav: {
		ariaLabel: '展示页导航',
		editor: 'HeMdEditor',
		input: '公式输入',
		viewer: 'HeMdViewer',
		wysiwyg: 'HeMdWysiwyg'
	},
	pageTitles: {
		editor: 'HeMdEditor · 分栏编辑',
		input: '公式输入 · 键盘数字与符号',
		viewer: 'HeMdViewer · 只读展示',
		wysiwyg: 'HeMdWysiwyg · 单栏所见即所得'
	},
	editorPage: {
		title: 'HeMdEditor · 分栏编辑',
		subtitle: '左侧编写 Markdown，右侧实时渲染排版与公式；公式以整体标签嵌入正文。',
		editorTitle: 'Markdown 编辑器 HeMdEditor',
		editorDesc: '工具栏覆盖常用 Markdown 语法；公式以整体标签嵌入正文，点击标签打开公式编辑器，正文中无法修改公式局部。',
		dialogTitle: '公式编辑弹窗 HeFormulaDialog',
		dialogDesc: '点击按钮打开弹窗，编辑完成后确认，结果 LaTeX 会回传到页面。',
		openDialog: '打开公式编辑器',
		currentLatex: '当前 LaTeX：',
		notSet: '（未设置）',
		renderResult: 'MathJax 渲染结果',
		inlineTitle: '内嵌输入 HeMathInput + 实时预览 HeMathPreview',
		inlineDesc: '两个组件都支持直接复用：输入框通过 v-model 绑定 LaTeX，预览组件用 MathJax 排版。',
		formulaArea: '公式编辑区',
		livePreview: '实时预览',
		commonSymbols: '常用符号'
	},
	inputPage: {
		title: '公式输入 · 键盘数字与符号',
		subtitle: '自研输入实验：HeFormulaEditor 直接放在页面里，与公式弹窗共用同一个 UI 组件。',
		cardDesc: '使用 KaTeX 数学字体渲染键盘输入：数字与运算符使用 KaTeX_Main，变量字母使用 KaTeX_Math 斜体；*、-、/ 会自动转换为 ×、−、÷。'
	},
	viewerPage: {
		title: 'HeMdViewer · 只读展示',
		subtitle: '渲染后端返回的 Markdown 源码，不包含编辑器、工具栏与公式输入。',
		cardTitle: '只读渲染',
		cardDesc: '仅依赖 markdown-it 与 MathJax，不会加载 CodeMirror 与 MathLive。',
		emptyTitle: '空状态',
		emptyDesc: '内容为空时可通过 emptyText 提供占位文案。',
		emptyText: '暂无内容'
	},
	wysiwygPage: {
		title: 'HeMdWysiwyg · 单栏所见即所得',
		subtitle: '在编辑区直接渲染标题、列表、加粗等样式，光标所在行显示 Markdown 标记。',
		cardTitle: '单栏编辑模式',
		badge: '开发中',
		desc: '该模式将复用 HeMdEditor 的 CodeMirror 内核与公式原子化能力，通过装饰器隐藏 Markdown 标记并渲染块级样式，当前尚未实现。',
		plannedTitle: '计划能力',
		plannedStyles: '标题、加粗、斜体、删除线、行内代码的即时样式',
		plannedBlocks: '有序 / 无序列表、引用、代码块的行级排版',
		plannedFormula: '公式标签与 HeFormulaDialog 弹窗复用同一套内核',
		plannedMarkers: '光标进入所在行时恢复 Markdown 标记，便于精确编辑'
	}
}