import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { frameWorksheetOf } from '#content/infrastructure/json/frameWorksheetOf'
import {
  readLessonContentFiles,
  readLexiconFile,
} from '#content/infrastructure/json/readLessonContentFiles'

const [basePath] = process.argv.slice(2)
if (basePath === undefined) {
  throw new Error('usage: pnpm --filter @mygame/api content:worksheet <base words.json>')
}
const content = readLessonContentFiles(fileURLToPath(new URL('../content/', import.meta.url)))
const base = readLexiconFile(resolve(process.env.INIT_CWD ?? process.cwd(), basePath))
process.stdout.write(`${frameWorksheetOf(content, base)}\n`)
