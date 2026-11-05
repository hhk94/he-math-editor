---
name: formula-toolbar-module
description: End-to-end workflow for adding or extending a formula-toolbar popover module in heMathEditor's HeFormulaEditor, including cards, i18n, structured LaTeX node parse/render/serialize, atom navigation and whole-node deletion, tests, CHANGELOG/TOOLBAR/README.ai updates, and pnpm test/build verification. Use when implementing modules such as 函数/三角函数, 导数, 极限和对数, 运算符, 矩阵, 分式, 根式, 积分, 大型运算符, 括号 or 堆栈, or when changing an existing popover's cards and interactions.
---

# 公式工具栏模块开发

这是 Qoder 可调用版本，取代 `.trae/skills/formula-toolbar-module/SKILL.md` 的手工流程；两者冲突时以本文件和代码现状为准。

面向 `packages/editor/src/components/HeFormulaEditor.vue`。按顺序执行，每步验证后再进入下一步。代码现状永远优先于本文档，动手前先读最接近的既有模块。

## 0. 先读现状

- 组件：`packages/editor/src/components/HeFormulaEditor.vue`
- 文案：`packages/editor/src/i18n/locales/zh-CN.ts`、`en-US.ts`
- 测试：`packages/editor/src/components/__tests__/`
- 文档：`TOOLBAR.md`、`CHANGELOG.md`、`README.ai.md`

按目标形态选参考实现：

| 形态 | 参考模块 |
| --- | --- |
| 纯文本卡 | 积分弹层底部「微分」dx / dy / dθ |
| 单槽结构化（最新最简） | 函数 `.me-func` |
| 多限界结构化 | 积分 `.me-int`、大型运算符 `.me-bigop` |
| 多段 / 多行结构化 | 括号 `.me-bracket`、堆栈 `.me-stack` |

至少读完参考模块的：格式类型、数据数组、弹层模板、pick 函数、解析分支、创建元素、`appendNodes`、`serializeNodes`、槽位角色、聚焦函数、方向键 / 删除 / 点击分支。

## 1. 判断插入方式

| 情况 | 做法 |
| --- | --- |
| 纯文本片段，无槽位 | `insertTextAtCaret(value)`，函数内部已 `syncFromEditor()`，不要再调用 |
| 需要可编辑槽位、键盘导航、源码往返 | 结构化节点，走第 3 步与 [结构化集成清单](references/structured-node-integration.md) |

结构化是默认选择：工具栏卡片一旦显示参数框、可继续嵌套或需要整块删除，就必须建节点，不能拼字符串。可编辑区只解析已支持的命令，未支持命令会显示成文本；纯文本模板里的符号用 Unicode（`±`、`θ`、`×`、`−`、`÷`）。

## 2. 纯文本模块（跳过第 3 步）

1. `type XxxFormat = { id: ...; latex: string }`（需要预览时再加 `preview`）。
2. `const xxxFormats: XxxFormat[] = [...]`。
3. 弹层模板放进工具栏对应 `v-if` 块，复用 `.he-tool-popover` 系列类。
4. `pickXxxFormat` 关闭弹层后调用 `insertTextAtCaret`。
5. 完成第 4 步弹层状态接线、第 5 步 i18n、第 6–8 步。

## 3. 结构化模块

必须完成 [references/structured-node-integration.md](references/structured-node-integration.md) 中的全部 A–J 项，常用符号名：

- 类型 / 数据：`ParsedNode` 联合、`XxxFormatId`、命令表
- 解析：`isCommandAt` 最长匹配、`readXxx`、`readScriptArgument`、`parseLatex` 分支
- 渲染：`createXxxElement`、`appendNodes`、`serializeNodes`
- 槽位：`SlotRole`、`ActiveSlotInfo`、`getSlotRole`、`getActiveSlot`、`getEdgeSlot`
- 聚焦：`focusXxxSlot`、`isAtomElement`、`ATOM_SELECTOR`
- 交互：`handleArrow`、`handleDelete`、`focusByPoint`、`onEditorClick`
- 插入：`insertXxx`（`insertNodesAtCaret` + 手动 `syncFromEditor()` + 聚焦）

硬性规则：

- `isAtomElement` / `ATOM_SELECTOR` 漏注册：外部左右键会钻进节点内部。
- 序列化漏分支：编辑区与 LaTeX 源码立刻失步；参数花括号必须始终输出，否则 `\sin x` 会吞掉后续字母。
- 解析必须用 `isCommandAt`，否则 `\sinh` 会被误拆成 `\sin` + `h`。
- 新节点类名统一 `me-xxx`，槽位类名 `me-xxx__arg` 等，便于 `getSlotRole` 与点击定位。

