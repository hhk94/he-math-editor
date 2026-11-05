# 结构化节点集成清单

以函数节点 `.me-func` 为最小完整样例。新增模块时把 `Foo` 替换为模块名，逐项完成 A–J；漏一项就会出现源码失步、键盘钻进节点或无法删除等不一致。

命名约定：

- 根类名 `.me-foo`，数据 `dataset.foo`
- 展示用子元素 `.me-foo__name`（`aria-hidden`，不可编辑）
- 可编辑槽 `.me-foo__arg`，内部由 `createTextSlot` 生成 `contenteditable` 文本槽
- 预览类名 `.foo-preview` / `.foo-preview__box`，与编辑区 `.me-*` 分开

## A. 类型与数据

1. 格式 id 与格式化类型（放在其他 `XxxFormat` 附近）：

```ts
type FooFormatId = 'sin' | 'cos'
type FooFormat = { id: FooFormatId; name: string; preview: string }
```

2. `ParsedNode` 联合新增一项，子内容继续用递归节点：

```ts
| { type: 'foo'; name: FooFormatId; argument: ParsedNode[] }
```

3. 数据数组 + 预览构造器；卡片不显示常驻名称，名称放 `title`：

```ts
const fooPreview = (name: string) =>
  `<span class="foo-preview"><span class="foo-preview__name">${name}</span><span class="foo-preview__box"></span></span>`
const fooFormats: FooFormat[] = [{ id: 'sin', name: 'sin', preview: fooPreview('sin') }]
```

4. 卡片预览需要的虚线框等样式必须新增 CSS（`.foo-preview__box`），不要指望现有卡片类；编辑区补：

```scss
.me-foo { display: inline-flex; align-items: baseline; }
.me-foo__name { font-style: normal; user-select: none; }
.me-foo__arg { display: inline-flex; min-width: 10px; }
.me-foo__arg:focus-within { background: #eef3ff; }
```

## B. 命令表与解析

1. 命令表放在其他命令映射旁（如 `bigOpSignToCommand`）：

```ts
const fooCommands: { command: string; name: FooFormatId }[] = [
  { command: '\\sin', name: 'sin' },
  { command: '\\cos', name: 'cos' }
]
```

2. 读取函数用 `isCommandAt` 做独立命令判定，避免 `\sinh` 被拆成 `\sin` + `h`；参数复用 `readScriptArgument`（支持 `{...}`、单字符、命令）：

```ts
const readFoo = (source: string, start: number) => {
  const matched = fooCommands.find(({ command }) => isCommandAt(source, start, command))
  if (!matched) return null
  const argument = readScriptArgument(source, start + matched.command.length)
  if (!argument) return null
  return { name: matched.name, argument: argument.content, end: argument.end }
}
```

没有参数时返回 `null`，交给主循环按文本保留，避免把普通命令吞掉。

3. 在 `parseLatex` 主循环新增分支。顺序原则：更长 / 更高优先级的命令先匹配（大型运算符、积分先于普通文本；`\oiiint` 先于 `\oint`）；分支里递归解析参数：

```ts
const foo = readFoo(source, cursor)
if (foo) {
  nodes.push({ type: 'foo', name: foo.name, argument: parseLatex(foo.argument) })
  cursor = foo.end
  continue
}
```

4. 不支持的命令不要解析，保持纯文本；模板里的符号用 Unicode。

## C. 渲染

```ts
const createFooElement = (name: FooFormatId, argument: ParsedNode[]): HTMLElement => {
  const root = document.createElement('span')
  root.className = 'me-foo'
  root.dataset.foo = name
  const nameEl = document.createElement('span')
  nameEl.className = 'me-foo__name'
  nameEl.setAttribute('aria-hidden', 'true')
  nameEl.textContent = name
  const argEl = document.createElement('span')
  argEl.className = 'me-foo__arg'
  argEl.setAttribute('aria-label', t('formula.aria.fooArg'))
  appendNodes(argEl, argument)
  if (!argEl.querySelector('[contenteditable]')) argEl.append(createTextSlot(''))
  root.append(nameEl, argEl)
  return root
}
```

`appendNodes` 新增 `else if (node.type === 'foo')` 分支。槽位统一用 `createTextSlot`，不要手写 `contenteditable`，零宽空格与空槽清理依赖现有逻辑。

## D. 序列化

在 `serializeNodes` 的 `isAtomElement` 判定链里新增分支，路径与解析严格对称：

```ts
} else if (child.classList.contains('me-foo')) {
  const name = (child.dataset.foo ?? 'sin') as FooFormatId
  const argEl = child.querySelector(':scope > .me-foo__arg') as HTMLElement | null
  result += `\\${name}{${argEl ? serializeNodes(argEl) : ''}}`
  hasContent = true
}
```

规则：参数花括号始终输出。省略会在源码往返时吞掉后续字符（`\sin` + `x` 序列化成 `\sinx`，再解析变成未知命令 + 文本）。用 `:scope >` 只取直属槽位。

