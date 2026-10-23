# heMathEditor

English | [简体中文](./README.zh-CN.md)

A math formula editor built with **Vue 3 + Vite**, using a two-layer editing model:

- **Layer 1 `HeMdEditor`**: a Markdown editor (CodeMirror 6). Formulas are embedded as atomic labels; their internals cannot be edited directly in the document.
- **Layer 2 `HeFormulaDialog`**: opened by clicking a formula label or the "∑ Formula" toolbar button. It embeds the custom `HeFormulaEditor` (structured editable formula area + live MathJax preview).

The project is a **pnpm monorepo**: `packages/editor` is the core library published to npm as `he-math-editor`, and `apps/demo` is the demo site, developed against the library source through a workspace alias.

## Features

- **WYSIWYG formula input**: MathLive `<math-field>` remains available as `HeMathInput` for inline demos; the formula dialog now uses the custom KaTeX input in `HeFormulaEditor`.
- **Atomic formulas**: `$...$` / `$$...$$` are replaced with a single label that cannot be partially edited or deleted.
- **Click to edit**: click a formula label to open the dialog; confirming replaces it in place while keeping the Markdown source clean.
- **Split live preview**: Markdown and formula rendering update together with a 250 ms debounce.
- **Syntax highlighting**: fenced code blocks are highlighted by highlight.js based on their language; unknown languages fall back to plain text.
- **Markdown toolbar**: headings, bold, italic, strikethrough, inline code, blockquote, lists, task lists, code blocks, links, images, tables, and horizontal rules.
- **Local MathJax**: uses `public/mathjax/tex-svg.js` (MathJax 3.2.2), with no CDN dependency and offline support.
- **Read-only viewer**: `HeMdViewer` renders Markdown returned by a backend without loading CodeMirror or MathLive.
- **Custom input prototype**: a standalone `#/input` page renders keyboard digits, letters, and symbols with KaTeX math fonts, without MathLive.
- **Demo navigation**: a top navigation bar switches between the HeMdEditor, custom input, HeMdViewer, and HeMdWysiwyg demo pages.
- **Chinese / English UI**: built on vue-i18n; a nav button toggles the language, and the choice is persisted in `localStorage`.
- **Decoupled library and demo**: pnpm monorepo. The `he-math-editor` library builds independently (`dist-lib` + d.ts + style.css) and exposes three entries: `he-math-editor`, `he-math-editor/full` (bundled MathJax, offline-ready), and `he-math-editor/style.css`.
- **Two-way LaTeX editing**: the LaTeX source area in the formula dialog is an editable textarea that stays in sync with the structured editing area.

## Quick Start

Requirements: Node.js 18+ (20+ recommended) and pnpm 10+ (the repo pins `packageManager: pnpm@12.15.0`).

```bash
pnpm install
pnpm dev          # demo site at http://localhost:3100
pnpm build:lib    # build the library only → packages/editor/dist-lib
pnpm build        # build library + demo (demo build includes type checking)
pnpm preview      # preview the demo production build
```

The demo uses lightweight hash routing (no vue-router):

- `/` or `#/`: HeMdEditor split editor (home)
- `#/input`: custom formula input prototype (keyboard digits and symbols)
- `#/viewer`: HeMdViewer read-only demo
- `#/wysiwyg`: HeMdWysiwyg placeholder (component not implemented yet)

> The dev server listens on `0.0.0.0:3100` and is accessible on your LAN.

## Toolbar Support

Every toolbar button's support status, supported fraction and script formats, and the support update log are maintained in [TOOLBAR.md](TOOLBAR.md). Update that file whenever toolbar support changes.

## Project Structure

