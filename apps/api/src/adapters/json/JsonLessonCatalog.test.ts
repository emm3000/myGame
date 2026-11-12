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

const contentWithLessonOf = (entry: Readonly<Record<string, unknown>>): string => {
  const directory = contentCopy()
  const lexicon: unknown = JSON.parse(readFileSync(lessonsFile(directory, 'words.json'), 'utf8'))
  writeJson(directory, 'words.json', [...(lexicon as ReadonlyArray<unknown>), entry])
  writeJson(directory, 'lesson-17.json', {
    id: 'lesson-17',
    ...lessonOneTerms,
    wordIds: [entry.id],
  })
  const curriculum = readJson(directory, 'curriculum.json')
  writeJson(directory, 'curriculum.json', {
    ...curriculum,
    lessonIds: [...(curriculum.lessonIds as ReadonlyArray<string>), 'lesson-17'],
  })
  return directory
}

const contentWithBandLessonOf = (lemma: string): string =>
  contentWithLessonOf({
    id: 'band-lesson-word',
    lemma,
    partOfSpeech: 'verb',
    frames: [{ frame: `I ${lemma} it.`, gappedFrame: 'I ____ it.' }],
    gloss: { es: 'decir' },
    definition: 'to speak words',
  })

const contentWithUnitLesson = (): string =>
  contentWithLessonOf({
    id: 'unit-lesson-word',
    lemma: 'give up',
    partOfSpeech: 'verb',
    frames: [{ frame: 'She will not give up.', gappedFrame: 'She will not ____ ____.' }],
    gloss: { es: 'rendirse' },
    definition: 'to stop trying',
    source: 'phave',
  })

