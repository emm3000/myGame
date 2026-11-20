import { availableParallelism } from 'node:os'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    globalSetup: ['./vitest.globalSetup.ts'],
    setupFiles: ['./vitest.workerDatabase.ts'],
    fileParallelism: true,
    maxWorkers: Math.max(Math.min(availableParallelism() - 1, 4), 1),
  },
})