```text
heMathEditor/                       # pnpm monorepo
├─ packages/
│  └─ editor/                       # core library he-math-editor (published to npm)
│     ├─ public/mathjax/tex-svg.js  # local MathJax 3.2.2 (shared by the full entry and demo)
│     ├─ src/
│     │  ├─ assets/fonts/katex/     # KaTeX_Main / KaTeX_Math font files
│     │  ├─ core/
│     │  │  ├─ formula/parser.ts    # Single source of truth for formula parsing
│     │  │  └─ renderer/index.ts    # markdown-it + math rules + syntax highlighting
│     │  ├─ components/
│     │  │  ├─ HeMdEditor.vue       # Split Markdown editor (toolbar + preview + formula dialog)
│     │  │  ├─ HeMdViewer.vue       # Read-only Markdown + formula renderer
│     │  │  ├─ HeFormulaDialog.vue  # Formula dialog container (overlay + header/footer)
│     │  │  ├─ HeFormulaEditor.vue  # Formula editor UI (toolbar + editable formula + preview)
│     │  │  ├─ HeMathInput.vue      # MathLive input field
│     │  │  └─ HeMathPreview.vue    # MathJax formula preview
│     │  ├─ editor/
│     │  │  ├─ formulaAtom.ts       # CodeMirror atomic formula extension
│     │  │  └─ mdCommands.ts        # Markdown toolbar commands
│     │  ├─ i18n/                   # Library-side component messages (vue-i18n + zh-CN / en-US)
│     │  ├─ styles/
│     │  │  ├─ global.scss          # Library global styles (bundled into dist-lib/style.css)
│     │  │  ├─ markdown-body.scss   # Shared Markdown typography and highlight theme
│     │  │  └─ math-font.scss       # HeMathFont: KaTeX_Main + KaTeX_Math
│     │  ├─ utils/mathjax.ts        # MathJax singleton service (lazy load + queue + configurable source)
│     │  ├─ viewer/index.ts         # Reserved lean viewer entry
│     │  ├─ full.ts                 # he-math-editor/full entry: bundled MathJax, offline-ready
│     │  └─ index.ts                # Library main entry (components + commands + core + services + i18n + plugin install)
│     ├─ vite.lib.config.ts         # Library-mode build (dist-lib + d.ts + style.css)
│     └─ LICENSE                    # AGPL-3.0 / commercial dual licensing
├─ apps/
│  └─ demo/                         # Demo site @hemath/demo
│     ├─ src/
│     │  ├─ pages/                  # EditorPage / InputPage / ViewerPage / WysiwygPage
│     │  ├─ i18n/                   # Demo-only messages (nav, page copy) merged into the library i18n
│     │  ├─ styles/                 # demo.scss / index.scss
│     │  ├─ App.vue                 # App shell: top navigation + hash routing
│     │  └─ main.ts                 # app.use(HeMathEditor) full install
│     └─ vite.config.ts             # alias straight to the library source (cross-package HMR); reuses the library public dir
├─ pnpm-workspace.yaml
├─ TOOLBAR.md / CHANGELOG.md / README*.md
└─ package.json                     # Monorepo root scripts (dev / build / build:lib / preview)
```

## Using the npm Package

```bash
pnpm add he-math-editor
# Offline scenario: just import from the full entry, no extra setup
```

```ts
// Full install (recommended): installs the bundled i18n and registers all components
import HeMathEditor from 'he-math-editor'
import 'he-math-editor/style.css'
app.use(HeMathEditor)

// On-demand imports (tree-shakeable)
import { HeMdEditor, HeFormulaDialog } from 'he-math-editor'

// Offline environments (bundled MathJax, no CDN dependency)
import HeMathEditor from 'he-math-editor/full'
```

- Entries: `he-math-editor` (default; MathJax loads from the npmmirror CDN in production), `he-math-editor/full` (bundled MathJax 3.2.2, offline-ready), and `he-math-editor/style.css` (global styles: math fonts + Markdown typography + MathLive keyboard layering).
- `vue` and `vue-i18n` are peerDependencies provided by the host app; other dependencies (CodeMirror, markdown-it, mathlive, highlight.js) resolve automatically on install.
- MathJax script source priority: `mathJaxService.configure({ source })` (self-hosted / private CDN) > the bundled resource of the `full` entry > the default strategy (local `public/mathjax` in dev, npmmirror CDN in production).

## Components

### HeMdEditor

Markdown editor with a built-in toolbar, atomic formulas, and an optional live preview pane.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | Markdown source; supports `v-model` |
| `preview` | `boolean` | `true` | Show the live preview pane |
| `placeholder` | `string` | `''` | Editor placeholder |

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | Emitted when the content changes |

| Exposed method | Description |
| --- | --- |
| `focus()` | Focus the editor |
| `insertText(text: string)` | Insert text at the cursor |
| `getValue(): string` | Get the current Markdown source |

```vue
<template>
  <HeMdEditor v-model="md" preview />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HeMdEditor } from 'he-math-editor'

const md = ref('Inline formula $E=mc^2$, display formula:\n\n$$\n\\int_a^b f(x)\\,dx\n$$')
</script>
```

### HeMdViewer