afterEach(() => {
  for (const directory of copies.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('JsonLessonCatalog', () => {
  it('places no chrome lesson in a band', () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)

    expect(catalog.bandOfLesson('lesson-1')).toBeUndefined()
  })

  it('places a lesson after the chrome lessons in the band of its rank', () => {
    const catalog = JsonLessonCatalog.fromDirectory(contentWithBandLessonOf('say'))

    expect(catalog.bandOfLesson('lesson-17')).toBe(1)
  })

  it('places a lesson of ranks past 1 000 in the second band', () => {
    const catalog = JsonLessonCatalog.fromDirectory(contentWithBandLessonOf('difficulty'))

    expect(catalog.bandOfLesson('lesson-17')).toBe(2)
  })

  it('places a capitalized lemma in the band of its rank', () => {
    const catalog = JsonLessonCatalog.fromDirectory(contentWithBandLessonOf('TRUE'))

    expect(catalog.bandOfLesson('lesson-17')).toBe(1)
  })

  it('holds a capitalized lemma of the list under its lowercase headword', () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)

    expect(catalog.wordsOfBand(3)).toContainEqual({ headword: 'false', isChrome: false })
  })

  it('answers no band for a unit lesson', () => {
    const catalog = JsonLessonCatalog.fromDirectory(contentWithUnitLesson())

    expect(catalog.bandOfLesson('lesson-17')).toBeUndefined()
  })

  it('refuses a band lesson that teaches no word of the list', () => {
    const directory = contentWithBandLessonOf('zzz')

    expect(() => JsonLessonCatalog.fromDirectory(directory)).toThrow(
      'Lesson lesson-17 teaches no word of the list',
    )
  })

  it('counts the words of each band as the list ranks them, leaving the frame words out', () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)

    expect([1, 2, 3].map((band) => catalog.wordsOfBand(band).length)).toEqual([941, 1000, 809])
  })

  it("marks the chrome lessons' words, whatever their band", () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)

    expect(
      [1, 2, 3].map((band) => catalog.wordsOfBand(band).filter(({ isChrome }) => !isChrome).length),
    ).toEqual([875, 989, 806])
  })

  it('holds a word no lesson teaches yet in its band', () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)

    expect(catalog.wordsOfBand(1)).toContainEqual({ headword: 'say', isChrome: false })
  })

  it('leaves a frame word out of its band', () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)

    expect(catalog.wordsOfBand(1).map(({ headword }) => headword)).not.toContain('the')
  })

  it("offers as band 1's placement words the lexicon's band 1 entries", () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)

    expect(catalog.placementWordsOf(1)).toContainEqual({
      id: 'lesson-1-1',
      headword: 'home',
      word: 'home',
      gloss: 'hogar',
      isChrome: true,
    })
  })

  it('answers that only band 1 has lessons in the shipped curriculum', () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)

    expect([1, 2, 3].map((band) => catalog.hasLessons(band))).toEqual([true, false, false])
  })

  it('marks every word of a band lesson as a placement word outside the chrome', () => {
    const catalog = JsonLessonCatalog.fromDirectory(shippedContent)
    const bandLessonWordIds = catalog
      .lessons()
      .slice(16)
      .flatMap(({ words }) => words.map(({ id }) => id))

    expect(
      catalog
        .placementWordsOf(1)
        .filter(({ isChrome }) => !isChrome)
        .map(({ id }) => id),
    ).toEqual(expect.arrayContaining(bandLessonWordIds))
  })

  it('offers no off-list word for placement', () => {
    const directory = contentCopy()
    const lexicon = JSON.parse(readFileSync(lessonsFile(directory, 'words.json'), 'utf8'))
    const offList = {
      id: 'off-list-word',
      lemma: 'upgrade',
      partOfSpeech: 'noun',
      frames: [{ frame: 'The upgrade is done.', gappedFrame: 'The ____ is done.' }],
      gloss: { es: 'mejora' },
      isOffList: true,
    }
    writeJson(directory, 'words.json', [...lexicon, offList])
    const catalog = JsonLessonCatalog.fromDirectory(directory)
    const offered = [1, 2, 3].flatMap((band) => catalog.placementWordsOf(band))

    expect(offered.map(({ id }) => id)).not.toContain('off-list-word')
  })

  it('offers no frame word for placement', () => {
    const directory = contentCopy()
    const lexicon = JSON.parse(readFileSync(lessonsFile(directory, 'words.json'), 'utf8'))
    const frameWord = {
      id: 'frame-word',
      lemma: 'the',
      partOfSpeech: 'adjective',
      frames: [{ frame: 'I see the town.', gappedFrame: 'I see ____ town.' }],
      gloss: { es: 'el' },
    }
    writeJson(directory, 'words.json', [...lexicon, frameWord])
    const catalog = JsonLessonCatalog.fromDirectory(directory)

    expect(catalog.placementWordsOf(1).map(({ id }) => id)).not.toContain('frame-word')
  })

  it('offers no lexicon entry without an es gloss for placement', () => {
    const directory = contentCopy()
    const lexicon = JSON.parse(readFileSync(lessonsFile(directory, 'words.json'), 'utf8'))
    const untaught = {
      id: 'untaught-word',
      lemma: 'say',
      partOfSpeech: 'verb',
      frames: [{ frame: 'I say it.', gappedFrame: 'I ____ it.' }],
      gloss: {},
    }
    writeJson(directory, 'words.json', [...lexicon, untaught])
    const catalog = JsonLessonCatalog.fromDirectory(directory)

    expect(catalog.placementWordsOf(1).map(({ id }) => id)).not.toContain('untaught-word')
  })

  it('reads lesson 1 as the lessons table of the setting writes it, row for row', () => {
    const lesson = JsonLessonCatalog.fromDirectory(shippedContent).lessonOf('lesson-1')

    expect(
      lesson?.words.map(({ acceptedForms, frames: [anchor], gloss }) => ({
        lemma: acceptedForms[0],
        ...anchor,
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
      { id: 'lesson-17', theme: 'A talk with the mayor' },
      { id: 'lesson-18', theme: 'My first day' },
      { id: 'lesson-19', theme: 'A day with children' },
      { id: 'lesson-20', theme: 'The town show' },
      { id: 'lesson-21', theme: 'Life in a new place' },
      { id: 'lesson-22', theme: 'Fixing a problem' },
      { id: 'lesson-23', theme: 'Write it well' },
      { id: 'lesson-24', theme: 'A lot of time' },
      { id: 'lesson-25', theme: 'A company in town' },
      { id: 'lesson-26', theme: 'Even more work' },
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

  it("carries a word's frames in the lexicon's order, each later one with its lesson", () => {
    const directory = contentCopy()
    const [home, ...others] = readJson(directory, 'words.json') as unknown as Array<object>
    const frames = [
      { frame: 'This is my home.', gappedFrame: 'This is my ____.' },
      { frame: 'We are at home.', gappedFrame: 'We are at ____.', fromLessonId: 'lesson-3' },
      { frame: 'My home is new.', gappedFrame: 'My ____ is new.', fromLessonId: 'lesson-2' },
    ]
    writeJson(directory, 'words.json', [{ ...home, frames }, ...others])

    expect(
      JsonLessonCatalog.fromDirectory(directory).lessonOfWord('lesson-1-1')?.words[0]?.frames,
    ).toEqual(frames)
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
