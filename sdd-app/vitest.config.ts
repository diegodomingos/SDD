import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // renderer tests add // @vitest-environment jsdom per-file when needed (Story 6.6)
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
  }
})
