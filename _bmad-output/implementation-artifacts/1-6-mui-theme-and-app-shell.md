# Story 1.6: MUI Theme and App Shell

Status: done

## Story

As a manager,
I want to open the application and see a clean navigation shell with sections for Employees, Framework, and Settings,
so that I can orient myself and navigate to any area of the tool immediately.

## Acceptance Criteria

1. `src/renderer/src/theme/theme.ts` is applied via MUI `ThemeProvider` in `App.tsx` — base palette active: background `#F5F7FA`, surface `#FFFFFF`, primary accent `#3B5BDB`, text primary `#1A1A2E`, text secondary `#6B7280`, border `#E5E7EB`. Competency chip colors and grade outcome colors are registered as custom tokens accessible via `theme.palette`.

2. `AppShell.tsx` renders a fixed left sidebar (~200px) alongside a `<main>` content area with max-width 960px — uses semantic HTML (`<nav>` for sidebar, `<main>` for content area).

3. The sidebar displays: app name "Employee Evaluation Tool", manager name placeholder "Manager", and three nav items: Employees, Framework, Settings.

4. Clicking a nav item renders the corresponding placeholder view in the content area; the active nav item shows a left border accent and background tint.

5. Zustand store `src/renderer/src/store/appStore.ts` — `currentView` typed as `'employees' | 'framework' | 'settings'`, defaults to `'employees'` on app start. Store also declares `selectedEmployeeId: number | null` and `selectedCompetency: Competency | null` (both null by default) for use by later epics.

## Tasks / Subtasks

- [x] Task 1: Create `src/renderer/src/theme/theme.ts` — MUI custom theme (AC: 1)
  - [x] Import `createTheme` from `@mui/material/styles`
  - [x] Augment MUI `Palette`/`PaletteOptions` interfaces via `declare module '@mui/material/styles'` to add `competency` and `grade` nested objects
  - [x] Define base palette: `background.default: '#F5F7FA'`, `background.paper: '#FFFFFF'`, `primary.main: '#3B5BDB'`, `text.primary: '#1A1A2E'`, `text.secondary: '#6B7280'`, `divider: '#E5E7EB'`
  - [x] Define `palette.competency`: `communication: '#4A90D9'`, `clientFocus: '#26A69A'`, `proactivity: '#FB8C00'`, `teamwork: '#7C3AED'`
  - [x] Define `palette.grade`: `exceedsExpectations: '#2E7D32'`, `meetsExpectations: '#1565C0'`, `doesNotMeetExpectations: '#C62828'`, `insufficientInput: '#E65100'`
  - [x] Export theme as default

- [x] Task 2: Create `src/renderer/src/store/appStore.ts` — Zustand store (AC: 5)
  - [x] Import `create` from `zustand` and `Competency` type from `'../../shared/ipc-types'`
  - [x] Define `View` type as `'employees' | 'framework' | 'settings'`
  - [x] Define `AppStore` interface: `currentView: View`, `selectedEmployeeId: number | null`, `selectedCompetency: Competency | null`, `setView(view: View): void`, `setEmployee(id: number | null): void`, `setCompetency(c: Competency | null): void`
  - [x] `setEmployee` must clear `selectedCompetency` (set to null) on every call — cross-epic invariant
  - [x] Export `useAppStore` as named export (consumed by all renderer components)

- [x] Task 3: Create `src/renderer/src/components/layout/Sidebar.tsx` (AC: 3, 4)
  - [x] Use MUI `Box` (as `"nav"`), `Typography`, `List`, `ListItemButton`, `ListItemText`
  - [x] Fixed width 200px; `bgcolor: 'background.paper'`; right border `1px solid` `divider`
  - [x] Render app title "Employee Evaluation Tool" (`variant="subtitle2"` `sx={{ fontWeight: 600 }}`)
  - [x] Render manager name "Manager" (`variant="caption"` `color="text.secondary"`) — hardcoded placeholder; Story 5.1 wires real value
  - [x] Nav items array: `[{ label: 'Employees', view: 'employees' }, { label: 'Framework', view: 'framework' }, { label: 'Settings', view: 'settings' }]`
  - [x] Each `ListItemButton` calls `setView(view)` on click, reads `currentView` from `useAppStore` for `selected` prop
  - [x] Active state styling — always reserve the 3px left border space to prevent text shift: `borderLeft: '3px solid transparent'` on default, `borderLeftColor: 'primary.main'` + `bgcolor: 'action.selected'` on `&.Mui-selected`