Read-only renderer for Markdown returned by a backend. It contains no editor, toolbar, or formula input.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `markdown` | `string` | `''` | Markdown source; supports `$...$` / `$$...$$` |
| `emptyText` | `string` | `''` | Placeholder text when the content is empty |

```vue
<script setup lang="ts">
import { HeMdViewer } from 'he-math-editor'

const markdown = '## Title\n\nInline formula $a^2+b^2=c^2$'
</script>

<template>
  <HeMdViewer :markdown="markdown" empty-text="No content" />
</template>
```

> `HeMdViewer` is exported from the main entry; `packages/editor/src/viewer` is a reserved lean subpath entry (not yet registered in `exports`).

### HeFormulaDialog

Modal container for formula editing. It only controls the overlay, title, footer buttons, and open state; the actual editor content is provided by `HeFormulaEditor`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | - | Whether the dialog is open; supports `v-model` |
| `latex` | `string` | `''` | Initial text (LaTeX or Unicode math text) |
| `display` | `boolean` | `true` | Whether the initial formula is display mode (checked by default) |
| `title` | `string` | `t('formula.dialogTitle')` | Dialog title |
| `confirmText` | `string` | `t('common.confirm')` | Confirm button label |
| `cancelText` | `string` | `t('common.cancel')` | Cancel button label |

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `(visible: boolean)` | Dialog visibility changed |
| `confirm` | `(latex: string, display: boolean)` | Emitted on confirm with the edited text and display flag |

```vue
<HeFormulaDialog
  v-model="visible"
  :latex="latex"
  :display="display"
  @confirm="(tex, isDisplay) => { latex = tex; display = isDisplay }"
/>
```

### HeFormulaEditor

The formula editing UI. It is used inside `HeFormulaDialog` and is also rendered directly by the `#/input` demo page.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | Formula text; supports `v-model` |
| `display` | `boolean` | `true` | Display mode flag (display formula checked by default); supports `v-model:display` |
| `placeholder` | `string` | `t('formula.placeholder')` | Input placeholder |

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | Formula text changed |
| `update:display` | `(display: boolean)` | Display mode changed |

| Exposed method | Description |
| --- | --- |
| `focus()` | Focus the input |
| `validate(): boolean` | Validate non-empty input and show an inline error |
| `clear()` | Clear the input and focus |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { HeFormulaEditor } from 'he-math-editor'

const formula = ref('a+b=12×3')
const display = ref(false)
</script>

<template>
  <HeFormulaEditor v-model="formula" v-model:display="display" />
</template>
```

### HeMathInput

MathLive formula input bound to a LaTeX string via `v-model`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | LaTeX source |

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | Emitted when the input changes |

Exposed methods: `focus()`, `insert(latex: string)`, `getValue(): string`.

### HeMathPreview

MathJax formula preview component.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `latex` | `string` | `''` | LaTeX to render |
| `display` | `boolean` | `false` | Render as display math (`\[...\]`) when `true`, otherwise inline (`\(...\)`) |

### Utilities

```ts
import { mathJaxService, renderTex, formulaAtom, scanFormulas, renderMarkdownInto } from 'he-math-editor'
import type { FormulaRef, FormulaEditHandler, FormulaMatch } from 'he-math-editor'

// Typeset \(...\) / \[...\] inside any DOM element (queued until MathJax is ready)
await mathJaxService.renderElement(el)

// Whether MathJax has loaded
mathJaxService.isMathJaxLoaded()

// Convert <span class="latex">...</span> to MathJax inline delimiters
const html = renderTex('<span class="latex">x^2</span>')

// Add the atomic formula extension to CodeMirror
const extension = formulaAtom((formula: FormulaRef) => {
  // formula: { from, to, latex, display }
})

// Scan Markdown for formulas (from/to include delimiters)
const formulas: FormulaMatch[] = scanFormulas(markdown)

// Render Markdown into an element and typeset its formulas with MathJax
await renderMarkdownInto(el, markdown)
```

## Formula Syntax

- Inline: `$...$`, single line only.
- Display: `$$...$$`, may span multiple lines.
- For inline formulas, no whitespace is allowed immediately after the opening `$` or before the closing `$`.
- For display formulas, newlines and surrounding whitespace are allowed; the LaTeX is trimmed.
- `\$` is treated as an escaped dollar sign and does not participate in pairing.
- Dollar signs inside fenced code blocks, indented code blocks, and inline code are not treated as formulas.

Example:

```markdown
Mass-energy equivalence: $E=mc^2$.

