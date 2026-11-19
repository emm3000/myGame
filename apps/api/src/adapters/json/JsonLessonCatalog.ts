import type { CurriculumContent } from '@mygame/contracts'
import {
  type Band,
  type BandWord,
  type FrameToken,
  headwordOf,
  type LessonId,
  type LessonWord,
  type PlacementWord,
  type Text,
  type TextId,
  type WordId,
} from '@mygame/domain'
import { frameWordsOf } from '../../contentGate/frameWordsOf'
import type { LessonLibrary, ShelvedLesson } from '../../learning/LessonLibrary'
import { bandOfRank } from './bandOfRank'
import { bandWordsOf } from './bandWordsOf'
import { lessonBandsOf } from './lessonBandsOf'
import {
  type LessonContentFiles,
  type LessonOfFiles,
  type LexiconEntry,
  lessonContentFilesOf,
} from './lessonContentFilesOf'
import { type ResolvedFrames, resolvedFramesOf } from './resolvedFramesOf'

const lessonWordOf = (lessonId: LessonId, entry: LexiconEntry): LessonWord => {
  if (entry.gloss.es === undefined) {
    throw new Error(`Word ${entry.id} of lesson ${lessonId} has no es gloss`)
  }
  if (entry.definition === undefined) {
    throw new Error(`Word ${entry.id} of lesson ${lessonId} has no definition`)
  }
  return {
    id: entry.id,
    acceptedForms: [entry.lemma, ...(entry.acceptedForms ?? [])],
    gloss: entry.gloss.es,
    definition: entry.definition,
    frames: entry.frames,
  }
}

const shelvedLessonOf = (
  { content, words }: LessonOfFiles,
  { skill }: CurriculumContent,
): ShelvedLesson => ({
  id: content.id,
  theme: content.theme,
  durationSeconds: content.durationSeconds,
  requiredSchoolLevel: content.requiredSchoolLevel,
  skill: { resource: skill.resource, ratePercent: skill.ratePercent },
  words: words.map((entry) => lessonWordOf(content.id, entry)),
})

const placementWordsOf = (
  { grammar, lexicon, ranks }: LessonContentFiles,
  chromeLessons: ReadonlyArray<ShelvedLesson>,
): ReadonlyMap<Band, ReadonlyArray<PlacementWord>> => {
  const chromeWordIds = new Set(chromeLessons.flatMap(({ words }) => words.map(({ id }) => id)))
  const frameWords = frameWordsOf(grammar)
  const bands = new Map<Band, ReadonlyArray<PlacementWord>>()
  for (const { id, lemma, gloss, definition } of lexicon) {
    const headword = headwordOf(lemma)
    const rank = ranks.get(headword)
    const es = gloss.es
    const isPlaceable = es !== undefined && definition !== undefined && !frameWords.has(headword)
    if (rank !== undefined && isPlaceable) {
      const band = bandOfRank(rank)
      const word = {
        id,
        headword,
        word: lemma,
        gloss: es,
        definition,
        isChrome: chromeWordIds.has(id),
      }
      bands.set(band, [...(bands.get(band) ?? []), word])
    }
  }
  return bands
}

export class JsonLessonCatalog implements LessonLibrary {
  constructor(
    private readonly shelved: ReadonlyArray<ShelvedLesson>,
    private readonly headwords: ReadonlySet<string>,
    private readonly lessonBands: ReadonlyMap<LessonId, Band>,
    private readonly bandWords: ReadonlyMap<Band, ReadonlyArray<BandWord>>,
    private readonly placementWords: ReadonlyMap<Band, ReadonlyArray<PlacementWord>>,
    private readonly chromeShelf: ReadonlyArray<ShelvedLesson>,
    private readonly resolvedFrames: ResolvedFrames,
    private readonly shelvedTexts: ReadonlyArray<Text>,
  ) {}

  static fromDirectory(directory: string): JsonLessonCatalog {
    const files = lessonContentFilesOf(directory)
    const shelved = files.lessons.map((lesson) => shelvedLessonOf(lesson, files.curriculum))
    const chromeShelf = shelved.slice(0, files.curriculum.chromeLessonCount)
    return new JsonLessonCatalog(
      shelved,
      new Set(files.ranks.keys()),
      lessonBandsOf(files),
      bandWordsOf(files),
      placementWordsOf(files, chromeShelf),
      chromeShelf,
      resolvedFramesOf(files),
      files.texts.map(({ id, fromLessonId, title, sentences }) => ({
        id,
        fromLessonId,
        title,
        sentences,
      })),
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

  bandOfLesson(lessonId: LessonId): Band | undefined {
    return this.lessonBands.get(lessonId)
  }

  wordsOfBand(band: Band): ReadonlyArray<BandWord> {
    return this.bandWords.get(band) ?? []
  }

  hasLessons(band: Band): boolean {
    return [...this.lessonBands.values()].includes(band)
  }

  placementWordsOf(band: Band): ReadonlyArray<PlacementWord> {
    return this.placementWords.get(band) ?? []
  }

  lessons(): ReadonlyArray<ShelvedLesson> {
    return this.shelved
  }

  chromeLessons(): ReadonlyArray<ShelvedLesson> {
    return this.chromeShelf
  }

  frameTokensOf(wordId: WordId, frame: string): ReadonlyArray<FrameToken> | undefined {
    return this.resolvedFrames.tokens.get(wordId)?.get(frame)
  }

  answerFormsOf(wordId: WordId): ReadonlySet<string> {
    return this.resolvedFrames.answerForms.get(wordId) ?? new Set()
  }

  texts(): ReadonlyArray<Text> {
    return this.shelvedTexts
  }

  textTokensOf(textId: TextId, passage: string): ReadonlyArray<FrameToken> | undefined {
    return this.resolvedFrames.textTokens.get(textId)?.get(passage)
  }
}