- [x] Task 4: Create `src/renderer/src/components/layout/AppShell.tsx` (AC: 2)
  - [x] Accept `children: React.ReactNode` prop
  - [x] Root: `Box` with `display: 'flex'`, `height: '100vh'`, `bgcolor: 'background.default'`
  - [x] Sidebar child: `<Sidebar />`
  - [x] Content child: `Box component="main"` with `flex: 1`, `overflow: 'auto'` — wrap children in inner `Box` with `maxWidth: 960`, `mx: 'auto'`, `p: 3`

- [x] Task 5: Create placeholder view files (AC: 4)
  - [x] `src/renderer/src/views/EmployeeList.tsx` — renders `<Typography variant="h6">Employees</Typography>` placeholder; exports default `EmployeeList`
  - [x] `src/renderer/src/views/Framework.tsx` — renders `<Typography variant="h6">Framework</Typography>` placeholder; exports default `Framework`
  - [x] `src/renderer/src/views/Settings.tsx` — renders `<Typography variant="h6">Settings</Typography>` placeholder; exports default `Settings`
  - [x] All import `Typography` from `@mui/material`

- [x] Task 6: Rewrite `src/renderer/src/App.tsx` — wire ThemeProvider + AppShell + routing (AC: 1, 2, 4)
  - [x] Removed all previous content (electron logo, `Versions` import, `electronLogo` import)
  - [x] Imports: `ThemeProvider`, `CssBaseline` from `@mui/material`; `theme` from `./theme/theme`; `AppShell` from `./components/layout/AppShell`; `useAppStore` from `./store/appStore`; `EmployeeList`, `Framework`, `Settings` from `./views/`
  - [x] Inline `ViewRouter` component reads `currentView` from `useAppStore` and renders the matching view
  - [x] `App` returns `<ThemeProvider theme={theme}><CssBaseline /><AppShell><ViewRouter /></AppShell></ThemeProvider>`
  - [x] `Versions.tsx` left in place (unused, not deleted)

- [x] Task 7: Update `src/renderer/src/main.tsx` — remove template CSS (AC: 1)
  - [x] Removed `import './assets/main.css'`
  - [x] `StrictMode` wrapper and `createRoot` unchanged

- [x] Task 8: Create `__tests__/renderer/store/appStore.test.ts` — Zustand store unit test (AC: 5)
  - [x] Imports `describe`, `it`, `expect`, `beforeEach` from `vitest`; imports `useAppStore`
  - [x] `beforeEach` resets store state
  - [x] Tests: initial `currentView` is `'employees'`; `setView` works for all three views; `setEmployee` sets id AND clears competency; `setCompetency` updates correctly; all 8 assertions pass

- [x] Task 9: Typecheck and test (AC: 1–5)
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors (1 fix: `fontWeight` moved to `sx` prop per MUI v9)
  - [x] `npm run test` — 13/13 pass (5 MockAIProvider + 8 appStore), zero regressions

## Dev Notes

### CRITICAL: Current State of `App.tsx` — Full Replacement Required

Story 1.5 stripped `window.electron` usage from `App.tsx` but left the placeholder UI intact. Current `App.tsx`:

```tsx
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): React.JSX.Element {
  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      ...
      <Versions></Versions>
    </>
  )
}
```

**Replace the entire file.** Do not preserve any of this content.

### CRITICAL: MUI Palette Augmentation — Must Use `declare module`

Custom palette tokens (`competency`, `grade`) require TypeScript module augmentation to be type-safe. Both blocks must be in `theme.ts`:

