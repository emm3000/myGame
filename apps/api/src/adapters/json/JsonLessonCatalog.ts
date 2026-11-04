import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type LessonContent, LessonContentSchema } from '@mygame/contracts'
import type { LessonId, WordId } from '@mygame/domain'
import { z } from 'zod'
import type { LessonLibrary, ShelvedLesson } from '../../learning/LessonLibrary'

const lessonFiles: ReadonlyArray<string> = [join('lessons', 'lesson-1.json')]

const headwordFile = join('lessons', 'ngsl-1.2.csv')

const headwordHeader = 'Lemma,SFI Rank,SFI,Adjusted Frequency per Million (U)'

const HeadwordRowSchema = z.tuple([
  z.string().regex(/^[A-Za-z]+$/),
  z.string().regex(/^[1-9]\d*$/),
  z.string().regex(/^\d+(\.\d+)?$/),
  z.string().regex(/^\d+(\.\d+)?$/),
])

const malformed = (path: string, cause: unknown): Error =>
  new Error(`Content file ${path} is malformed`, { cause })

const shelvedLessonOf = (content: LessonContent): ShelvedLesson => ({
  id: content.id,
  theme: content.theme,
  durationSeconds: content.durationSeconds,
  requiredLibraryLevel: content.requiredLibraryLevel,
  skill: { ...content.skill },
  words: content.words.map(({ id, lemma, frame, gappedFrame, gloss }) => ({
    id,
    acceptedForms: [lemma],
    gloss: gloss.es,
    frame,
    gappedFrame,
  })),
})

const lessonOfFile = (directory: string, file: string): ShelvedLesson => {
  const path = join(directory, file)
  try {
    return shelvedLessonOf(LessonContentSchema.parse(JSON.parse(readFileSync(path, 'utf8'))))
  } catch (cause) {
    throw malformed(path, cause)
  }
}

const headwordsOfFile = (directory: string): ReadonlySet<string> => {
  const path = join(directory, headwordFile)
  const [header, ...rows] = readFileSync(path, 'utf8').split(/\r?\n/)
  if (header !== headwordHeader) {
    throw malformed(path, new Error(`unexpected header ${header}`))
  }
  try {
    return new Set(
      rows
        .filter((row) => row !== '')
        .map((row) => HeadwordRowSchema.parse(row.split(','))[0].toLowerCase()),
    )
  } catch (cause) {
    throw malformed(path, cause)
  }
}

export class JsonLessonCatalog implements LessonLibrary {
  constructor(
    private readonly shelved: ReadonlyArray<ShelvedLesson>,
    private readonly headwords: ReadonlySet<string>,
  ) {}

  static fromDirectory(directory: string): JsonLessonCatalog {
    return new JsonLessonCatalog(
      lessonFiles.map((file) => lessonOfFile(directory, file)),
      headwordsOfFile(directory),
    )
  }

  lessonOf(lessonId: LessonId): ShelvedLesson | undefined {
    return this.shelved.find(({ id }) => id === lessonId)
  }

  lessonOfWord(wordId: WordId): ShelvedLesson | undefined {
    return this.shelved.find(({ words }) => words.some(({ id }) => id === wordId))
  }

  isHeadword(word: string): boolean {
    return this.headwords.has(word.toLowerCase())
  }

  lessons(): ReadonlyArray<ShelvedLesson> {
    return this.shelved
  }
}
