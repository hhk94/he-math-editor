export type ToolId =
	| 'symbols'
	| 'fraction'
	| 'scripts'
	| 'radical'
	| 'integral'
	| 'largeOperator'
	| 'bracket'
	| 'function'
	| 'derivative'
	| 'limitLog'
	| 'operator'
	| 'matrix'
export type Tool = { id: ToolId; icon: string }
export type FractionStyle = 'normal' | 'small' | 'skewed'
export type FractionChoice = {
	latex: string
	preview: string
	fraction?: { num: string; den: string; style?: FractionStyle }
}
export type FractionFormatId = 'vertical' | 'horizontal' | 'skewed' | 'small'
export type FractionFormat = FractionChoice & { id: FractionFormatId }
export type CommonFraction = FractionChoice & { label: string }
export type ScriptFormatId = 'sup' | 'sub' | 'both' | 'pre'
export type ScriptFormat = { id: ScriptFormatId; preview: string }
export type CommonScript = { label: string; latex: string; preview: string }
export type RootFormatId = 'square' | 'nth' | 'squareIndex2' | 'cube'
export type RootFormat = { id: RootFormatId; preview: string; index: string | null }
export type CommonRoot = { label: string; latex: string; preview: string }
export type CommonBigOp = { id: string; label: string; latex: string; preview: string }
export type IntegralFormatId =
	| 'int'
	| 'intSup'
	| 'intSubSup'
	| 'iint'
	| 'iintSup'
	| 'iintSubSup'
	| 'iiint'
	| 'iiintSup'
	| 'iiintSubSup'
	| 'oint'
	| 'ointSup'
	| 'ointSubSup'
	| 'oiint'
	| 'oiintSup'
	| 'oiintSubSup'
	| 'oiiint'
	| 'oiiintSup'
	| 'oiiintSubSup'
export type IntegralFormat = { id: IntegralFormatId; preview: string; sign: string; limits: 'none' | 'sup' | 'both' }
/** 微分卡片：纯文本模板（dx / dy / dθ），无结构化槽位 */
export type DifferentialFormat = { id: 'dx' | 'dy' | 'dtheta'; latex: string }
/** 大型运算符格式：limits 决定堆叠限界（none/sup/sub/both），inline 为行内上下标形式（Word 第五张卡） */
export type BigOpFormatId =
	| 'sum'
	| 'sumSup'
	| 'sumSub'
	| 'sumSubSup'
	| 'sumInline'
	| 'prod'
	| 'prodSup'
	| 'prodSub'
	| 'prodSubSup'
	| 'prodInline'
	| 'coprod'
	| 'coprodSup'
	| 'coprodSub'
	| 'coprodSubSup'
	| 'coprodInline'
	| 'union'
	| 'unionSubSup'
	| 'unionInline'
	| 'unionSub'
	| 'unionSubInline'
	| 'intersection'
	| 'intersectionSubSup'
	| 'intersectionInline'
	| 'intersectionSub'
	| 'intersectionSubInline'
	| 'bigvee'
	| 'bigveeSubSup'
	| 'bigveeInline'
	| 'bigveeSub'
	| 'bigveeSubInline'
	| 'bigwedge'
	| 'bigwedgeSubSup'
	| 'bigwedgeInline'
	| 'bigwedgeSub'
	| 'bigwedgeSubInline'
export type BigOpFormat = {
	id: BigOpFormatId
	preview: string
	sign: string
	limits: 'none' | 'sup' | 'sub' | 'both'
	inline: boolean
}
export type BracketFormatId =
	| 'paren'
	| 'bracket'
	| 'brace'
	| 'angle'
	| 'floor'
	| 'ceil'
	| 'bar'
	| 'dbar'
	| 'leftOpen'
	| 'leftClose'
	| 'reverse'
	| 'doubleBracket'
	| 'singleParenOpen'
	| 'singleParenClose'
	| 'singleBracketOpen'
	| 'singleBracketClose'
	| 'singleBraceOpen'
	| 'singleBraceClose'
	| 'singleAngleOpen'
	| 'singleAngleClose'
	| 'singleFloorOpen'
	| 'singleFloorClose'
	| 'singleCeilOpen'
	| 'singleCeilClose'
	| 'singleBarOpen'
	| 'singleBarClose'
	| 'singleDbarOpen'
	| 'singleDbarClose'
	| 'singleDoubleOpen'
	| 'singleDoubleClose'
/**
 * 括号格式：left / right 是 \left / \right 后的定界符 token，
 * glyphLeft / glyphRight 是编辑区显示的字符（如 ⟦ ⟧）。
 */
export type BracketFormat = {
	id: BracketFormatId
	preview: string
	left: string
	right: string
	glyphLeft: string
	glyphRight: string
}

/** 带分隔符的括号模板：groups 表示内容被竖线切成几段 */
export type SeparatorBracketFormat = {
	id: string
	preview: string
	format: BracketFormatId
	groups: number
}

