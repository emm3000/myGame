import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { townDrawablesOf } from './townDrawablesOf'

for (const drawable of townDrawablesOf()) {
  mkdirSync(dirname(drawable.path), { recursive: true })
  writeFileSync(drawable.path, drawable.contents)
}
