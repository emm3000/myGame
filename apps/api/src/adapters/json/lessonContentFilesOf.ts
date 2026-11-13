import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  type CurriculumContent,
  CurriculumContentSchema,
  type GrammarContent,
  GrammarContentSchema,
  type LessonContent,
  LessonContentSchema,
  type LexiconContent,
  LexiconContentSchema,
} from '@mygame/contracts'
import { headwordOf } from '@mygame/domain'
import { z } from 'zod'

export type LexiconEntry = LexiconContent[number]

export type LessonOfFiles = {
  readonly content: LessonContent
  readonly words: ReadonlyArray<LexiconEntry>
}

export type LessonContentFiles = {
  readonly curriculum: CurriculumContent
  readonly grammar: GrammarContent
  readonly lessons: ReadonlyArray<LessonOfFiles>
  readonly lexicon: LexiconContent
  readonly ranks: ReadonlyMap<string, number>
  readonly forms: ReadonlyMap<string, ReadonlySet<string>>
}

const headwordHeader = 'Lemma,SFI Rank,SFI,Adjusted Frequency per Million (U)'

const HeadwordRowSchema = z.tuple([
  z.string().regex(/^[A-Za-z]+$/),
  z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number),
  z.string().regex(/^\d+(\.\d+)?$/),
  z.string().regex(/^\d+(\.\d+)?$/),
])

const malformed = (path: string, cause: unknown): Error =>
  new Error(`Content file ${path} is malformed`, { cause })

const lessonsFile = (directory: string, file: string): string => join(directory, 'lessons', file)

const parsedFile = <T>(path: string, schema: z.ZodType<T>): T => {
  try {
    return schema.parse(JSON.parse(readFileSync(path, 'utf8')))
  } catch (cause) {
    throw malformed(path, cause)
  }
}

const wordsOf = (
  path: string,
  content: LessonContent,
  lexicon: LexiconContent,
): ReadonlyArray<LexiconEntry> =>
  content.wordIds.map((wordId) => {
    const entry = lexicon.find(({ id }) => id === wordId)
    if (entry === undefined) {
      throw malformed(path, new Error(`word ${wordId} is not in the lexicon`))
    }
    return entry
  })

const lessonOfFile = (
  directory: string,
  lessonId: string,
  lexicon: LexiconContent,
): LessonOfFiles => {
  const path = lessonsFile(directory, `${lessonId}.json`)
  const content = parsedFile(path, LessonContentSchema)
  if (content.id !== lessonId) {
    throw malformed(path, new Error(`it names ${content.id}, not ${lessonId}`))
  }
  return { content, words: wordsOf(path, content, lexicon) }
}

const ranksOfFile = (directory: string): ReadonlyMap<string, number> => {
  const path = lessonsFile(directory, 'ngsl-1.2.csv')
  const [header, ...rows] = readFileSync(path, 'utf8').split(/\r?\n/)
  if (header !== headwordHeader) {
    throw malformed(path, new Error(`unexpected header ${header}`))
  }
  try {
    return new Map(
      rows
        .filter((row) => row !== '')
        .map((row) => HeadwordRowSchema.parse(row.split(',')))
        .map(([lemma, rank]) => [headwordOf(lemma), rank]),
    )
  } catch (cause) {
    throw malformed(path, cause)
  }
}

const formsOfTeachingList = (directory: string): ReadonlyMap<string, ReadonlySet<string>> => {
  const forms = new Map<string, Set<string>>()
  const rows = readFileSync(lessonsFile(directory, 'ngsl-1.2-lemmatized-for-teaching.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((row) => row !== '' && !row.startsWith('##'))
    .map((row) => row.toLowerCase().split(','))
  for (const [headword = '', ...inflections] of rows) {
    for (const form of [headword, ...inflections]) {
      forms.set(form, new Set([...(forms.get(form) ?? []), headword]))
    }
  }
  return forms
}

export const lessonContentFilesOf = (directory: string): LessonContentFiles => {
  const curriculum = parsedFile(lessonsFile(directory, 'curriculum.json'), CurriculumContentSchema)
  const lexicon = parsedFile(lessonsFile(directory, 'words.json'), LexiconContentSchema)
  return {
    curriculum,
    grammar: parsedFile(lessonsFile(directory, 'grammar.json'), GrammarContentSchema),
    lessons: curriculum.lessonIds.map((lessonId) => lessonOfFile(directory, lessonId, lexicon)),
    lexicon,
    ranks: ranksOfFile(directory),
    forms: formsOfTeachingList(directory),
  }
}
