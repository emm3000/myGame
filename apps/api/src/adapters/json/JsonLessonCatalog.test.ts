import { createHash } from 'node:crypto'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { JsonLessonCatalog } from './JsonLessonCatalog'

const shippedContent = fileURLToPath(new URL('../../../content/', import.meta.url))

const lessonsDocument = fileURLToPath(
  new URL('../../../../../docs/setting/lessons.md', import.meta.url),
)

type TableWord = {
  readonly lemma: string
  readonly frame: string
  readonly gappedFrame: string
  readonly gloss: string
}

const lessonOneTable = (): ReadonlyArray<TableWord> => {
  const section = readFileSync(lessonsDocument, 'utf8').split('## Lesson 1')[1] ?? ''
  const table = section.split('\n\n').find((block) => block.startsWith('| Lemma')) ?? ''
  return table
    .split('\n')
    .slice(2)
    .map((row) => row.split('|').map((cell) => cell.trim()))
    .map(([, lemma = '', , , frame = '', gappedFrame = '', gloss = '']) => ({
      lemma,
      frame,
      gappedFrame,
      gloss,
    }))
}

const copies: Array<string> = []

const contentCopy = (): string => {
  const directory = mkdtempSync(join(tmpdir(), 'mygame-lessons-'))
  copies.push(directory)
  cpSync(shippedContent, directory, { recursive: true })
  return directory
}

const lessonsFile = (directory: string, file: string): string => join(directory, 'lessons', file)

const readJson = (directory: string, file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(lessonsFile(directory, file), 'utf8'))

const writeJson = (directory: string, file: string, value: unknown): void => {
  writeFileSync(lessonsFile(directory, file), JSON.stringify(value))
}

const lessonOneTerms = {
  theme: 'A day in town',
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  wordIds: ['lesson-1-1'],
}

const contentOfLessons = (
  lessonIds: ReadonlyArray<string>,
  cycle: ReadonlyArray<string>,
): string => {
  const directory = contentCopy()
  for (const id of lessonIds) {
    writeJson(directory, `${id}.json`, { id, ...lessonOneTerms })
  }
  writeJson(directory, 'curriculum.json', {
    chromeLessonCount: 1,
    lessonIds,
    skill: { cycle, ratePercent: 5 },
  })
  return directory
}

