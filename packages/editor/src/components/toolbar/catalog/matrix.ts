import type { MatrixFormat } from './types'

/** 生成矩阵预览：rows×cols 虚线空框网格，仅用于工具栏弹窗 */
export const matrixPreview = (rows: number, cols: number) => {
	const cells = Array.from({ length: rows * cols }, () => '<span class="matrix-preview__box"></span>').join('')
	return `<span class="matrix-preview"><span class="matrix-preview__grid" style="grid-template-columns: repeat(${cols}, minmax(1.1em, auto)); grid-template-rows: repeat(${rows}, minmax(1.2em, auto))">${cells}</span></span>`
}

/** 8 种空矩阵模板，顺序即弹层 2 行 × 4 列的展示顺序 */
export const matrixFormats: MatrixFormat[] = [
	{ id: 'm1x2', preview: matrixPreview(1, 2), rows: 1, cols: 2 },
	{ id: 'm2x1', preview: matrixPreview(2, 1), rows: 2, cols: 1 },
	{ id: 'm1x3', preview: matrixPreview(1, 3), rows: 1, cols: 3 },
	{ id: 'm3x1', preview: matrixPreview(3, 1), rows: 3, cols: 1 },
	{ id: 'm2x2', preview: matrixPreview(2, 2), rows: 2, cols: 2 },
	{ id: 'm2x3', preview: matrixPreview(2, 3), rows: 2, cols: 3 },
	{ id: 'm3x2', preview: matrixPreview(3, 2), rows: 3, cols: 2 },
	{ id: 'm3x3', preview: matrixPreview(3, 3), rows: 3, cols: 3 }
]
