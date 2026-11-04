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

  it('reads the terms of lesson 1 from its content', () => {
    const lesson = JsonLessonCatalog.fromDirectory(shippedContent).lessonOf('lesson-1')

    expect({ ...lesson, words: undefined }).toEqual({
      id: 'lesson-1',
      theme: 'A day in town',
      durationSeconds: 300,
      requiredLibraryLevel: 1,
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
    ])
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
    const list = readFileSync(join(shippedContent, 'lessons', 'ngsl-1.2.csv'))

    expect(createHash('sha256').update(list).digest('hex')).toBe(
      '2098bab8955a120a9766c6282a51d7d578c6cb0a7d946600d2ffb73ba25a0b44',
    )
  })

  it('fails start-up on a malformed lesson file', () => {
    const directory = contentCopy()
    const lessonFile = join(directory, 'lessons', 'lesson-1.json')
    const lesson = JSON.parse(readFileSync(lessonFile, 'utf8'))
    writeFileSync(lessonFile, JSON.stringify({ ...lesson, cost: 0 }))

    expect(() => JsonLessonCatalog.fromDirectory(directory)).toThrow(/lesson-1\.json is malformed/)
  })

  it('fails start-up on a malformed row of the NGSL 1.2 list', () => {
    const directory = contentCopy()
    const listFile = join(directory, 'lessons', 'ngsl-1.2.csv')
    writeFileSync(listFile, `${readFileSync(listFile, 'utf8')}broken row\r\n`)

    expect(() => JsonLessonCatalog.fromDirectory(directory)).toThrow(/ngsl-1\.2\.csv is malformed/)
  })
})
