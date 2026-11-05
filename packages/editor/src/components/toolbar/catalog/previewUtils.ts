/** 生成 HTML 分式预览，仅用于工具栏弹窗 */
export const frac = (num: string, den: string, small = false) =>
	`<span class="math-frac${small ? ' math-frac--small' : ''}"><span class="math-frac__num">${num}</span><span class="math-frac__den">${den}</span></span>`

/** 预览用虚线空槽，表示插入后可编辑的占位 */
export const dashSlot = '<span class="math-dash"></span>'
