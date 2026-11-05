import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { gateContentOf } from './gateContentOf'

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

const shippedFile = (file: string): Buffer => readFileSync(join(shippedContent, 'lessons', file))

const sha256Of = (file: string): string =>
  createHash('sha256').update(shippedFile(file)).digest('hex')

describe('gateContentOf', () => {
  it('ships the NGSL 1.2 teaching list unchanged from its source', () => {
    expect(sha256Of('ngsl-1.2-lemmatized-for-teaching.csv')).toBe(
      'b54e297244988237457e04f823aa8dca68e3d646938dc76d383e099f04cb7666',
    )
  })

  it('names the source, date and SHA-256 of the teaching list in the attribution file', () => {
    const attribution = shippedFile('ngsl-1.2-attribution.txt').toString('utf8')

    expect(
      [
        'Source: https://www.newgeneralservicelist.com/s/NGSL_12_lemmatized_for_teaching.csv',
        'Downloaded: 2026-11-04',
        `SHA-256: ${sha256Of('ngsl-1.2-lemmatized-for-teaching.csv')}`,
      ].every((line) => attribution.includes(line)),
    ).toBe(true)
  })

  it('reads each form of the teaching list as the headwords it belongs to', () => {
    const { forms } = gateContentOf(shippedContent)

    expect(['went', 'my', 'colour', 'left'].map((form) => [...(forms.get(form) ?? [])])).toEqual([
      ['go'],
      ['i'],
      ['color'],
      ['leave', 'left'],
    ])
  })

  it('reads the frame words of the grammar inventory', () => {
    const { grammar } = gateContentOf(shippedContent)

    expect(grammar.frameWords.slice(0, 3)).toEqual([
      { word: 'the', admittingLessonId: 'lesson-1' },
      { word: 'be', admittingLessonId: 'lesson-1' },
      { word: 'and', admittingLessonId: 'lesson-1' },
    ])
  })
})
