# Deferred Work Log

## Deferred from: code review of 1-1-scaffold-and-configure-project (2026-04-24)

- `src/renderer/src/env.d.ts` created by scaffold but spec lists it under Story 1.2 scope — Story 1.2 can check if the file is correct or update if needed
- `sandbox: false` disables renderer sandbox (`sdd-app/src/main/index.ts`) — scaffold default; story scope excludes modification; address before first distribution
- CSP missing `connect-src` directive (`sdd-app/src/renderer/index.html`) — scaffold default; add when Claude API calls are wired (Story 6.5)
- `window.electron` accessed without null guard in `App.tsx` and `Versions.tsx` — scaffold template; replaced by real UI in Stories 1.4–1.6
- Non-null assertion `getElementById('root')!` throws if element absent (`sdd-app/src/renderer/src/main.tsx:7`) — scaffold default; low risk in controlled Electron context
- `contextBridge.exposeInMainWorld` error swallowed silently (`sdd-app/src/preload/index.ts`) — scaffold default; Story 1.5 rewrites IPC scaffold
- `setWindowOpenHandler` passes URLs to `shell.openExternal` without scheme validation (`sdd-app/src/main/index.ts`) — scaffold default; address when AI-generated content exists (Story 6.x)
- Debug `ipcMain.on('ping')` and `console.log('pong')` left in main process (`sdd-app/src/main/index.ts`) — scaffold default; Story 1.5 replaces IPC scaffolding
- `@ts-ignore` in preload suppresses type errors on `window` assignments (`sdd-app/src/preload/index.ts`) — scaffold default; Story 1.2 replaces `window.api`
- `window.api` exposed as `unknown` placeholder (`sdd-app/src/preload/index.ts`) — scaffold default; Story 1.2 defines the actual IPC contract
- `notarize: false` — macOS Gatekeeper will block distribution (`sdd-app/electron-builder.yml`) — not relevant until packaging; address in Story 6.6
- Auto-update `publish.url` is placeholder `https://example.com/auto-updates` (`sdd-app/electron-builder.yml`) — not used yet; configure before distribution
- `appId: com.electron.app` is template default (`sdd-app/electron-builder.yml`) — set real app ID before distribution
- `author` and `homepage` are template placeholder values (`sdd-app/package.json`) — update before distribution
- `electronApp.setAppUserModelId('com.electron')` does not match `appId` (`sdd-app/src/main/index.ts`) — fix alongside appId in Story 6.6
- `maintainer: electronjs.org` in Linux build config (`sdd-app/electron-builder.yml`) — update before distribution
- `!src/*` files exclusion in `electron-builder.yml` may not be recursive (`sdd-app/electron-builder.yml`) — low risk; compiled output in `out/`; verify during Story 6.6 packaging