```ts
import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    competency: {
      communication: string
      clientFocus: string
      proactivity: string
      teamwork: string
    }
    grade: {
      exceedsExpectations: string
      meetsExpectations: string
      doesNotMeetExpectations: string
      insufficientInput: string
    }
  }
  interface PaletteOptions {
    competency?: {
      communication: string
      clientFocus: string
      proactivity: string
      teamwork: string
    }
    grade?: {
      exceedsExpectations: string
      meetsExpectations: string
      doesNotMeetExpectations: string
      insufficientInput: string
    }
  }
}

const theme = createTheme({
  palette: {
    background: { default: '#F5F7FA', paper: '#FFFFFF' },
    primary: { main: '#3B5BDB' },
    text: { primary: '#1A1A2E', secondary: '#6B7280' },
    divider: '#E5E7EB',
    competency: {
      communication: '#4A90D9',
      clientFocus: '#26A69A',
      proactivity: '#FB8C00',
      teamwork: '#7C3AED',
    },
    grade: {
      exceedsExpectations: '#2E7D32',
      meetsExpectations: '#1565C0',
      doesNotMeetExpectations: '#C62828',
      insufficientInput: '#E65100',
    },
  },
})

export default theme
```

### CRITICAL: Zustand Import — Use Named `create`, Not Default

```ts
import { create } from 'zustand'   // ✅ correct
import create from 'zustand'       // ❌ wrong — zustand v5 removed default export
```

Check installed version: `zustand` was added in Story 1.1. The project uses the version from Story 1.1 `npm install`. Use named import regardless of version; it works for both v4 and v5.

### Sidebar — Active State Anti-Flicker Pattern

Using `borderLeft: '3px solid'` only on `.Mui-selected` causes the text to shift by 3px when selected. Always pre-allocate the border space:

```tsx
sx={{
  borderLeft: '3px solid transparent',  // pre-allocate — prevents text shift
  '&.Mui-selected': {
    borderLeftColor: 'primary.main',
    bgcolor: 'action.selected',
  },
  '&.Mui-selected:hover': {
    bgcolor: 'action.selected',
  },
}}
```

### AppShell — Exact Layout Structure

```tsx
// AppShell.tsx
import { Box } from '@mui/material'
import Sidebar from './Sidebar'

interface Props { children: React.ReactNode }

export default function AppShell({ children }: Props): React.JSX.Element {
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flex: 1, overflow: 'auto' }}
      >
        <Box sx={{ maxWidth: 960, mx: 'auto', p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
```

The inner `Box` (maxWidth + mx: 'auto') is what centers content on wide screens. Do not put `maxWidth` directly on the `component="main"` box — it needs `flex: 1` to fill all remaining space.

### App.tsx — Exact New Implementation

```tsx
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme/theme'
import AppShell from './components/layout/AppShell'
import { useAppStore } from './store/appStore'
import EmployeeList from './views/EmployeeList'
import Framework from './views/Framework'
import Settings from './views/Settings'

function ViewRouter(): React.JSX.Element {
  const currentView = useAppStore((s) => s.currentView)
  if (currentView === 'framework') return <Framework />
  if (currentView === 'settings') return <Settings />
  return <EmployeeList />
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell>
        <ViewRouter />
      </AppShell>
    </ThemeProvider>
  )
}

export default App
```

`ViewRouter` is a private function component inside `App.tsx` — do not extract it to its own file for this story.

### Zustand Store — setEmployee Must Clear Competency