$$
\int_a^b f(x)\,dx = F(b)-F(a)
$$
```

## Implementation Notes

### Atomic formulas

[formulaAtom.ts](packages/editor/src/editor/formulaAtom.ts) scans the document in CodeMirror and replaces formulas with a single label using `Decoration.replace` and a custom `WidgetType`:

- `EditorView.atomicRanges` makes the cursor skip formulas and deletes them as a whole.
- Decorations are provided by a `StateField`; block decorations for multi-line formulas cannot come from a `ViewPlugin`.
- Multi-line formulas use block replacement decorations.
- Labels are typeset with MathJax; clicking one triggers a `mousedown` handler that returns a `FormulaRef` and opens the dialog.
- The syntax tree is used to skip code regions.

The parsing rules live in [parser.ts](packages/editor/src/core/formula/parser.ts); both the editor and the Markdown renderer use the same implementation.

### Preview rendering

[renderer/index.ts](packages/editor/src/core/renderer/index.ts) provides a shared `markdownRenderer` and `renderMarkdownInto`. It renders Markdown with markdown-it, registers math rules that emit explicit `\(...\)` / `\[...\]` delimiters, and then typesets them with MathJax. Raw `$` characters are never passed directly to MathJax, avoiding accidental pairing.

### Syntax highlighting

Fenced code blocks are highlighted by highlight.js through markdown-it's `highlight` option. The core build is used with only the required languages registered:

- Registered: `bash`, `css`, `java`, `javascript`, `json`, `markdown`, `python`, `sql`, `typescript`, `xml` (including common aliases such as `ts`, `js`, and `html`).
- Unknown or missing languages return an empty string, so markdown-it escapes the code as plain text.
- Theme colors are defined by the `.hljs-*` rules in [markdown-body.scss](packages/editor/src/styles/markdown-body.scss); no external highlight.js CSS is required.

### Read-only viewer

`HeMdViewer` only calls `renderMarkdownInto` and does not import CodeMirror or MathLive. Its container uses `.he-markdown-body` and shares [markdown-body.scss](packages/editor/src/styles/markdown-body.scss) with the editor preview, keeping both modes visually consistent.

### Formula editor UI split

`HeFormulaDialog` is now only the modal container. The editing UI lives in [HeFormulaEditor.vue](packages/editor/src/components/HeFormulaEditor.vue), which is shared by the dialog and the `#/input` page:

