/**
 * he-math-editor/full —— 内置 MathJax 的完整入口（离线可用）
 *
 * 与主入口（he-math-editor，默认公网 CDN 加载 MathJax）的区别：
 * 这里通过构建期虚拟模块把包内自带的 tex-svg.js（MathJax 3.2.2，
 * 与本仓库 public/mathjax 完全同源）emit 为独立资产并登记为加载地址，宿主项目构建时会把
 * 该文件作为静态资源一起产出 —— 不依赖任何外部网络。
 *
 * 用法：把 `import ... from 'he-math-editor'` 换成 `from 'he-math-editor/full'`
 * 即可，其余 API 完全一致。
 */
import texSvgUrl from 'virtual:hemath-tex-svg'
import mathJaxService from './utils/mathjax'

mathJaxService.configure({ source: texSvgUrl })

export * from './index'
export { default } from './index'
