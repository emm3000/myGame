import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import es from '../es.json'
import { generatedFilesOf } from './generatedFilesOf'
import { repositoryRoot } from './repositoryRoot'

for (const file of generatedFilesOf(es)) {
  const path = join(repositoryRoot, file.path)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, file.contents)
}
