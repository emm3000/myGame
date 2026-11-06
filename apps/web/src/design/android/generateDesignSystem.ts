import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { designSystemDirectory } from './designSystemDirectory'
import { designSystemFilesOf } from './designSystemFilesOf'

for (const file of designSystemFilesOf()) {
  writeFileSync(join(designSystemDirectory, file.fileName), file.contents)
}
