import { createHash } from 'node:crypto'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BuildingContentSchema } from '@mygame/contracts'
import { assert, describe, expect, it } from 'vitest'
import { apiPackagePath } from '../../apiPackagePath.testSupport'
import { gateContentOf } from './readGateContent'

const shippedContent = apiPackagePath('content/')

const shippedFile = (file: string): Buffer => readFileSync(join(shippedContent, 'lessons', file))

const sha256Of = (file: string): string =>
  createHash('sha256').update(shippedFile(file)).digest('hex')

const contentWithElevenHomesLevels = (): string => {
  const directory = mkdtempSync(join(tmpdir(), 'mygame-gate-content-'))
  cpSync(shippedContent, directory, { recursive: true })
  const homesFile = join(directory, 'town', 'homes.json')
  const homes = BuildingContentSchema.parse(JSON.parse(readFileSync(homesFile, 'utf8')))
  const topLevel = homes.levels.at(-1)
  assert(topLevel !== undefined)
  writeFileSync(
    homesFile,
    JSON.stringify({
      ...homes,
      levels: [...homes.levels, { ...topLevel, level: topLevel.level + 1 }],
    }),
  )
  return directory
}

describe('gateContentOf', () => {
  it("reads the top level as the highest of every building's, not the school's alone", () => {
    const directory = contentWithElevenHomesLevels()
    try {
      const content = gateContentOf(directory)
      expect([content.schoolLevels.length, content.topBuildingLevel]).toEqual([10, 11])
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

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

  it('reads the structures of the grammar inventory in order', () => {
    const { grammar } = gateContentOf(shippedContent)

    expect(grammar.structures[0]).toEqual({
      name: 'Present of be, with not',
      cefr: 'A1.1',
      cefrjItem: '58',
      admittingLessonId: 'lesson-1',
      frameWords: ['be', 'not'],
      inflections: ['am', 'is', 'are', "'m", "'re", "'s", "n't"],
    })
  })
})
