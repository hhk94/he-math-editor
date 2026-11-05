import type { DerivFormatId, FractionStyle, FunctionFormatId } from '../toolbar/catalog'

export const fractionCommands: { command: string; style: FractionStyle }[] = [
	{ command: '\\tfrac', style: 'small' },
	{ command: '\\frac', style: 'normal' }
]

/** 积分命令最长优先匹配，避免前缀误判（含围道积分 \oint / \oiint / \oiiint） */
export const integralCommands: { command: string; sign: string }[] = [
	{ command: '\\oiiint', sign: '∰' },
	{ command: '\\oiint', sign: '∯' },
	{ command: '\\oint', sign: '∮' },
	{ command: '\\iiint', sign: '∭' },
	{ command: '\\iint', sign: '∬' },
	{ command: '\\int', sign: '∫' }
]

/** 序列化反查：积分符号 → LaTeX 命令（与 integralCommands 同源） */
export const integralSignToCommand: Record<string, string> = Object.fromEntries(
	integralCommands.map(({ command, sign }) => [sign, command])
)

/** 大型运算符命令最长优先匹配（∑ 求和 / ∏ 乘积 / ∐ 副积 / ⋃ 并集 / ⋂ 交集 / ⋁ 或运算 / ⋀ 与运算） */
export const bigOpCommands: { command: string; sign: string }[] = [
	{ command: '\\bigwedge', sign: '⋀' },
	{ command: '\\bigvee', sign: '⋁' },
	{ command: '\\bigcup', sign: '⋃' },
	{ command: '\\bigcap', sign: '⋂' },
	{ command: '\\coprod', sign: '∐' },
	{ command: '\\prod', sign: '∏' },
	{ command: '\\sum', sign: '∑' }
]

/** 序列化反查：运算符符号 → LaTeX 命令（与 bigOpCommands 同源） */
export const bigOpSignToCommand: Record<string, string> = Object.fromEntries(
	bigOpCommands.map(({ command, sign }) => [sign, command])
)

/**
 * 函数命令：反函数 / 反双曲函数（\sin^{-1}、\sinh^{-1}）最长优先，避免被 \sin / \sinh 抢先匹配；
 * `isCommandAt` 判断命令边界，避免把 \sinh 误判为 \sin。
 */
export const functionCommands: { command: string; name: FunctionFormatId }[] = [
	{ command: '\\lim', name: 'lim' },
	{ command: '\\min', name: 'min' },
	{ command: '\\max', name: 'max' },
	{ command: '\\log', name: 'log' },
	{ command: '\\ln', name: 'ln' },
	{ command: '\\sin^{-1}', name: 'arcsin' },
	{ command: '\\cos^{-1}', name: 'arccos' },
	{ command: '\\tan^{-1}', name: 'arctan' },
	{ command: '\\csc^{-1}', name: 'arccsc' },
	{ command: '\\sec^{-1}', name: 'arcsec' },
	{ command: '\\cot^{-1}', name: 'arccot' },
	{ command: '\\sinh^{-1}', name: 'arcsinh' },
	{ command: '\\cosh^{-1}', name: 'arccosh' },
	{ command: '\\tanh^{-1}', name: 'arctanh' },
	{ command: '\\csch^{-1}', name: 'arccsch' },
	{ command: '\\sech^{-1}', name: 'arcsech' },
	{ command: '\\coth^{-1}', name: 'arccoth' },
	{ command: '\\sinh', name: 'sinh' },
	{ command: '\\cosh', name: 'cosh' },
	{ command: '\\tanh', name: 'tanh' },
	{ command: '\\csch', name: 'csch' },
	{ command: '\\sech', name: 'sech' },
	{ command: '\\coth', name: 'coth' },
	{ command: '\\sin', name: 'sin' },
	{ command: '\\cos', name: 'cos' },
	{ command: '\\tan', name: 'tan' },
	{ command: '\\csc', name: 'csc' },
	{ command: '\\sec', name: 'sec' },
	{ command: '\\cot', name: 'cot' }
]

/** 序列化使用规范命令：反函数统一输出 \sin^{-1} 形式 */
export const functionCommandById = new Map(
	functionCommands.map(({ command, name }) => [name, command] as const)
)

/**
 * 导数符号命令：长命令在前，isCommandAt 词边界避免把 \dots 误判为 \dot，
 * 也保证 \overleftrightarrow 不会被 \overleftarrow 抢先匹配。
 */
export const derivCommands: { command: string; id: DerivFormatId }[] = [
	{ command: '\\overleftrightarrow', id: 'leftrightarrow' },
	{ command: '\\overleftarrow', id: 'leftarrow' },
	{ command: '\\overrightarrow', id: 'rightarrow' },
	{ command: '\\overleftharpoon', id: 'leftharpoon' },
	{ command: '\\overrightharpoon', id: 'rightharpoon' },
	{ command: '\\overbrace', id: 'overbrace' },
	{ command: '\\underbrace', id: 'underbrace' },
	{ command: '\\overline', id: 'overline' },
	{ command: '\\underline', id: 'underline' },
	{ command: '\\boxed', id: 'boxed' },
	{ command: '\\dddot', id: 'dddot' },
	{ command: '\\ddot', id: 'ddot' },
	{ command: '\\dot', id: 'dot' },
	{ command: '\\tilde', id: 'tilde' },
	{ command: '\\breve', id: 'breve' },
	{ command: '\\acute', id: 'acute' },
	{ command: '\\grave', id: 'grave' },
	{ command: '\\check', id: 'check' },
	{ command: '\\hat', id: 'hat' },
	{ command: '\\bar', id: 'bar' }
]
