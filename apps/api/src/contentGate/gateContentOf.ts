import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { lessonContentFilesOf } from '../adapters/json/lessonContentFilesOf'
import type { GateContent } from './GateContent'

const englishCatalog = fileURLToPath(
  new URL('../../../../packages/catalog/en.json', import.meta.url),
)

export const gateContentOf = (directory: string): GateContent => ({
  ...lessonContentFilesOf(directory),
  englishMessages: z
    .record(z.string(), z.string())
    .parse(JSON.parse(readFileSync(englishCatalog, 'utf8'))),
})
