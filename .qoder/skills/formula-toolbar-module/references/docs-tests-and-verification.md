# 测试、文档与验证

## 1. 测试文件

新建 `packages/editor/src/components/__tests__/HeFormulaEditor.<module>.test.ts`，复用现有文件的辅助结构：

```ts
const mountEditor = (modelValue = '') =>
  mount(HeFormulaEditor, {
    props: { modelValue },
    global: { plugins: [i18n], stubs: { HeMathPreview: true } },
    attachTo: document.body
  })

const lastEmitted = (wrapper) => {
  const events = wrapper.emitted('update:modelValue')
  return events?.length ? (events[events.length - 1]![0] as string) : ''
}

const openModule = async (wrapper) => {
  await wrapper.find('button[title="函数"]').trigger('click')
}
```

定位卡片优先按弹层容器，不要堆全局索引：`wrapper.find('[role="dialog"]').findAll('.he-tool-card')`。

## 2. 最低覆盖矩阵

- 弹层标题、分区标题、卡片数量、每张卡 `title`
- 再次点击按钮关闭；与相邻弹层互斥
- 每种格式插入后的 DOM 结构、`update:modelValue`、光标落点（`window.getSelection()`）
- 每种格式的 LaTeX 解析往返；空参数 + 后续文本
- 嵌套（参数内分式、分式内函数）
- 命令前缀冲突（`\sinh` 不得解析为 `\sin`）
- 参数输入回写源码；参数为空时输入不丢失
- 方向键跳出 / 槽间导航；`Backspace` / `Delete` 整块删除
- 旧弹层新增卡片时，同步修正旧用例的卡片总数与分区序号

## 3. jsdom 坑

- `element.focus()` 不更新 `document.activeElement`，断言光标用 `window.getSelection()`。
- 光标要手工建 range 放到文本节点内，`insertTextAtCaret` 才会落在槽位。
- 断言前确认槽位有 `contenteditable="true"`。
- 空槽含零宽空格 `\u200b`，比较 `textContent` 时注意。
- 编辑区 DOM 改动后要派发 `input` 并 `await nextTick()` 才触发序列化。

## 4. 命令（Git Bash）

```bash
# 单文件
pnpm --filter he-math-editor exec vitest run src/components/__tests__/HeFormulaEditor.<module>.test.ts

# 全量
pnpm test

# 库 + demo（含 vue-tsc --noEmit）
pnpm build

# 空白 / 冲突检查
git diff --check
```

全量测试必须全绿；build 失败先看类型错误，不要绕过。

## 5. 文档落点

### TOOLBAR.md

- 第 2 节公式工具栏矩阵：按钮状态与说明（卡片数量、覆盖内容）。
- 新增独立模块小节（当前顺序：8 括号、9 函数、10 能力、11 符号、12 更新记录）；插入后重排后续编号。
- 小节内容：卡片表（卡片 / 插入 LaTeX / 类型）、交互规则、序列化规则。
- 第 10 节能力表：新增「结构化 X」行；同步点击定位、方向键、整块删除、外部左右键说明。
- 最后一节更新记录追加「日期 + 支持项」。

### CHANGELOG.md

- `[未发布]` 下按「新增 / 变更 / 修复 / 文档」记录。
- 同步「当前已结构化的命令范围」行。
- 测试文件与文档变更各写一条；只改文档也必须写。

### README.ai.md

- 文件地图 / 测试清单加入新测试文件。
- 解析、渲染、序列化说明加入新命令与 `.me-foo > .me-foo__name/__arg`。
- 槽位角色列表加入 `fooArg`；原子列表、方向键、删除、点击说明同步。
- 公式工具栏已绑定按钮列表加入本模块；弹层说明新增一条。
- 结构化范围行、手工回归清单新增条目（不覆盖旧条目）。
- 第 9 节易错点补本模块特有的解析 / 序列化陷阱。

## 6. 浏览器验收

`pnpm dev` 启动 demo（端口可能顺延，读取输出中的实际地址），打开 `#/input`。

若 In-app Browser 返回 `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`，改用 `mcp__browser-use__evaluate_script`：

1. 只派发 `click` 可能不触发 Vue 处理器；依次派发 `mousedown`、`mouseup`、`click`，然后等待 100–200ms。
2. 读取弹层：`.he-tool-popover` 的 `__header`、`__section`、`.he-tool-card` 的数量与 `title`。
3. 点击卡片后检查：`.he-formula-source` 的值、`.me-foo` 结构、`document.activeElement` 与 `window.getSelection()` 是否在参数槽。
4. 模拟输入：`slot.focus()` + `document.execCommand('insertText', false, 'x')`，检查源码回写与实时预览文本。
5. 切换语言，检查弹层标题、卡片 `title`、槽位 `aria-label` 是否同步；验收后切回中文，避免残留 localStorage。
6. 验收完成停止后台 dev server。

## 7. 易错点

- 弹层状态有 6 处以上引用：ref、模板、本分支、其他每个分支、兜底段、`onDocumentClick`。漏一处就残留或关不掉。
- 当前没有 Esc 关闭逻辑；若新增要同时注册与移除监听。
- `insertNodesAtCaret` 不自动同步；`insertTextAtCaret` 已同步，重复调用会造成回写循环风险。
- 结构化节点未注册 `isAtomElement` / `ATOM_SELECTOR`：外部左右键会钻进节点。
- 序列化参数不写花括号：源码往返吞掉后续字符。
- 解析不用 `isCommandAt`：长命令被前缀命令误拆。
- 槽位 `aria-label` 命令式创建，切语言不刷新会残留旧文案。
- Vue 模板缩进用 Tab；新增块后检查闭合与缩进。
- 只 `git add` 本次文件；用户未提交的 `README.md`、`package.json` 等不要带上。
- 未经明确要求不 commit / push。