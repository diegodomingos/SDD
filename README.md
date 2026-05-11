# Employee Evaluation Tool

A desktop proof-of-concept application that helps managers log observable employee behaviors throughout the year and use AI to produce structured competency assessments at evaluation time.

Instead of relying on memory, managers capture behaviors as they happen. When evaluation season arrives, the app analyzes the accumulated evidence using Claude AI and returns a grade — **Does Not Meet**, **Meets**, **Exceeds Expectations**, or **Insufficient Input** — with a written rationale grounded in the logged evidence.

Built with Electron, React, TypeScript, and a local SQLite database. All data stays on the manager's machine.

---

## Features

- **Employee management** — add, edit, and remove employees with their level (A–D)
- **Competency framework** — configure expected behaviors per competency per level
- **Behavior logging** — capture observable behaviors inline, organized by competency
- **AI evaluation** — trigger a Claude-powered assessment per competency, grounded in logged evidence
- **Insufficient Input handling** — forward-looking guidance when evidence is too thin to grade
- **Error resilience** — retry on network failure; works fully offline except for AI evaluation
- **Windows installer** — packaged as an NSIS `.exe` ready for distribution

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 39 |
| UI | React 19 + TypeScript 5 + MUI v9 |
| State management | Zustand v5 |
| Database | better-sqlite3 (local, synchronous) |
| AI | Anthropic Claude SDK (`claude-haiku-4-5` / `claude-sonnet-4-6`) |
| Build tooling | electron-vite + electron-builder |
| Testing | Vitest + Testing Library (122 tests) |

---

## Project Structure

```
SDD/
├── sdd-app/                    # Electron application
│   ├── src/
│   │   ├── main/               # Electron main process (Node.js)
│   │   │   ├── ai/             # AI provider implementations (Mock + Claude)
│   │   │   ├── db/             # SQLite database layer (employees, logs, framework)
│   │   │   ├── handlers/       # IPC handlers (bridge between main and renderer)
│   │   │   └── settings/       # App settings (API key via safeStorage, model selection)
│   │   ├── preload/            # Context bridge — exposes safe IPC API to renderer
│   │   ├── renderer/           # React application (runs in browser context)
│   │   │   └── src/
│   │   │       ├── components/ # Reusable UI components
│   │   │       ├── hooks/      # Data-fetching and state hooks
│   │   │       ├── store/      # Zustand global store
│   │   │       ├── theme/      # MUI theme configuration
│   │   │       └── views/      # Page-level components (employees, evaluate, settings)
│   │   └── shared/             # Types and IPC contracts shared across processes
│   ├── electron-builder.yml    # Packaging configuration
│   └── package.json
├── _bmad/                      # BMad methodology configuration
├── _bmad-output/               # Planning artifacts (PRD, architecture, stories, retro)
└── docs/                       # Additional project documentation
```

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **Claude API key** — obtain from [console.anthropic.com](https://console.anthropic.com)
- **Windows Developer Mode** — required only when building the Windows NSIS installer (symlink support)

---

## Getting Started

All commands run from the `sdd-app/` directory.

```bash
cd sdd-app
npm install
```

### Run in development

```bash
npm run dev
```

Opens the app with hot reload and DevTools available.

### Run tests

```bash
npm test
```

Or in watch mode:

```bash
npm run test:watch
```

### Type check

```bash
npm run typecheck
```

---

## Building

```bash
# Windows (.exe NSIS installer)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (AppImage, snap, deb)
npm run build:linux
```

> **Note for Windows builds:** Enable Developer Mode in Windows Settings → System → For developers before running `build:win`. This is required for symlink creation during the NSIS packaging step.

---

## First-Time Setup (in the app)

1. Launch the app
2. Go to **Settings** and enter your Anthropic API key
3. Select a Claude model (Haiku is faster and cheaper; Sonnet produces richer rationale)
4. Add employees and configure the competency framework expected behaviors
5. Start logging behaviors — then run evaluations from the **Evaluate** tab

---

## Code Quality

```bash
npm run lint       # ESLint
npm run format     # Prettier
npm run typecheck  # TypeScript (both main and renderer configs)
```

---

## Architecture Notes

- The **main process** owns all data access (SQLite, API key storage, Claude API calls). The renderer never touches Node.js APIs directly.
- IPC is the only communication channel between main and renderer, typed end-to-end via the shared contracts in `src/shared/`.
- The AI provider is swappable — `MockAIProvider` is used in tests; `ClaudeAIProvider` is the production implementation.
- API keys are stored using Electron's `safeStorage` (OS-level encryption), never in plain text.
- The database lives in the OS user data directory (`app.getPath('userData')`), isolated per OS user.
