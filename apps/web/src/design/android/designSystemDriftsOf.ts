import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DesignSystemFile } from './DesignSystemFile'
import { designSystemFilesOf } from './designSystemFilesOf'

function driftOf(directory: string, file: DesignSystemFile): ReadonlyArray<string> {
  const path = join(directory, file.fileName)
  if (!existsSync(path)) {
    return [`${file.fileName} is missing`]
  }
  return readFileSync(path, 'utf8') === file.contents
    ? []
    : [`${file.fileName} drifted from tokens.ts`]
}

export function designSystemDriftsOf(directory: string): ReadonlyArray<string> {
  return designSystemFilesOf().flatMap((file) => driftOf(directory, file))
}