afterEach(() => {
  for (const directory of copies.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('JsonLessonCatalog', () => {
  it('reads lesson 1 as the lessons table of the setting writes it, row for row', () => {
    const lesson = JsonLessonCatalog.fromDirectory(shippedContent).lessonOf('lesson-1')

    expect(
      lesson?.words.map(({ acceptedForms, frame, gappedFrame, gloss }) => ({
        lemma: acceptedForms[0],
        frame,
        gappedFrame,
        gloss,
      })),
    ).toEqual(lessonOneTable())
  })

  it('reads the terms of lesson 1 from its content, its skill food at 5 %', () => {
    const lesson = JsonLessonCatalog.fromDirectory(shippedContent).lessonOf('lesson-1')

    expect({ ...lesson, words: undefined }).toEqual({
      id: 'lesson-1',
      theme: 'A day in town',
      durationSeconds: 300,
      requiredSchoolLevel: 1,
      skill: { resource: 'food', ratePercent: 5 },
      words: undefined,
    })
  })

  it('names every word by an opaque id, never its lemma', () => {
    const lesson = JsonLessonCatalog.fromDirectory(shippedContent).lessonOf('lesson-1')

    expect(lesson?.words.map(({ id }) => id)).toEqual([
      'lesson-1-1',
      'lesson-1-2',
      'lesson-1-3',
      'lesson-1-4',
      'lesson-1-5',
    ])
  })

  it('finds the lesson of a word by its id', () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)

    expect([catalog.lessonOfWord('lesson-1-5')?.id, catalog.lessonOfWord('food')]).toEqual([
      'lesson-1',
      undefined,
    ])
  })

  it('lists every lesson for the overview', () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)

    expect(catalog.lessons().map(({ id, theme }) => ({ id, theme }))).toEqual([
      { id: 'lesson-1', theme: 'A day in town' },
      { id: 'lesson-2', theme: 'A town for people' },
      { id: 'lesson-3', theme: 'A job in spring' },
      { id: 'lesson-4', theme: 'Summer on the farm' },
      { id: 'lesson-5', theme: 'Building a home' },
      { id: 'lesson-6', theme: 'News from the city' },
      { id: 'lesson-7', theme: 'A team for the town' },
      { id: 'lesson-8', theme: 'At the office' },
      { id: 'lesson-9', theme: 'Work by the river' },
      { id: 'lesson-10', theme: 'Clean-up day' },
      { id: 'lesson-11', theme: 'Out in the region' },
      { id: 'lesson-12', theme: 'Words to study' },
      { id: 'lesson-13', theme: 'Goals for the year' },
      { id: 'lesson-14', theme: 'Ready for winter' },
      { id: 'lesson-15', theme: 'The next area' },
      { id: 'lesson-16', theme: 'The report' },
    ])
  })

  it('loads the lessons the curriculum lists, in its order', () => {
    const directory = contentOfLessons(['lesson-b', 'lesson-a'], ['food'])

    expect(
      JsonLessonCatalog.fromDirectory(directory)
        .lessons()
        .map(({ id }) => id),
    ).toEqual(['lesson-b', 'lesson-a'])
  })

  it('derives the skill of lessons 1, 2 and k + 1 from their places in the cycle', () => {
    const lessonIds = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']
    const directory = contentOfLessons(lessonIds, ['power', 'food', 'money', 'material'])
    const catalog = JsonLessonCatalog.fromDirectory(directory)

    expect(['first', 'second', 'fifth'].map((id) => catalog.lessonOf(id)?.skill)).toEqual([
      { resource: 'power', ratePercent: 5 },
      { resource: 'food', ratePercent: 5 },
      { resource: 'power', ratePercent: 5 },
    ])
  })

  it('accepts the further forms the lexicon lists for a typed answer', () => {
    const directory = contentCopy()
    const [home, ...others] = readJson(directory, 'words.json') as unknown as Array<object>
    writeJson(directory, 'words.json', [{ ...home, acceptedForms: ['homes'] }, ...others])

    expect(
      JsonLessonCatalog.fromDirectory(directory).lessonOfWord('lesson-1-1')?.words[0]
        ?.acceptedForms,
    ).toEqual(['home', 'homes'])
  })

  it('reads a headword of the NGSL 1.2 list whatever its case', () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)

    expect(['foot', 'House', 'i', 'scool', 'wok'].map((word) => catalog.isHeadword(word))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ])
  })

  it('ships the NGSL 1.2 list unchanged from its source', () => {
    const list = readFileSync(lessonsFile(shippedContent, 'ngsl-1.2.csv'))

    expect(createHash('sha256').update(list).digest('hex')).toBe(
      '2098bab8955a120a9766c6282a51d7d578c6cb0a7d946600d2ffb73ba25a0b44',
    )
  })

  it('fails start-up on a malformed lesson file', () => {
    const directory = contentCopy()
    const [lessonId] = readJson(directory, 'curriculum.json').lessonIds as Array<string>
    const lessonFile = lessonsFile(directory, `${lessonId}.json`)
    writeFileSync(
      lessonFile,
      JSON.stringify({ ...readJson(directory, `${lessonId}.json`), cost: 0 }),
    )

    expect(() => JsonLessonCatalog.fromDirectory(directory)).toThrow(`${lessonFile} is malformed`)
  })

  it('fails start-up on a lesson file whose id is not the one the curriculum lists', () => {
    const directory = contentOfLessons(['lesson-a'], ['food'])
    writeJson(directory, 'lesson-a.json', { id: 'lesson-b', ...lessonOneTerms })

    expect(() => JsonLessonCatalog.fromDirectory(directory)).toThrow(/lesson-a\.json is malformed/)
  })

  it('fails start-up on a malformed curriculum', () => {
    const directory = contentCopy()
    writeJson(directory, 'curriculum.json', { lessonIds: [] })

    expect(() => JsonLessonCatalog.fromDirectory(directory)).toThrow(
      /curriculum\.json is malformed/,
    )
  })

  it('fails start-up on a malformed lexicon', () => {
    const directory = contentCopy()
    writeJson(directory, 'words.json', [{ id: 'lesson-1-1' }])

    expect(() => JsonLessonCatalog.fromDirectory(directory)).toThrow(/words\.json is malformed/)
  })

  it('fails start-up on a lesson word the lexicon lacks', () => {
    const directory = contentOfLessons(['lesson-a'], ['food'])
    writeJson(directory, 'lesson-a.json', {
      id: 'lesson-a',
      ...lessonOneTerms,
      wordIds: ['word-0'],
    })

    expect(() => JsonLessonCatalog.fromDirectory(directory)).toThrow(/lesson-a\.json is malformed/)
  })

  it('fails start-up on a taught word without its es gloss', () => {
    const directory = contentCopy()
    const [home, ...others] = readJson(directory, 'words.json') as unknown as Array<object>
    writeJson(directory, 'words.json', [{ ...home, gloss: {} }, ...others])

    expect(() => JsonLessonCatalog.fromDirectory(directory)).toThrow(
      'Word lesson-1-1 of lesson lesson-1 has no es gloss',
    )
  })

  it('fails start-up on a malformed row of the NGSL 1.2 list', () => {
    const directory = contentCopy()
    const listFile = lessonsFile(directory, 'ngsl-1.2.csv')
    writeFileSync(listFile, `${readFileSync(listFile, 'utf8')}broken row\r\n`)

    expect(() => JsonLessonCatalog.fromDirectory(directory)).toThrow(/ngsl-1\.2\.csv is malformed/)
  })
})