- `HeFormulaEditor` shows three sections: the raw LaTeX source, a custom editable rendered formula, and a read-only MathJax preview.
- **The LaTeX source area is an editable textarea**: typing in it rebuilds the structured editing area below in real time, and edits in the structured area are written back to the source box — the two stay in sync (an internal `lastSerialized` guard prevents re-render loops).
- The editable area uses contenteditable text slots inside fraction / script containers. `\frac{...}{...}`, `\tfrac{...}{...}`, the skewed form, and `^{...}` / `_{...}` are rendered as structural nodes with editable numerator, denominator, superscript and subscript; clicking a slot places the caret directly in the rendered part, so users do not need to edit the LaTeX source.
- Fraction and script parsing is recursive: numerators, denominators, superscripts and subscripts can contain further fractions or scripts. Inserting a vertical fraction or script while the caret is nested creates a new nested structure, so continued fractions can be written by repeating the same insertion.
- A numerator or denominator can mix plain text (such as an integer) with nested fractions. In a numerator, pressing `←` / `→` at a nested fraction's boundary creates a text slot at that level, and clicking the blank area of a numerator/denominator focuses or creates a same-level text slot instead of entering the nested fraction.
- Keyboard navigation: from outside, each formula is treated as one atomic object. `ArrowLeft` / `ArrowRight` across a formula skips the whole formula instead of entering it; click inside the formula to edit its parts. Once inside, `ArrowDown` / `ArrowRight` at the end of the numerator moves into the denominator, `ArrowUp` / `ArrowLeft` at the start of the denominator moves back into the numerator, `ArrowDown` in a superscript moves into the subscript and `ArrowUp` in a subscript returns to the superscript, and the outer boundaries leave the fraction/script and create or enter the text slot before/after it, so expressions such as `\frac{a}{b}+c` can be typed without nesting `+c` inside a slot.
- A structural fraction or script is not directly editable as a node, so it is deleted with `Backspace` at the start of the numerator / superscript / subscript, `Delete` at the end of the denominator / superscript / subscript, or `Backspace` / `Delete` from the adjacent text slot; the caret stays in the neighbouring text slot.
- Clicking the blank area of the editable box places the caret according to the click position: left of the fraction goes to a text slot before it, right of the fraction goes to a text slot after it, clicking the fraction itself focuses the numerator, and clicking a script focuses its superscript.
- The fraction picker's first row is 分数（竖式）`\frac`, 分数（横式）`a/b`, 分数（斜式）`{}^{a}\!/\!_{b}`, and 分数（小型分数）`\tfrac`; the vertical, skewed, small and common fractions are inserted structurally and select the numerator. Continued fractions are no longer a separate card: nest vertical fractions to build them.
- The script picker's first row is superscript `x^{}`, subscript `x_{}`, sub+superscript `x_{}^{}`, and prescript `{}_{}^{}x`, followed by common templates `x_{y^2}`, `e^{-iωt}`, `x^2`, and `{}_{1}^{n}Y`; inserting focuses the corresponding script slot.
- The `分数` and `上下标` toolbar buttons are wired to their pickers; the remaining buttons (symbols Ω, radical, integral, large operators, brackets, functions, derivative, limits/log, operators, matrix) are still placeholders.
- `HeFormulaDialog` only handles the overlay, title, footer buttons, and open state.
- `#/input` renders `HeFormulaEditor` directly, without a dialog wrapper.
- `*`, `-`, and `/` are mapped to `×`, `−`, and `÷`.
- Current limitation: `\frac`, `\tfrac`, the skewed form `{}^{a}\!/\!_{b}`, and scripts `^` / `_` are structural. `\cfrac` / `\dfrac` and other unsupported LaTeX commands remain text in the editable area, while the preview renders them correctly.
- `HeMathInput` (MathLive) remains available for the inline input demo but is no longer used by the formula dialog.

### Internationalization

UI strings are managed by vue-i18n in Composition API mode; the library and the demo each own their messages:

- [i18n/index.ts](packages/editor/src/i18n/index.ts) creates the i18n instance, resolves the initial locale from `localStorage` (`hemath-editor:locale`) or `DEFAULT_LOCALE` (`zh-CN`), and exposes `getLocale`, `setLocale`, and `toggleLocale`. It ships with the package.
- Library messages (common / formula / markdown) live in [packages/editor/src/i18n/locales](packages/editor/src/i18n/locales/zh-CN.ts); demo messages (navigation, page copy) live in `apps/demo/src/i18n/locales` and are merged into the same instance at startup via `mergeLocaleMessage`. Keep both locales in sync on either side.
- The top navigation renders a language button (`EN` / `中文`); switching updates `document.documentElement.lang`, the page title, and every component using `useI18n()`.
- To add a language: add a message bundle, extend `SUPPORTED_LOCALES` and `isAppLocale` in the library i18n, and adapt the nav language control (the current button toggles between the two built-in locales).
- Components must not hard-code user-facing text; use `t('...')` in templates, computed values, and imperative DOM creation (`aria-label`s are refreshed on locale change).

### MathJax service

[mathjax.ts](packages/editor/src/utils/mathjax.ts) maintains a singleton:

- The script is lazy-loaded and injected on first render; configuration must be written before the script loads.
- Script source priority: `mathJaxService.configure({ source })` (self-hosted / private CDN) > the `he-math-editor/full` entry (bundled tex-svg.js, offline-ready) > the default strategy (local `public/mathjax` in dev, npmmirror CDN in production).
- Auto-typesetting is disabled (`startup.typeset: false`); each element is processed with `typesetClear` + `typesetPromise`.
- Render requests made before MathJax loads are queued and flushed on load; if the host app already loaded a full MathJax, it is reused directly.
- `\oiint` / `\oiiint` macros are implemented by overlaying `◯` on `∬` / `∭`.

## License

This project is dual-licensed under **AGPL-3.0 / Commercial** (see [packages/editor/LICENSE](packages/editor/LICENSE)):

- Open source use: follow `AGPL-3.0-or-later` and release your project source under a compatible license.
- Closed-source commercial use: purchase a commercial license (contact <350839123@qq.com>) to remove the AGPL copyleft obligations.
- Third-party dependencies (Vue, CodeMirror, MathJax, MathLive, markdown-it) remain under their own licenses.