Architecture decision (architecture.md#Frontend Architecture): "competency selection resets when a different employee is selected." This invariant lives in `setEmployee`:

```ts
setEmployee: (id) => set({ selectedEmployeeId: id, selectedCompetency: null }),
```

Never `set({ selectedEmployeeId: id })` alone — that breaks the cross-epic invariant.

### What This Story Does NOT Do

- Does NOT implement real data in placeholder views — `EmployeeList.tsx`, `Framework.tsx`, `Settings.tsx` are stubs only
- Does NOT wire the manager name from settings — "Manager" is hardcoded in `Sidebar.tsx` until Story 5.1
- Does NOT create `useFramework.ts`, `useEmployees.ts`, or any other hooks — Epic 2+
- Does NOT implement `CompetencyChip`, `InlineLogRow`, `GradeResultCard` — Epic 4/6 components
- Does NOT touch any main process files — this story is renderer-only
- Does NOT set minimum window size in `BrowserWindow` — UX-DR6 (1024×600px minimum) is a BrowserWindow option; handle in Story 6.6 packaging if needed

### Dependencies Verification

From Story 1.1 `package.json`, confirm these are installed before implementing:
- `@mui/material` — ThemeProvider, CssBaseline, Box, Typography, List, ListItemButton, ListItemText
- `@emotion/react`, `@emotion/styled` — required peer deps for MUI
- `zustand` — `create` named export

If typecheck fails with missing module errors, run `npm install` from `sdd-app/` first.

### Typecheck Commands (from Story 1.5 pattern)

Run from `sdd-app/` directory:
```bash
npx tsc --noEmit -p tsconfig.web.json --composite false   # renderer only
npm run test                                               # all tests
```

Do NOT run `tsconfig.node.json` check for this story — this story touches renderer only.

### Previous Story Pattern — electron-log NOT used in renderer

Story 1.5 established: `electron-log/main` is imported only in main process handlers. Do NOT import `electron-log` in any renderer file. Use `console.warn` for renderer-side debug output if needed (not production code).

### Previous Story Pattern — No Direct Electron Imports in Renderer

Architecture enforcement (architecture.md#Enforcement Guidelines): "Never import from `electron` in `src/renderer/`". `Sidebar.tsx`, `AppShell.tsx`, and all view placeholders must not import from `electron`. All IPC goes through `window.electronAPI` (via hooks, not yet implemented in this story).

### Project Structure Notes

**Renderer source root:** `sdd-app/src/renderer/src/` — the `src/` subdir inside `src/renderer/` is where all renderer TypeScript lives (electron-vite convention).

**New directories to create:**
- `sdd-app/src/renderer/src/theme/`
- `sdd-app/src/renderer/src/store/`
- `sdd-app/src/renderer/src/components/layout/`
- `sdd-app/src/renderer/src/views/`
- `sdd-app/__tests__/renderer/store/`

**New files:**
- `sdd-app/src/renderer/src/theme/theme.ts`
- `sdd-app/src/renderer/src/store/appStore.ts`
- `sdd-app/src/renderer/src/components/layout/Sidebar.tsx`
- `sdd-app/src/renderer/src/components/layout/AppShell.tsx`
- `sdd-app/src/renderer/src/views/EmployeeList.tsx`
- `sdd-app/src/renderer/src/views/Framework.tsx`
- `sdd-app/src/renderer/src/views/Settings.tsx`
- `sdd-app/__tests__/renderer/store/appStore.test.ts`

**Modified files:**
- `sdd-app/src/renderer/src/App.tsx` (full replacement)
- `sdd-app/src/renderer/src/main.tsx` (remove `import './assets/main.css'`)

**Untouched — do NOT modify:**
- `sdd-app/src/renderer/src/env.d.ts` — `window.electronAPI` typing from Story 1.2; still correct
- `sdd-app/src/shared/ipc-types.ts` — IPC types from Story 1.2; `Competency` type imported by `appStore.ts`
- `sdd-app/src/main/` — all main process files
- `sdd-app/src/preload/` — contextBridge from Story 1.5
- `sdd-app/src/renderer/src/components/Versions.tsx` — becomes unused but do NOT delete

### References

- [epics.md#Story 1.6] — acceptance criteria source
- [architecture.md#Frontend Architecture] — Zustand store shape, `AppStore` interface definition, `currentView` enum
- [architecture.md#Implementation Patterns — Naming Patterns] — file naming (`PascalCase.tsx` for components, `camelCase.ts` for stores/hooks)
- [architecture.md#Project Structure — Complete Directory Structure] — `theme/`, `store/`, `components/layout/`, `views/` paths
- [architecture.md#Enforcement Guidelines] — "never import from electron in src/renderer/"
- [ux-design-specification.md#Visual Design Foundation] — color system with all hex values
- [ux-design-specification.md#Component Strategy] — Sidebar fixed 200px, AppShell semantic `<nav>`/`<main>`
- [ux-design-specification.md#Design System Foundation] — MUI free tier, `sx` prop usage, no inline styles
- [1-5-wire-contextbridge-preload-and-ipc-handler-scaffold.md#Dev Notes] — typecheck commands, renderer source root, `window.electronAPI` pattern
- [architecture.md#Core Architectural Decisions — Frontend Architecture] — "No router. Sidebar navigation driven by `currentView` enum in Zustand"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- MUI v9 breaking change: `fontWeight` is not a direct prop on `Typography` — must use `sx={{ fontWeight: 600 }}`. Fixed in `Sidebar.tsx` after first typecheck run.

### Completion Notes List

- Created `sdd-app/src/renderer/src/theme/theme.ts`: MUI v9 custom theme with `declare module` palette augmentation for `competency` (4 colors) and `grade` (4 colors) tokens; base palette matches UX spec exactly.
- Created `sdd-app/src/renderer/src/store/appStore.ts`: Zustand v5 store with `currentView`, `selectedEmployeeId`, `selectedCompetency`; `setEmployee` clears `selectedCompetency` — cross-epic invariant enforced.
- Created `sdd-app/src/renderer/src/components/layout/Sidebar.tsx`: fixed 200px nav with anti-flicker border pattern, three nav items, active state via `selected` prop + `Mui-selected` sx override.
- Created `sdd-app/src/renderer/src/components/layout/AppShell.tsx`: flex layout, semantic `<nav>` (via Sidebar) and `<main>`, inner content box capped at `maxWidth: 960` with `mx: 'auto'`.
- Created `sdd-app/src/renderer/src/views/EmployeeList.tsx`, `Framework.tsx`, `Settings.tsx`: minimal Typography placeholders.
- Rewrote `sdd-app/src/renderer/src/App.tsx`: ThemeProvider → CssBaseline → AppShell → ViewRouter; all electron-vite template content removed.
- Updated `sdd-app/src/renderer/src/main.tsx`: removed dead `import './assets/main.css'`.
- Created `sdd-app/__tests__/renderer/store/appStore.test.ts`: 8 assertions covering initial state, all three setters, and the `setEmployee` → competency-clear invariant.
- Typecheck: zero errors (`tsconfig.web.json`). Tests: 13/13 pass (5 pre-existing + 8 new), zero regressions.

### File List

- `sdd-app/src/renderer/src/theme/theme.ts` (created)
- `sdd-app/src/renderer/src/store/appStore.ts` (created)
- `sdd-app/src/renderer/src/components/layout/Sidebar.tsx` (created)
- `sdd-app/src/renderer/src/components/layout/AppShell.tsx` (created)
- `sdd-app/src/renderer/src/views/EmployeeList.tsx` (created)
- `sdd-app/src/renderer/src/views/Framework.tsx` (created)
- `sdd-app/src/renderer/src/views/Settings.tsx` (created)
- `sdd-app/__tests__/renderer/store/appStore.test.ts` (created)
- `sdd-app/src/renderer/src/App.tsx` (modified — full replacement)
- `sdd-app/src/renderer/src/main.tsx` (modified — removed main.css import)

### Review Findings

- [x] [Review][Defer] `setView` does not reset `selectedEmployeeId`/`selectedCompetency` on navigation [`sdd-app/src/renderer/src/store/appStore.ts:20`] — deferred, out of scope for Story 1.6; no AC requires view navigation to clear selection state; revisit if a future epic needs full state resets on nav
- [x] [Review][Defer] `body { user-select: none }` lost when `main.css` removed [`sdd-app/src/renderer/src/main.tsx`] — deferred, template CSS intentionally removed; Electron UX enhancement (preventing accidental text selection in UI) not in any Story 1.6 AC; address in a later UI polish story
