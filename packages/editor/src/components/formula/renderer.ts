import {
	ARROW_GLYPH,
	bracketFormatById,
	derivFormatById,
	functionFormatById
} from '../toolbar/catalog'
import type {
	ArrowKind,
	BracketFormat,
	DerivFormatId,
	FractionStyle,
	FunctionFormatId,
	StackStyle
} from '../toolbar/catalog'
import { bigOpAriaKey } from './dom'
import { parseLatex } from './parser'
import type { ParsedNode } from './types'

/** 无障碍文案翻译器（组件传入 `t` 即可，语言切换后新节点自动使用当前语言） */
export type Translate = (key: string) => string

/**
 * 创建结构化节点渲染器：所有 `me-*` 节点的 DOM 构建集中在这里。
 * 通过工厂注入翻译器，避免渲染函数依赖组件实例或全局状态。
 */
export const createFormulaRenderer = (t: Translate) => {
	const createTextSlot = (value: string): HTMLElement => {
		const slot = document.createElement('span')
		slot.className = 'me-text-slot'
		// 用 attribute 而不是 contentEditable property：浏览器中两者等价，jsdom 只认 attribute（单元测试依赖 [contenteditable] 选择器）
		slot.setAttribute('contenteditable', 'true')
		slot.spellcheck = false
		slot.dataset.role = 'text'
		slot.setAttribute('role', 'textbox')
		slot.setAttribute('aria-label', t('formula.aria.text'))
		// 空槽放零宽空格：光标按文本基线定位，而不是落在元素边界上
		slot.textContent = value || '\u200b'
		return slot
	}

	const createFractionElement = (
		numerator: ParsedNode[],
		denominator: ParsedNode[],
		style: FractionStyle = 'normal'
	): HTMLElement => {
		const fraction = document.createElement('span')
		fraction.className = style === 'normal' ? 'me-frac' : `me-frac me-frac--${style}`
		const num = document.createElement('span')
		num.className = 'me-frac__num'
		num.setAttribute('aria-label', t('formula.aria.numerator'))
		appendNodes(num, numerator)
		const den = document.createElement('span')
		den.className = 'me-frac__den'
		den.setAttribute('aria-label', t('formula.aria.denominator'))
		appendNodes(den, denominator)
		if (style === 'skewed') {
			const slash = document.createElement('span')
			slash.className = 'me-frac__slash'
			slash.textContent = '/'
			slash.setAttribute('aria-hidden', 'true')
			fraction.append(num, slash, den)
		} else {
			fraction.append(num, den)
		}
		return fraction
	}

	/** 创建上下标节点；pre 为前置上下标，sup / sub 为 null 表示该方向不存在 */
	const createScriptElement = (
		pre: boolean,
		sup: ParsedNode[] | null,
		sub: ParsedNode[] | null
	): HTMLElement => {
		const script = document.createElement('span')
		const classes = ['me-script']
		if (pre) classes.push('me-script--pre')
		if (sup && sub) classes.push('me-script--both')
		else if (sup) classes.push('me-script--sup')
		else classes.push('me-script--sub')
		script.className = classes.join(' ')
		if (sup) {
			const supEl = document.createElement('span')
			supEl.className = 'me-script__sup'
			supEl.setAttribute('aria-label', t('formula.aria.sup'))
			appendNodes(supEl, sup)
			script.append(supEl)
		}
		if (sub) {
			const subEl = document.createElement('span')
			subEl.className = 'me-script__sub'
			subEl.setAttribute('aria-label', t('formula.aria.sub'))
			appendNodes(subEl, sub)
			script.append(subEl)
		}
		return script
	}

	/** 创建根式节点；index 为 null 表示没有根指数 */
	const createRootElement = (index: ParsedNode[] | null, radicand: ParsedNode[]): HTMLElement => {
		const rootNode = document.createElement('span')
		rootNode.className = 'me-root'
		if (index) {
			rootNode.classList.add('me-root--indexed')
			const indexEl = document.createElement('span')
			indexEl.className = 'me-root__index'
			indexEl.setAttribute('aria-label', t('formula.aria.rootIndex'))
			appendNodes(indexEl, index)
			rootNode.append(indexEl)
		}
		const sign = document.createElement('span')
		sign.className = 'me-root__sign'
		sign.textContent = '√'
		sign.setAttribute('aria-hidden', 'true')
		const radicandEl = document.createElement('span')
		radicandEl.className = 'me-root__radicand'
		radicandEl.setAttribute('aria-label', t('formula.aria.radicand'))
		appendNodes(radicandEl, radicand)
		rootNode.append(sign, radicandEl)
		return rootNode
	}

	/** 创建积分节点；sub / sup 为 null 表示没有对应限界，sign 存到 dataset 供序列化 */
	const createIntegralElement = (
		sign: string,
		sub: ParsedNode[] | null,
		sup: ParsedNode[] | null,
		integrand: ParsedNode[]
	): HTMLElement => {
		const integral = document.createElement('span')
		integral.className = 'me-int'
		integral.dataset.sign = sign
		if (sub) {
			const subEl = document.createElement('span')
			subEl.className = 'me-int__sub'
			subEl.setAttribute('aria-label', t('formula.aria.integralSub'))
			appendNodes(subEl, sub)
			integral.append(subEl)
		}
		if (sup) {
			const supEl = document.createElement('span')
			supEl.className = 'me-int__sup'
			supEl.setAttribute('aria-label', t('formula.aria.integralSup'))
			appendNodes(supEl, sup)
			integral.append(supEl)
		}
		const signEl = document.createElement('span')
		signEl.className = 'me-int__sign'
		signEl.textContent = sign
		signEl.setAttribute('aria-hidden', 'true')
		const integrandEl = document.createElement('span')
		integrandEl.className = 'me-int__integrand'
		integrandEl.setAttribute('aria-label', t('formula.aria.integrand'))
		appendNodes(integrandEl, integrand)
		integral.append(signEl, integrandEl)
		return integral
	}

	/**
	 * 创建大型运算符节点；inline 行内式限界排右上/右下（同积分），
	 * 堆叠式限界居中于符号正上/正下（Word 求和 / 乘积模板），sign 存到 dataset 供序列化。
	 */
	const createBigOpElement = (
		sign: string,
		inline: boolean,
		sub: ParsedNode[] | null,
		sup: ParsedNode[] | null,
		operand: ParsedNode[]
	): HTMLElement => {
		const bigop = document.createElement('span')
		bigop.className = inline ? 'me-bigop me-bigop--inline' : 'me-bigop'
		bigop.dataset.sign = sign
		if (sub) {
			const subEl = document.createElement('span')
			subEl.className = 'me-bigop__sub'
			subEl.setAttribute('aria-label', t(bigOpAriaKey(sign, 'Sub')))
			appendNodes(subEl, sub)
			bigop.append(subEl)
		}
		if (sup) {
			const supEl = document.createElement('span')
			supEl.className = 'me-bigop__sup'
			supEl.setAttribute('aria-label', t(bigOpAriaKey(sign, 'Sup')))
			appendNodes(supEl, sup)
			bigop.append(supEl)
		}
		const signEl = document.createElement('span')
		signEl.className = 'me-bigop__sign'
		signEl.textContent = sign
		signEl.setAttribute('aria-hidden', 'true')
		const operandEl = document.createElement('span')
		operandEl.className = 'me-bigop__operand'
		operandEl.setAttribute('aria-label', t(bigOpAriaKey(sign, 'Operand')))
		appendNodes(operandEl, operand)
		bigop.append(signEl, operandEl)
		return bigop
	}

	/** 创建函数节点：函数名不可编辑，可选下标槽（log 底数 / 极限条件），参数占一个可编辑槽位 */
	const createFunctionElement = (
		name: FunctionFormatId,
		argument: ParsedNode[],
		sub: ParsedNode[] | null = null
	): HTMLElement => {
		const func = document.createElement('span')
		const format = functionFormatById.get(name)
		const subUnder = sub !== null && format?.subUnder === true
		func.className = `me-func${sub ? ' me-func--with-sub' : ''}${subUnder ? ' me-func--sub-under' : ''}`
		func.dataset.func = name
		const nameEl = document.createElement('span')
		nameEl.className = 'me-func__name'
		nameEl.textContent = format?.name ?? name
		if (format?.sup) {
			const supEl = document.createElement('sup')
			supEl.className = 'me-func__sup'
			supEl.textContent = format.sup
			nameEl.append(supEl)
		}
		nameEl.setAttribute('aria-hidden', 'true')
		func.append(nameEl)
		if (sub) {
			const subEl = document.createElement('span')
			subEl.className = 'me-func__sub'
			subEl.setAttribute('aria-label', t('formula.aria.funcSub'))
			appendNodes(subEl, sub)
			func.append(subEl)
		}
		const argEl = document.createElement('span')
		argEl.className = 'me-func__arg'
		argEl.setAttribute('aria-label', t('formula.aria.funcArg'))
		appendNodes(argEl, argument)
		func.append(argEl)
		return func
	}

	/** 创建导数符号节点：记号不可编辑，参数占一个可编辑槽位；带标记的花括号再多一个标签槽 */
	const createDerivElement = (
		id: DerivFormatId,
		argument: ParsedNode[],
		label: ParsedNode[] | null = null
	): HTMLElement => {
		const deriv = document.createElement('span')
		const format = derivFormatById.get(id)
		const under = format?.placement === 'under'
		const boxed = format?.boxed === true
		deriv.className = `me-deriv${under ? ' me-deriv--under' : ''}${label ? ' me-deriv--labeled' : ''}${boxed ? ' me-deriv--boxed' : ''}`
		deriv.dataset.deriv = id
		const markEl = document.createElement('span')
		markEl.className = 'me-deriv__mark'
		if (format?.rule) {
			// 顶线 / 底线没有字形，靠 CSS 横线随参数宽度拉伸
			markEl.className += ` me-deriv__mark--rule me-deriv__mark--${format.rule}line`
		} else {
			markEl.textContent = format?.mark ?? ''
		}
		markEl.setAttribute('aria-hidden', 'true')
		const argEl = document.createElement('span')
		argEl.className = 'me-deriv__arg'
		argEl.setAttribute('aria-label', t('formula.aria.derivArg'))
		appendNodes(argEl, argument)
		if (!label) {
			if (boxed) deriv.append(argEl)
			else if (under) deriv.append(argEl, markEl)
			else deriv.append(markEl, argEl)
			return deriv
		}
		const labelEl = document.createElement('span')
		labelEl.className = 'me-deriv__label'
		labelEl.setAttribute('aria-label', t('formula.aria.derivLabel'))
		appendNodes(labelEl, label)
		if (under) deriv.append(argEl, markEl, labelEl)
		else deriv.append(labelEl, markEl, argEl)
		return deriv
	}

	/** 创建上置叠等号节点：上方记号占一个可编辑槽位，底座等号固定不可编辑 */
	const createOpElement = (variant: 'stackrel' | 'triangleq', top: ParsedNode[]): HTMLElement => {
		const op = document.createElement('span')
		op.className = 'me-op'
		op.dataset.op = variant
		const topEl = document.createElement('span')
		topEl.className = 'me-op__top'
		topEl.setAttribute('aria-label', t('formula.aria.opTop'))
		appendNodes(topEl, top)
		const baseEl = document.createElement('span')
		baseEl.className = 'me-op__base'
		baseEl.textContent = '='
		baseEl.setAttribute('aria-hidden', 'true')
		op.append(topEl, baseEl)
		return op
	}

	/** 创建箭头标注节点：箭头符号不可编辑，上 / 下方各有一个可编辑标注槽（可无） */
	const createArrowElement = (
		kind: ArrowKind,
		above: ParsedNode[] | null,
		below: ParsedNode[] | null
	): HTMLElement => {
		const arrow = document.createElement('span')
		arrow.className = 'me-arrow'
		arrow.dataset.arrow = kind
		if (above) {
			const aboveEl = document.createElement('span')
			aboveEl.className = 'me-arrow__above'
			aboveEl.setAttribute('aria-label', t('formula.aria.arrowAbove'))
			appendNodes(aboveEl, above)
			arrow.append(aboveEl)
		}
		const signEl = document.createElement('span')
		signEl.className = 'me-arrow__sign'
		signEl.textContent = ARROW_GLYPH[kind]
		signEl.setAttribute('aria-hidden', 'true')
		arrow.append(signEl)
		if (below) {
			const belowEl = document.createElement('span')
			belowEl.className = 'me-arrow__below'
			belowEl.setAttribute('aria-label', t('formula.aria.arrowBelow'))
			appendNodes(belowEl, below)
			arrow.append(belowEl)
		}
		return arrow
	}

	/** 创建括号节点：定界符不可编辑，每段内容各有一个可落光标的文本槽，段间是竖线分隔符 */
	const createBracketElement = (format: BracketFormat, groups: ParsedNode[][]): HTMLElement => {
		const bracket = document.createElement('span')
		bracket.className = 'me-bracket'
		bracket.dataset.bracket = format.id
		const open = document.createElement('span')
		// 单侧括号的另一侧是空定界符，不占位
		open.className = `me-bracket__open me-bracket__delim${format.glyphLeft ? '' : ' me-bracket__delim--empty'}`
		open.textContent = format.glyphLeft
		open.setAttribute('aria-hidden', 'true')
		bracket.append(open)
		groups.forEach((group, index) => {
			if (index > 0) {
				const sep = document.createElement('span')
				sep.className = 'me-bracket__sep'
				sep.textContent = '|'
				sep.setAttribute('aria-hidden', 'true')
				bracket.append(sep)
			}
			const contentEl = document.createElement('span')
			contentEl.className = 'me-bracket__content'
			contentEl.setAttribute('aria-label', t('formula.aria.bracketContent'))
			appendNodes(contentEl, group)
			bracket.append(contentEl)
		})
		const close = document.createElement('span')
		close.className = `me-bracket__close me-bracket__delim${format.glyphRight ? '' : ' me-bracket__delim--empty'}`
		close.textContent = format.glyphRight
		close.setAttribute('aria-hidden', 'true')
		bracket.append(close)
		return bracket
	}
	/**
	 * 创建竖向堆栈节点：cases 带左侧花括号（虚线可编辑行），matrix 无定界符；
	 * 每一行都是独立的行容器，里面有面向用户的文本槽，可上下跨行导航。
	 */
	const createStackElement = (style: StackStyle, rows: ParsedNode[][]): HTMLElement => {
		const stack = document.createElement('span')
		stack.className = style === 'cases' ? 'me-stack me-stack--cases' : 'me-stack'
		stack.dataset.stack = style
		if (style === 'cases') {
			const brace = document.createElement('span')
			brace.className = 'me-stack__brace'
			brace.textContent = '{'
			brace.setAttribute('aria-hidden', 'true')
			stack.append(brace)
		}
		const rowsEl = document.createElement('span')
		rowsEl.className = 'me-stack__rows'
		rows.forEach((row) => {
			const rowEl = document.createElement('span')
			rowEl.className = 'me-stack__row'
			rowEl.setAttribute('aria-label', t('formula.aria.stackRow'))
			appendNodes(rowEl, row)
			rowsEl.append(rowEl)
		})
		stack.append(rowsEl)
		return stack
	}

	/** 把解析结果挂到容器上；空内容补一个空文本槽，保证光标有落点 */
	const appendNodes = (container: HTMLElement, nodes: ParsedNode[]) => {
		if (!nodes.length) {
			container.append(createTextSlot(''))
			return
		}
		for (const node of nodes) {
			if (node.type === 'fraction') {
				container.append(createFractionElement(node.numerator, node.denominator, node.style))
			} else if (node.type === 'script') {
				container.append(createScriptElement(node.pre, node.sup, node.sub))
			} else if (node.type === 'root') {
				container.append(createRootElement(node.index, node.radicand))
			} else if (node.type === 'integral') {
				container.append(createIntegralElement(node.sign, node.sub, node.sup, node.integrand))
			} else if (node.type === 'bigop') {
				container.append(createBigOpElement(node.sign, node.inline, node.sub, node.sup, node.operand))
			} else if (node.type === 'bracket') {
				const format = bracketFormatById.get(node.format)
				if (format) container.append(createBracketElement(format, node.groups))
			} else if (node.type === 'stack') {
				container.append(createStackElement(node.style, node.rows))
			} else if (node.type === 'func') {
				container.append(createFunctionElement(node.name, node.argument, node.sub))
			} else if (node.type === 'deriv') {
				container.append(createDerivElement(node.id, node.argument, node.label))
			} else if (node.type === 'relop') {
				container.append(createOpElement(node.variant, node.top))
			} else if (node.type === 'arrow') {
				container.append(createArrowElement(node.kind, node.above, node.below))
			} else {
				container.append(createTextSlot(node.value))
			}
		}
	}

	const renderInto = (container: HTMLElement, source: string) => {
		appendNodes(container, parseLatex(source))
	}

	return {
		createTextSlot,
		createFractionElement,
		createScriptElement,
		createRootElement,
		createIntegralElement,
		createBigOpElement,
		createFunctionElement,
		createDerivElement,
		createOpElement,
		createArrowElement,
		createBracketElement,
		createStackElement,
		appendNodes,
		renderInto
	}
}