## Tech Stack

| Category | Choice |
| --- | --- |
| Framework | Vue 3.5 (`<script setup>` + TypeScript) |
| Build | Vite 6 + pnpm workspace (monorepo) |
| Package manager | pnpm 12 (version pinned via `packageManager`) |
| Editor core | CodeMirror 6 (`@codemirror/*`) |
| Markdown | markdown-it 14 + highlight.js 11 |
| Formula input | Custom KaTeX input (`HeFormulaEditor`) + MathLive 0.100 (`HeMathInput`, inline demo only) |
| Formula rendering | MathJax 3.2.2 (`tex-svg.js`, configurable source / bundled offline) |
| i18n | vue-i18n 11 (`Composition API`, zh-CN / en-US) |
| Math fonts | KaTeX_Main / KaTeX_Math (copied from MathLive 0.100.0) |
| Styles | SCSS (sass) |
| License | AGPL-3.0 / commercial dual licensing |

## Development Conventions

- Use **tabs** for indentation, `<script setup lang="ts">` for components, and `scoped` styles.
- The monorepo uses **pnpm workspace**: root scripts are `pnpm dev` / `pnpm build` / `pnpm build:lib` / `pnpm preview`; npm is no longer used and `package-lock.json` has been removed.
- Path aliases: inside the demo `@` points to `apps/demo/src`, and a vite alias maps `he-math-editor` straight to `packages/editor/src/index.ts` (cross-package HMR); inside the library use relative imports only, never `@`.
- MathLive's `<math-field>` must remain a native custom element; both the demo and library build configs allow it via `isCustomElement`.
- There is no automated test suite; run `pnpm build` before committing to verify types and the production build.
- Markdown typography is maintained in `packages/editor/src/styles/markdown-body.scss` and shared by the editor preview and `HeMdViewer`.
- KaTeX font files live in `packages/editor/src/assets/fonts/katex/` and are copied from `mathlive@0.100.0`; keep the font license notice when redistributing.
- The editing UI lives in `packages/editor/src/components/HeFormulaEditor.vue`; `InputPage.vue` is only a thin page that renders it. Do not extract a separate keyboard-input component.
- `HeFormulaDialog` must stay a pure container; keep editing logic in `HeFormulaEditor`.
- The demo uses lightweight hash routing (`apps/demo/src/App.vue`); pages live in `apps/demo/src/pages`, shared demo styles in `apps/demo/src/styles/demo.scss`; the demo does not keep its own MathJax copy — it reuses `packages/editor/public`.
- All user-facing text must go through `t()`: library component messages go to `packages/editor/src/i18n/locales`, demo messages to `apps/demo/src/i18n/locales`, keeping zh-CN / en-US in sync in the same change.
- Toolbar changes must update [TOOLBAR.md](TOOLBAR.md) (support matrix + update log) together with the changelog.
- AI/collaborator context (Chinese): [README.ai.md](README.ai.md).
- Version history: [CHANGELOG.md](CHANGELOG.md). **Every code commit must update the changelog.**

## Git Workflow

Choose a branch strategy based on risk:

| Scenario | Approach |
| --- | --- |
| Docs, comments, small bug fixes (1–2 files, low risk) | Commit directly to `master` |
| New features, refactors, cross-file or interaction changes | Create a `feat/*` branch |
| Preparing a release (version + changelog) | `release/x.y.z` branch + tag |
| Urgent fix after a release | `hotfix/*` branch |

Standard flow:

```bash
git checkout master
git pull --rebase
git checkout -b feat/xxx

# make changes; update CHANGELOG.md and TOOLBAR.md when toolbar support changes
pnpm build        # demo build includes vue-tsc type checking

git add <files>
git commit -m "feat: ..."
git push -u origin feat/xxx
```

Merge and clean up:

```bash
git checkout master
git merge --no-ff feat/xxx
git push
git branch -d feat/xxx
```

- Local merge is recommended for this repository: a single `git push` updates both Gitee and GitHub.
- To use a Gitee MR / GitHub PR instead, merge in the web UI, then pull locally and push again so the other remote stays in sync.
- Branch from the latest `master`, keep branches short-lived, and delete them after merging.
- Use `feat/`, `fix/`, `docs/`, and `refactor/` prefixes.

## Repositories

- GitHub: <https://github.com/hhk94/he-math-editor>
- Gitee: <https://gitee.com/hkchina/he-math-editor>