## 4. 弹层状态与样式

弹层状态有 6 处以上引用，逐一补齐，否则会残留或无法关闭：

1. 其他弹层 ref 旁新增 `const xxxOpen = ref(false)`。
2. 模板新增 `v-if="xxxOpen"` 弹层块。
3. `onToolClick` 新增本模块分支，打开自己并关闭其余全部。
4. `onToolClick` 其余每个分支都加 `xxxOpen.value = false`。
5. `onToolClick` 末尾兜底段加 `xxxOpen.value = false`。
6. `onDocumentClick` 的提前返回条件加 `!xxxOpen.value`，并加重置。

当前没有 Esc 关闭逻辑；如需新增，同时注册与移除监听。

样式先复用现有类，确有必要再补：

- 弹层：`.he-tool-popover`、`--wide`、`__header`、`__body`、`__body--columns`、`__col`、`__section`、`__grid`（`--half` / `--thirds` / `--quarters` / `--fifths`）、`__body--scroll`
- 卡片：`.he-tool-card`、`--tall`、`--wide`、`__preview`
- 预览用小写类名前缀（如 `.func-preview`），编辑区节点用 `.me-*`；卡片预览用 `v-html`，纯文本卡直接插值。

## 5. i18n

- 两个语言包同时补 `formula.<module>`：`panelTitle`、分区标题、每张卡 `title`；缺 en-US 会回退中文或显示 key。
- 结构化槽位补 `formula.aria.<slot>`，并在 `watch(locale)` 中刷新命令式创建的 `aria-label`。
- 模板与 TS 一律 `t()`，不硬编码界面文案。

## 6. 测试

新建 `packages/editor/src/components/__tests__/HeFormulaEditor.<module>.test.ts`，复用既有辅助结构。最低覆盖：

- 弹层标题、分区、卡片数量与 `title`
- 点击卡片后弹层关闭、DOM 结构、源码、光标落点
- 每种格式的解析往返；空参数 + 后续文本
- 嵌套结构、前缀冲突（如 `\sinh`）、参数编辑回写
- 方向键跳出、`Backspace` / `Delete` 整块删除
- 与相邻弹层互斥

jsdom 注意：`focus()` 不更新 `document.activeElement`，用 `window.getSelection()` 断言；槽位需 `contenteditable="true"`；注意零宽空格。详细模板与命令见 [测试、文档与验证](references/docs-tests-and-verification.md)。

新增卡片到既有弹层时，同步修正旧用例的卡片总数与分区序号。

## 7. 文档

三件套缺一视为未完成：

- `TOOLBAR.md`：按钮矩阵说明、新模块小节（卡片表 + 交互）、可编辑区能力表、更新记录一行；**插入新小节后必须重排后续编号**（更新记录当前在第 12 节）。
- `CHANGELOG.md`：`[未发布]` 按「新增 / 变更 / 修复 / 文档」记录；结构化范围行同步。
- `README.ai.md`：测试文件清单、解析 / 渲染 / 序列化说明、槽位角色、原子列表、方向键、删除、点击、弹层说明、结构化范围、回归清单、易错点。

只改文档也必须写 CHANGELOG。

## 8. 验证

在 Git Bash 执行：

```bash
pnpm test
pnpm build
git diff --check
```

`pnpm test` 必须全绿；`pnpm build` 同时覆盖库构建与 demo 的 `vue-tsc --noEmit`。需要看 UI 时 `pnpm dev`，端口被占用会顺延，读取输出中的实际端口；验证完成后停止后台服务。浏览器操作与验收细节见 [测试、文档与验证](references/docs-tests-and-verification.md)。

## 9. Git 规则

- 未经用户明确要求，不 `git commit`、不 `git push`。
- 只 `git add` 本次相关文件；用户自己未提交的 `README.md`、`package.json` 等改动不要带上。
- 提交信息沿用 `feat:` / `fix:` / `docs:` / `refactor:` / `chore:`。

## 完成定义

- [ ] 卡片、弹层、互斥全部生效
- [ ] 文本或结构化路径完整，源码往返一致
- [ ] 槽位可点击、方向键可进出、边界可整块删除
- [ ] 中英文与 `aria-label` 同步
- [ ] 新测试文件通过，全量测试通过
- [ ] TOOLBAR / CHANGELOG / README.ai 已更新且编号正确
- [ ] `pnpm build` 与 `git diff --check` 通过

## 资源

- [references/structured-node-integration.md](references/structured-node-integration.md)：结构化节点 10 个子系统清单与代码骨架
- [references/docs-tests-and-verification.md](references/docs-tests-and-verification.md)：测试模板、文档落点、浏览器验收与易错点