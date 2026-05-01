# Story 3.3: UX Polish — Framework Layout and App Shell Visual Alignment

Status: done

<!-- Polish pass applied after initial review feedback -->

## Story

As a manager,
I want the application to visually match the approved UX mockups,
so that the interface looks polished and professional, and the framework view is intuitive to navigate.

## Acceptance Criteria

1. **Framework view** (`Framework.tsx`): Layout redesigned from 4×4 table grid to per-competency card sections, matching mockup Screen 7:
   - Subtitle text present below the "Competency Framework" heading: _"Define the expected observable behaviors per competency and level. These are the standards used by the AI to assess employees."_
   - Each competency renders as a standalone card: white background, 8px border-radius, `#E5E7EB` border, 12px bottom margin
   - Card header: `#F9FAFB` background, `border-bottom`, left side = competency chip (colored outline style), right side = "X of 4 levels configured" in 12px gray text
   - Card body: 4 level rows (A/B/C/D), each row laid out as `flex` with: level badge | description text | action button(s)
   - Level badge: 28×28px, `#EEF2FF` background, `#3B5BDB` text, 6px border-radius, 12px/600 font
   - Display mode: description text (gray "not configured" when null) + small outlined "Edit" button (gray border/text, blue on hover)
   - Edit mode: row background `#F0F4FF`, textarea replaces description, "Save" text button (blue outlined, 40% opacity when draft empty) + ✕ cancel `IconButton`; `Escape` key cancels (UX-DR16); no success toast (UX-DR17)
   - All existing functionality preserved: `clearError()` on new edit start, error `Alert` above cards for save errors, load error replaces cards