## E. 槽位模型

1. `SlotRole` 新增 `'fooArg'`。
2. `ActiveSlotInfo` 新增 `foo: HTMLElement | null`。
3. `getSlotRole` 按父容器类名映射：

```ts
if (parent?.classList.contains('me-foo__arg')) return 'fooArg'
```

4. `getActiveSlot` 填充引用：

```ts
foo: slot.closest('.me-foo')
```

5. `getEdgeSlot` 遇到 `.me-foo` 时递归进参数槽，保证边界移动能进入 / 越过：

```ts
if (child.classList.contains('me-foo')) {
  const argEl = child.querySelector(':scope > .me-foo__arg')
  if (argEl) return getEdgeSlot(argEl, side)
}
```

## F. 原子、聚焦与键盘

1. `isAtomElement` 与 `ATOM_SELECTOR` 同时注册 `.me-foo`；否则外部左右键会进入节点内部而非整体跨越。
2. 聚焦函数：

```ts
const focusFooSlot = (foo: HTMLElement, select = false): boolean => {
  const argEl = foo.querySelector(':scope > .me-foo__arg') as HTMLElement | null
  if (!argEl) return false
  focusSlot(getEdgeSlot(argEl, 'start'), select, 'start')
  return true
}
```

3. `handleArrow` 增加 `fooArg` 分支。单槽节点：`↑` / 开头 `←` 跳出左侧，`↓` / 末尾 `→` 跳出右侧；多槽节点先做槽间导航：

```ts
if (role === 'fooArg' && info.foo) {
  if (key === 'ArrowUp' || (key === 'ArrowLeft' && atStart)) return moveSibling(info.foo, 'left')
  if (key === 'ArrowDown' || (key === 'ArrowRight' && atEnd)) return moveSibling(info.foo, 'right')
  return false
}
```

4. `handleDelete` 增加 `fooArg` 分支，边界用 `removeAtomNode` 整块删除：

```ts
if (role === 'fooArg' && info.foo) {
  if (key === 'Backspace' && atStart) return removeAtomNode(info.foo, 'before'), true
  if (key === 'Delete' && atEnd) return removeAtomNode(info.foo, 'after'), true
  return false
}
```

多槽节点（如上下限）遵循既有规则：限界开头可删整块，表达式开头仅在无限界时删整块；中间边界只跳转。

5. `focusByPoint` 处理点击节点本体：单槽进默认槽，多槽按横向位置选槽。
6. `onEditorClick`：把 `__arg` 加入 part 选择器，并新增 `target.closest('.me-foo')` 分支；先判断 `[contenteditable]` 直接返回，避免抢走槽位光标。

## G. 插入与 pick

```ts
const insertFoo = (format: FooFormat) => {
  const foo = createFooElement(format.id, [])
  insertNodesAtCaret([foo])
  syncFromEditor()
  focusFooSlot(foo)
}
const pickFooFormat = (item: FooFormat) => {
  fooOpen.value = false
  insertFoo(item)
}
```

`insertNodesAtCaret` 不自动同步，必须手动 `syncFromEditor()` 再聚焦；纯文本路径 `insertTextAtCaret` 已同步，不要再调。

## H. 弹层状态与可见性

在 `onToolClick` 增加本模块分支并关闭其余全部；同时在其他每个分支、末尾兜底段、`onDocumentClick` 条件与重置中都加入 `fooOpen`。新增卡片后检查：

- 模板 `v-if="fooOpen"` 是否存在
- 弹层 `aria-label` 是否用 `t('formula.foo.panelTitle')`
- 卡片 `:title="t('formula.foo.' + item.id)"`
- 卡片 `@mousedown.prevent` 是否保留（避免抢焦点）

## I. i18n

两个语言包同时补：

```ts
formula: { foo: { panelTitle: '…', sectionTitle: '…', sin: '…', cos: '…' }, aria: { fooArg: '…' } }
```

命令式创建的槽位 `aria-label` 不会随语言自动更新，在 `watch(locale)` 中按类名统一重设（参考现有 `.me-*` 批量刷新块）。

## J. 完成前自检

逐项搜索确认（类名替换为实际值）：

- `ParsedNode` 有 `'foo'`
- `parseLatex` 有 `readFoo` 分支
- `appendNodes` 有 `'foo'`
- `serializeNodes` 有 `.me-foo`
- `me-foo__arg` 出现在 `getSlotRole`、`getEdgeSlot`、`onEditorClick` part 选择器
- `foo` 引用出现在 `ActiveSlotInfo`、`getActiveSlot`
- `.me-foo` 出现在 `isAtomElement`、`ATOM_SELECTOR`、`focusByPoint`
- `fooArg` 出现在 `handleArrow`、`handleDelete`
- `watch(locale)` 刷新 `fooArg` 的 `aria-label`
- 焦点函数使用 `:scope > .me-foo__arg`

任何一项缺失，先用 `pnpm test` 的失败用例定位，不要靠肉眼判断。