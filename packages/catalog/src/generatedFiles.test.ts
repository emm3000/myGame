import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '../en.json'
import es from '../es.json'
import { generatedFilesOf } from './generatedFilesOf'
import { repositoryRoot } from './repositoryRoot'

describe('the generated files', () => {
  for (const file of generatedFilesOf({ en, es })) {
    it(`keeps ${file.path} as the catalog generates it`, () => {
      expect(readFileSync(join(repositoryRoot, file.path), 'utf8')).toBe(file.contents)
    })
  }
})