/** 堆栈样式：cases 左侧花括号分段，matrix 无定界符（可在外层套括号） */
export type StackStyle = 'cases' | 'matrix'

/** 事例与堆栈模板：rows 表示竖向堆叠的行数，wrap 表示外层再套一层括号 */
export type StackFormat = {
	id: string
	preview: string
	style: StackStyle
	rows: number
	wrap: BracketFormatId | null
}

/** 常用方括号模板：整段 LaTeX，插入后仍是可继续编辑的结构化节点 */
export type CommonBracketFormula = {
	id: string
	latex: string
	preview: string
}

export type FunctionFormatId =
	| 'sin'
	| 'cos'
	| 'tan'
	| 'csc'
	| 'sec'
	| 'cot'
	| 'arcsin'
	| 'arccos'
	| 'arctan'
	| 'arccsc'
	| 'arcsec'
	| 'arccot'
	| 'sinh'
	| 'cosh'
	| 'tanh'
	| 'csch'
	| 'sech'
	| 'coth'
	| 'arcsinh'
	| 'arccosh'
	| 'arctanh'
	| 'arccsch'
	| 'arcsech'
	| 'arccoth'
	| 'log'
	| 'ln'
	| 'lim'
	| 'min'
	| 'max'
/**
 * 函数卡片：name 是编辑区显示的直立函数名，sup 是右上角标记（反函数 / 反双曲函数为 −1）；
 * sub 表示插入时带下标槽（log 底数 / lim / min / max），subUnder 表示下标排在函数名正下方。
 */
export type FunctionFormat = {
	id: string
	name?: FunctionFormatId
	sup?: string
	sub?: string
	subUnder?: boolean
	preview: string
}
/** 常用函数模板卡：latex 解析后插入，wide 卡在两列网格中横跨整行 */
export type CommonFunction = { id: string; latex: string; preview: string; wide?: boolean }

/** 导数符号（Word「导数符号」画廊）：渲染在参数上方或下方的记号，command 用于 LaTeX 往返 */
export type DerivFormatId =
	| 'dot'
	| 'ddot'
	| 'dddot'
	| 'hat'
	| 'check'
	| 'acute'
	| 'grave'
	| 'tilde'
	| 'breve'
	| 'bar'
	| 'overbrace'
	| 'underbrace'
	| 'leftarrow'
	| 'rightarrow'
	| 'leftrightarrow'
	| 'leftharpoon'
	| 'rightharpoon'
	| 'boxed'
	| 'overline'
	| 'underline'
/** 画廊卡片 id：doublebar 插入嵌套的两层 \bar，带标记的花括号卡多一个上方 / 下方标签槽，boxedformula 是预填的宽带框公式 */
export type DerivCardId =
	| DerivFormatId
	| 'doublebar'
	| 'overbracelabel'
	| 'underbracelabel'
	| 'boxedformula'
	| 'objectA'
	| 'objectABC'
	| 'objectXorY'
export type DerivFormat = {
	id: DerivCardId
	node: DerivFormatId
	mark: string
	placement: 'over' | 'under'
	command: string
	preview: string
	nested?: boolean
	/** 花括号带标记：参数槽之外再生成一个标签槽，序列化为 \overbrace{}^{标签} / \underbrace{}_{标签} */
	labeled?: boolean
	/** 带框公式：参数外包一圈边框，没有记号 */
	boxed?: boolean
	/** 顶线 / 底线：记号位置用 CSS 横线绘制，stretch 到参数宽度 */
	rule?: 'over' | 'under'
	/** 预填参数（LaTeX），插入后光标停在参数末尾 */
	latex?: string
	/** 宽卡：在两列 / 四列网格中横跨两列 */
	wide?: boolean
}

export type OperatorFormatId =
	| 'colonEquals'
	| 'doubleEquals'
	| 'plusEquals'
	| 'minusEquals'
	| 'defEquals'
	| 'mEquals'
	| 'triangleEquals'
export type OperatorFormat = { id: OperatorFormatId; preview: string } & (
	| { latex: string }
	| { variant: 'stackrel' | 'triangleq'; top: string }
)

export type ArrowKind =
	| 'left'
	| 'right'
	| 'doubleLeft'
	| 'doubleRight'
	| 'leftRight'
	| 'leftRightDouble'

export type ArrowFormatId =
	| 'xLeftBelow'
	| 'xRightBelow'
	| 'xLeftAbove'
	| 'xRightAbove'
	| 'xDoubleLeftBelow'
	| 'xDoubleRightBelow'
	| 'xDoubleLeftAbove'
	| 'xDoubleRightAbove'
	| 'xLeftRightBelow'
	| 'xLeftRightAbove'
	| 'xDoubleLeftRightBelow'
	| 'xDoubleLeftRightAbove'

export type ArrowFormat = { id: ArrowFormatId; kind: ArrowKind; label: 'above' | 'below' }