2. **Sidebar** (`Sidebar.tsx`): Visual structure updated to match all mockup screens:
   - Logo area: app name "Employee Evaluation Tool" in `primary.main` (#3B5BDB), 13px, weight 600; manager name "Manager" in #9CA3AF, 11px, weight 400; `border-bottom: 1px solid #E5E7EB` separating logo area from nav
   - Nav items: each includes an icon + text label; padding `10px 16px`; active state = `#EEF2FF` background + `primary.main` text + 3px left border accent; icons: Employees → `'👥'`, Framework → `'📋'`, Settings → `'⚙️'` (emoji, matching mockup `.nav-icon` style — MUI SVG icons produce grayscale, emoji render in OS color per mockup intent)
   - Sidebar footer: `border-top: 1px solid #E5E7EB`, padding `12px 16px`, text "v1.0.0 · PoC", 11px, #9CA3AF

3. **Employee List** (`EmployeeList.tsx`): Page header and level badge updated to match mockup Screen 1:
   - "Employees" page title (20px, weight 600, `#1A1A2E`) always visible on the left of the page header
   - "+ Add Employee" button remains on the right of the same header row (for both empty and non-empty states)
   - When employees exist, level shown as a styled badge: 28×28px, `#EEF2FF` background, `#3B5BDB` text, 6px border-radius, 13px, weight 600
   - Empty state text/CTA centered below the header row (the header itself is unchanged)

4. TypeScript clean — zero errors on both config targets:
   - `npx tsc --noEmit -p tsconfig.node.json --composite false`
   - `npx tsc --noEmit -p tsconfig.web.json --composite false`
   - `npm run test` — all existing tests pass, zero regressions

## Tasks / Subtasks

- [x] Task 1: Redesign `Framework.tsx` layout (AC: 1)
  - [x] Replace Table/TableHead/TableBody structure with per-competency `Box` cards
  - [x] Add subtitle paragraph below page title
  - [x] Implement card header with competency chip and configured-count label
  - [x] Implement level rows (level badge + description text + action buttons)
  - [x] Wire edit mode into new layout (startEdit/cancelEdit/confirmSave logic unchanged)
  - [x] Change save action from `IconButton` ✓ to text `Button` "Save" (keep ✕ `IconButton` for cancel)
  - [x] Remove `Table`, `TableHead`, `TableBody`, `TableCell`, `TableRow` imports (no longer needed)

- [x] Task 2: Update `Sidebar.tsx` (AC: 2)
  - [x] Add `PeopleIcon`, `ListAltIcon`, `SettingsIcon` to `navItems` array
  - [x] Style logo area: blue app name, gray manager name, border-bottom
  - [x] Remove `p: 2` global padding; apply per-section padding (logo area, nav, footer)
  - [x] Implement sidebar footer with border-top

- [x] Task 3: Update `EmployeeList.tsx` (AC: 3)
  - [x] Add "Employees" `Typography` title into the page header for both empty and non-empty states
  - [x] Move `+ Add Employee` button to always be on the right of the header (remove the centered-button empty state layout)
  - [x] Replace `{emp.level}` plain text with a styled level badge `Box`

- [x] Task 4: Typecheck and full test suite (AC: 4)
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all tests pass (31/31)

### Polish Pass (post-review feedback)

- [x] Task 5: Fix MUI global defaults conflicting with mockup styling (`theme.ts`)
  - [x] Add system font stack (`-apple-system, Segoe UI, Roboto`) to `typography.fontFamily`
  - [x] Override `MuiButton` `textTransform: 'none'` globally (fixes uppercase on all buttons)
  - [x] Add `MuiTableHead` cell overrides: 11px/600/uppercase/`#9CA3AF`/`#F9FAFB` bg/0.6px letter-spacing

- [x] Task 6: Fix Sidebar icons — switch from MUI SVG icons to emoji matching mockup (`Sidebar.tsx`)
  - [x] Replace `PeopleIcon`/`ListAltIcon`/`SettingsIcon` with `'👥'`/`'📋'`/`'⚙️'` emoji strings
  - [x] Remove MUI icon imports; render emoji in a `Box` with `width:18, fontSize:15px` matching mockup `.nav-icon`

- [x] Task 7: Fix `EmployeeList.tsx` table header and employee name weight
  - [x] Remove `Typography variant="subtitle2"` wrappers from header cells (Typography overrides theme font-size; plain text lets theme apply 11px correctly)
  - [x] Add `sx={{ fontWeight: 500 }}` to employee name `TableCell`

- [x] Task 8: Fix content area width and padding (`AppShell.tsx`)
  - [x] Remove `maxWidth: 960` and `mx: 'auto'` — content fills available space, matching mockup
  - [x] Update padding from `p: 3` (24px all) to `px: 4, py: 3.5` (32px/28px matching mockup `padding: 28px 32px`)

- [x] Task 9: Verify typecheck and tests after polish pass
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npm run test` — 31/31 pass, zero regressions

## Dev Notes

### Scope Boundaries

**In scope (pure frontend visual changes):**
- `Framework.tsx` — full layout rework (logic layer untouched)
- `Sidebar.tsx` — icons, logo styling, footer
- `EmployeeList.tsx` — page header, level badge

**Out of scope (future stories):**
- "Last Entry" and "Log Entries" columns in the Employee List mockup — these require new DB queries (`JOIN` on `behavior_log_entries`) not yet in the schema or IPC contract. Deferred to Epic 4.
- Settings view — not yet implemented; addressed in Epic 5 stories.
- Employee sub-pages with tabs, breadcrumb, behavior log — addressed in Epic 4.

### Mockup Reference (Screen 7 — Framework)

The mockup uses **per-competency card sections**, not a grid table. Each competency section has:
```
[Card]
  [Header: bg #F9FAFB, border-bottom]
    [Chip: outlined, colored] Proactivity         [count: "4 levels configured"]
  [Body: px 20px, py 16px]
    [Row A] [level-badge: A] [text] [Edit btn]
    [Row B] [level-badge: B] [textarea ← editing] [Save btn] [✕ btn]
    [Row C] [level-badge: C] [text] [Edit btn]
    [Row D] [level-badge: D] [text] [Edit btn]
```

Edit mode highlights the active row with `#F0F4FF` background. The "Edit" button changes to a blue "Save" text button. The ✕ cancel `IconButton` is added to the right.

### Competency Chip Color Map

Used in Framework card headers. These match the mockup's outlined chip style:

```ts
const COMPETENCY_CHIP_STYLES: Record<string, { color: string; borderColor: string; bgcolor: string }> = {
  Communication:  { color: '#2563EB', borderColor: '#93C5FD', bgcolor: '#EFF6FF' },
  'Client Focus': { color: '#0D9488', borderColor: '#5EEAD4', bgcolor: '#F0FDFA' },
  Proactivity:    { color: '#D97706', borderColor: '#FCD34D', bgcolor: '#FFFBEB' },
  Teamwork:       { color: '#7C3AED', borderColor: '#C4B5FD', bgcolor: '#F5F3FF' },
}
```

Note: These chip colors differ slightly from `theme.palette.competency` (which defines fill/text colors for `CompetencyChip` toggles). These are the **outlined** read-only style as shown in the mockup. Do NOT change `theme.ts`.

### Task 1: `Framework.tsx` — Full Replacement

Remove imports: `Table`, `TableBody`, `TableCell`, `TableHead`, `TableRow`, `CheckIcon`.
Keep imports: `Alert`, `Box`, `Button`, `CircularProgress`, `IconButton`, `TextField`, `Typography`, `CloseIcon`.

All state and handler logic (`editingCell`, `draftText`, `startEdit`, `cancelEdit`, `confirmSave`) is **unchanged** — only the JSX render section changes.

```tsx
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import useFramework from '../hooks/useFramework'
import type { CompetencyLevel } from '../../../shared/ipc-types'

const LEVELS: CompetencyLevel[] = ['A', 'B', 'C', 'D']

type EditingCell = { competencyId: number; level: CompetencyLevel }

const COMPETENCY_CHIP_STYLES: Record<string, { color: string; borderColor: string; bgcolor: string }> = {
  Communication:  { color: '#2563EB', borderColor: '#93C5FD', bgcolor: '#EFF6FF' },
  'Client Focus': { color: '#0D9488', borderColor: '#5EEAD4', bgcolor: '#F0FDFA' },
  Proactivity:    { color: '#D97706', borderColor: '#FCD34D', bgcolor: '#FFFBEB' },
  Teamwork:       { color: '#7C3AED', borderColor: '#C4B5FD', bgcolor: '#F5F3FF' },
}

export default function Framework(): React.JSX.Element {
  const { competencies, behaviors, isLoading, error, load, clearError, saveBehavior } = useFramework()
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [draftText, setDraftText] = useState('')

  useEffect(() => {
    load()
  }, [load])

  const startEdit = (competencyId: number, level: CompetencyLevel, currentText: string | null) => {
    clearError()
    setEditingCell({ competencyId, level })
    setDraftText(currentText ?? '')
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setDraftText('')
  }

  const confirmSave = async (competencyId: number, level: CompetencyLevel) => {
    const success = await saveBehavior(competencyId, level, draftText.trim())
    if (success) {
      setEditingCell(null)
      setDraftText('')
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (competencies.length === 0 && error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#1A1A2E' }}>
        Competency Framework
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: -0.5 }}>
        Define the expected observable behaviors per competency and level. These are the standards used
        by the AI to assess employees.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}
      {competencies.map((comp) => {
        const chipStyle = COMPETENCY_CHIP_STYLES[comp.name] ?? {
          color: '#6B7280',
          borderColor: '#E5E7EB',
          bgcolor: '#F9FAFB',
        }
        const configuredCount = LEVELS.filter((l) => behaviors[comp.id]?.[l]).length

        return (
          <Box
            key={comp.id}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 1.5,
              overflow: 'hidden',
            }}
          >
            {/* Card header */}
            <Box
              sx={{
                px: 2.5,
                py: 1.75,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: '#F9FAFB',
              }}
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: '10px',
                  py: '2px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: chipStyle.borderColor,
                  bgcolor: chipStyle.bgcolor,
                  color: chipStyle.color,
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {comp.name}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {configuredCount} of 4 levels configured
              </Typography>
            </Box>

            {/* Card body */}
            <Box sx={{ px: 2.5, py: 2 }}>
              {LEVELS.map((level, idx) => {
                const description = behaviors[comp.id]?.[level] ?? null
                const isEditing =
                  editingCell?.competencyId === comp.id && editingCell?.level === level

                return (
                  <Box
                    key={level}
                    sx={{
                      display: 'flex',
                      gap: 1.75,
                      alignItems: 'flex-start',
                      mb: idx < LEVELS.length - 1 ? 1.75 : 0,
                      ...(isEditing && {
                        bgcolor: '#F0F4FF',
                        mx: -0.5,
                        px: 0.5,
                        py: 1,
                        borderRadius: '6px',
                      }),
                    }}
                  >
                    {/* Level badge */}
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        bgcolor: '#EEF2FF',
                        color: '#3B5BDB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        mt: '1px',
                      }}
                    >
                      {level}
                    </Box>

                    {/* Description or textarea */}
                    <Box sx={{ flex: 1 }}>
                      {isEditing ? (
                        <TextField
                          multiline
                          fullWidth
                          size="small"
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') cancelEdit()
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: description ? '#374151' : 'text.secondary',
                            lineHeight: 1.55,
                          }}
                        >
                          {description ?? '(not configured)'}
                        </Typography>
                      )}
                    </Box>

                    {/* Action buttons */}
                    {isEditing ? (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={!draftText.trim()}
                          onClick={() => confirmSave(comp.id, level)}
                          sx={{
                            flexShrink: 0,
                            mt: '2px',
                            fontSize: '12px',
                            px: 1.5,
                            py: 0.5,
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            fontWeight: 500,
                            opacity: draftText.trim() ? 1 : 0.4,
                          }}
                        >
                          Save
                        </Button>
                        <IconButton
                          size="small"
                          aria-label="Cancel edit"
                          onClick={cancelEdit}
                          sx={{ mt: '2px', flexShrink: 0 }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => startEdit(comp.id, level, description)}
                        sx={{
                          flexShrink: 0,
                          mt: '2px',
                          fontSize: '12px',
                          px: 1.5,
                          py: 0.5,
                          borderColor: '#E5E7EB',
                          color: '#6B7280',
                          '&:hover': {
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            bgcolor: 'transparent',
                          },
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </Box>
                )
              })}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
```

### Task 2: `Sidebar.tsx` — Full Replacement

```tsx
import { Box, List, ListItemButton, Typography } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import ListAltIcon from '@mui/icons-material/ListAlt'
import SettingsIcon from '@mui/icons-material/Settings'
import { useAppStore } from '../../store/appStore'

type NavItem = {
  label: string
  view: 'employees' | 'framework' | 'settings'
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Employees', view: 'employees', icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
  { label: 'Framework', view: 'framework', icon: <ListAltIcon sx={{ fontSize: 18 }} /> },
  { label: 'Settings', view: 'settings', icon: <SettingsIcon sx={{ fontSize: 18 }} /> },
]

export default function Sidebar(): React.JSX.Element {
  const currentView = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setView)

  return (
    <Box
      component="nav"
      sx={{
        width: 200,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo area */}
      <Box
        sx={{
          px: 2,
          pt: '18px',
          pb: '14px',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'primary.main',
            lineHeight: 1.4,
            letterSpacing: '0.1px',
          }}
        >
          Employee Evaluation Tool
        </Typography>
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 400,
            color: '#9CA3AF',
            mt: '3px',
          }}
        >
          Manager
        </Typography>
      </Box>

      {/* Nav items */}
      <List disablePadding sx={{ pt: 1, pb: 1, flex: 1 }}>
        {navItems.map(({ label, view, icon }) => (
          <ListItemButton
            key={view}
            selected={currentView === view}
            onClick={() => setView(view)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 2,
              py: '10px',
              color: '#6B7280',
              borderLeft: '3px solid transparent',
              borderRadius: 0,
              '&.Mui-selected': {
                bgcolor: '#EEF2FF',
                color: 'primary.main',
                fontWeight: 500,
                borderLeftColor: 'primary.main',
              },
              '&.Mui-selected:hover': {
                bgcolor: '#EEF2FF',
              },
              '&:hover:not(.Mui-selected)': {
                bgcolor: '#F9FAFB',
                color: '#1A1A2E',
              },
            }}
          >
            <Box sx={{ color: 'inherit', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {icon}
            </Box>
            <Typography sx={{ fontSize: '14px', color: 'inherit', fontWeight: 'inherit' }}>
              {label}
            </Typography>
          </ListItemButton>
        ))}
      </List>

      {/* Footer */}
      <Box
        sx={{
          px: 2,
          py: '12px',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>v1.0.0 · PoC</Typography>
      </Box>
    </Box>
  )
}
```

### Task 3: `EmployeeList.tsx` — Targeted Changes

Three changes only — do NOT rewrite the full file:

**Change 1:** Extract the page header into a shared constant at the top of the return block (before the conditional empty-state / table split):

```tsx
// Replace the current structure:
// if employees.length === 0 → centered empty state with button
// else → Box with button right + table

// With this structure:
return (
  <Box>
    {/* Page header — always visible */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A2E' }}>
        Employees
      </Typography>
      <Button variant="contained" onClick={handleOpenDialog}>
        + Add Employee
      </Button>
    </Box>

    {employees.length === 0 ? (
      /* Empty state — text only, button removed (it's in the header above) */
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 2 }}>
        <Typography color="text.secondary">
          No employees yet — add your first one to get started
        </Typography>
      </Box>
    ) : (
      /* Table — same as before, but without the outer header Box */
      <TableContainer component={Paper}>
        ...
      </TableContainer>
    )}

    {/* Dialogs unchanged */}
  </Box>
)
```

**Change 2:** Level badge — replace plain text in the non-editing row:

```tsx
// BEFORE:
<TableCell>{emp.level}</TableCell>

// AFTER:
<TableCell>
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      borderRadius: '6px',
      bgcolor: '#EEF2FF',
      color: '#3B5BDB',
      fontSize: '13px',
      fontWeight: 600,
    }}
  >
    {emp.level}
  </Box>
</TableCell>
```

**Change 3:** Add `Typography` import from MUI is already there. No new imports needed for EmployeeList changes (Box and Typography already imported).

### MUI Icons — Package Already Installed

`@mui/icons-material@^9.0.0` is confirmed installed (used since Story 2.3/2.4). New icons used in this story:
- `PeopleIcon` from `@mui/icons-material/People`
- `ListAltIcon` from `@mui/icons-material/ListAlt`
- `SettingsIcon` from `@mui/icons-material/Settings`

### Error Display Preservation

The Framework component has two distinct error paths — preserve both:
- Load error (`competencies.length === 0 && error`): still replaces entire view with `<Alert>`
- Save error (`competencies.length > 0 && error`): still shows `Alert` above the cards, with `onClose={clearError}`

### Previous Story Intelligence (from Stories 3.1 and 3.2)

- **Singleton DB pattern** in `framework.ts` — untouched by this story (no DB work)
- **`useCallback` pattern** in `useFramework.ts` — untouched by this story (no hook changes)
- **`clearError()` called on new cell edit** — preserved in `startEdit()` handler
- **MUI `sx` prop for all styling** — no inline `style` attributes
- **`component="th" scope="col"`** on header cells — no longer needed (table removed), but note that the card layout has no `<th>` elements; accessibility is maintained through visual hierarchy

### UX Requirements Mapping

| Requirement | Implementation |
|---|---|
| UX-DR13: 4×4 grid with Edit + inline FrameworkLevelRow | Per-competency card with 4 level rows, Edit button per row |
| UX-DR8: Save disabled at 40% opacity when empty | `disabled={!draftText.trim()}` + `opacity: ... 0.4` on Save button |
| UX-DR16: Escape cancels | `onKeyDown` Escape → `cancelEdit()` |
| UX-DR17: No success toast | Updated text in place IS the confirmation |
| UX-DR15: aria-label on icon buttons | `aria-label="Cancel edit"` on ✕ IconButton |
| UX-DR5: Sidebar always visible, nav icons | MUI icons in ListItemButton, sidebar footer |

### Scope: Files Modified

- `sdd-app/src/renderer/src/views/Framework.tsx` — full replacement (layout rework)
- `sdd-app/src/renderer/src/components/layout/Sidebar.tsx` — full replacement (icons, logo, footer)
- `sdd-app/src/renderer/src/views/EmployeeList.tsx` — targeted changes (page header, level badge)

### References

- [ux-design-directions.html#Screen 7] — Framework layout reference (per-competency cards)
- [ux-design-directions.html#Screen 1] — Employee List reference (page title, level badge)
- [ux-design-directions.html#Sidebar CSS] — `.sidebar-logo`, `.nav-item`, `.sidebar-footer` styles
- [epics.md#UX-DR13] — Framework 4×4 grid with Edit + inline editing
- [epics.md#UX-DR5] — Fixed left sidebar, nav icons, always visible
- [epics.md#UX-DR8] — Save button 40% opacity when required fields incomplete
- [epics.md#UX-DR16] — Escape cancels inline editing
- [epics.md#UX-DR17] — No success toast; updated text in place is confirmation
- [epics.md#UX-DR15] — aria-label on all icon-only buttons
- [3-2-edit-expected-behaviors-inline.md#Dev Notes] — Error display logic, ABI mismatch, singleton DB

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TypeScript: zero errors on both `tsconfig.node.json` and `tsconfig.web.json` targets (initial pass and polish pass).
- Tests: 31/31 pass (all pre-existing), zero regressions across both passes. No new tests needed — this story contains no new logic, only visual rearrangement and theme configuration of existing components.

### Completion Notes List

- Replaced `Framework.tsx` entirely: removed `Table`/`TableHead`/`TableBody`/`TableCell`/`TableRow`/`CheckIcon` imports; switched to per-competency `Box` card layout with `#F9FAFB` card headers, colored outlined chips, "X of 4 levels configured" counter, 28×28px level badges, and level rows. Edit mode preserved: `startEdit`/`cancelEdit`/`confirmSave` logic unchanged; ✓ `IconButton` replaced with text "Save" `Button` (blue, 40% opacity when empty); ✕ `IconButton` kept for cancel. Subtitle paragraph added below heading. Load-error and save-error display paths preserved.
- Replaced `Sidebar.tsx` entirely (twice): first pass added MUI icons + logo/footer styling; second pass (polish) replaced MUI icons with emoji (`'👥'`/`'📋'`/`'⚙️'`) matching mockup `.nav-icon` element — renders in OS color (Windows emoji font, colorful) vs grayscale MUI SVG icons. Removed MUI icon imports.
- Updated `EmployeeList.tsx` (targeted changes): extracted shared page header (title + button) that renders for both empty and non-empty states; removed `+ Add Employee` button from the empty-state body; replaced `{emp.level}` plain text with a styled 28×28px badge (`#EEF2FF` bg, `#3B5BDB` text, 6px border-radius).

### File List

- `sdd-app/src/renderer/src/views/Framework.tsx` (modified — full layout rework, no logic changes)
- `sdd-app/src/renderer/src/components/layout/Sidebar.tsx` (modified — emoji icons, logo styling, footer)
- `sdd-app/src/renderer/src/views/EmployeeList.tsx` (modified — page header, level badge, header cells, name bold)
- `sdd-app/src/renderer/src/theme/theme.ts` (modified — font family, button textTransform, table head styles)
- `sdd-app/src/renderer/src/components/layout/AppShell.tsx` (modified — padding 28px/32px, removed maxWidth)

### Review Findings

- [x] [Review][Decision] Emoji icons vs AC2 MUI icon requirement — resolved: keep emoji, AC2 updated to reflect deliberate design decision
- [x] [Review][Decision] `(not configured)` parentheses — resolved: remove parentheses, render `not configured` per spec
- [x] [Review][Patch] Emoji icon Box missing `aria-hidden="true"` [`Sidebar.tsx` icon Box] — added `aria-hidden="true"` to icon span
- [x] [Review][Patch] Save button: `disabled` prop + manual `opacity: 0.4` conflict — removed `disabled` prop; click guarded inline; added `pointerEvents: 'none'` when empty [`Framework.tsx` Save Button]
- [x] [Review][Patch] `"of 4 levels configured"` hardcodes `4` instead of `LEVELS.length` — fixed to `{LEVELS.length}` [`Framework.tsx` configuredCount caption]
- [x] [Review][Defer] Hover-only action buttons in EmployeeList — keyboard inaccessibility [`EmployeeList.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `confirmSave` has no double-click in-flight guard [`Framework.tsx:confirmSave`] — deferred, pre-existing
- [x] [Review][Defer] `COMPETENCY_CHIP_STYLES` keyed by display name — silent grey fallback on rename/localization [`Framework.tsx`] — deferred, pre-existing design tradeoff
- [x] [Review][Defer] `fontWeight: 'inherit'` on nav label Typography may not cascade from parent `sx` [`Sidebar.tsx`] — deferred, pre-existing
