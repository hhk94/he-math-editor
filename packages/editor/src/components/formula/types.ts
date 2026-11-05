import type {
	ArrowKind,
	BracketFormatId,
	DerivFormatId,
	FractionStyle,
	FunctionFormatId,
	StackStyle
} from '../toolbar/catalog'

/** 可编辑区的结构化节点模型：`parseLatex` 的产物，也是 `renderInto` 的输入 */
export type ParsedNode =
	| { type: 'text'; value: string }
	| { type: 'fraction'; style: FractionStyle; numerator: ParsedNode[]; denominator: ParsedNode[] }
	| { type: 'script'; pre: boolean; sup: ParsedNode[] | null; sub: ParsedNode[] | null }
	| { type: 'root'; index: ParsedNode[] | null; radicand: ParsedNode[] }
	| { type: 'integral'; sign: string; sub: ParsedNode[] | null; sup: ParsedNode[] | null; integrand: ParsedNode[] }
	| {
			type: 'bigop'
			sign: string
			inline: boolean
			sub: ParsedNode[] | null
			sup: ParsedNode[] | null
			operand: ParsedNode[]
	  }
	| { type: 'bracket'; format: BracketFormatId; groups: ParsedNode[][] }
	| { type: 'stack'; style: StackStyle; rows: ParsedNode[][] }
	| { type: 'func'; name: FunctionFormatId; sub: ParsedNode[] | null; argument: ParsedNode[] }
	| { type: 'deriv'; id: DerivFormatId; argument: ParsedNode[]; label: ParsedNode[] | null }
	| { type: 'relop'; variant: 'stackrel' | 'triangleq'; top: ParsedNode[] }
	| { type: 'arrow'; kind: ArrowKind; above: ParsedNode[] | null; below: ParsedNode[] | null }
