import type { CurriculumContent } from '@mygame/contracts'
import {
  type Band,
  type BandWord,
  headwordOf,
  type LessonId,
  type LessonSkill,
  type LessonWord,
  type PlacementWord,
  type WordId,
} from '@mygame/domain'
import { frameWordsOf } from '../../contentGate/frameWordsOf'
import { isUnitLesson } from '../../contentGate/isUnitLesson'
import type { LessonLibrary, ShelvedLesson } from '../../learning/LessonLibrary'
import { bandOfRank } from './bandOfRank'
import {
  type LessonContentFiles,
  type LessonOfFiles,
  type LexiconEntry,
  lessonContentFilesOf,
} from './lessonContentFilesOf'

const skillAt = (position: number, { skill }: CurriculumContent): LessonSkill => {
  const resource = skill.cycle[(position - 1) % skill.cycle.length]
  if (resource === undefined) {
    throw new Error(`The skill cycle has no resource for lesson ${position}`)
  }
  return { resource, ratePercent: skill.ratePercent }
}

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
  position: number,
  curriculum: CurriculumContent,
): ShelvedLesson => ({
  id: content.id,
  theme: content.theme,
  durationSeconds: content.durationSeconds,
  requiredSchoolLevel: content.requiredSchoolLevel,
  skill: skillAt(position, curriculum),
  words: words.map((entry) => lessonWordOf(content.id, entry)),
})

const bandOfTaughtLesson = (
  { content, words }: LessonOfFiles,
  ranks: ReadonlyMap<string, number>,
): Band => {
  const wordRanks = words.flatMap(({ lemma }) => ranks.get(headwordOf(lemma)) ?? [])
  if (wordRanks.length === 0) {
    throw new Error(`Lesson ${content.id} teaches no word of the list`)
  }
  return bandOfRank(Math.min(...wordRanks))
}

const lessonBandsOf = ({
  curriculum,
  lessons,
  ranks,
}: LessonContentFiles): ReadonlyMap<LessonId, Band> =>
  new Map(
    lessons
      .slice(curriculum.chromeLessonCount)
      .filter((lesson) => !isUnitLesson(lesson))
      .map((lesson) => [lesson.content.id, bandOfTaughtLesson(lesson, ranks)]),
  )

const bandWordsOf = ({
  curriculum,
  grammar,
  lessons,
  ranks,
}: LessonContentFiles): ReadonlyMap<Band, ReadonlyArray<BandWord>> => {
  const frameWords = frameWordsOf(grammar)
  const chromeWords = new Set(
    lessons
      .slice(0, curriculum.chromeLessonCount)
      .flatMap(({ words }) => words.map(({ lemma }) => headwordOf(lemma))),
  )
  const bands = new Map<Band, ReadonlyArray<BandWord>>()
  for (const [headword, rank] of ranks) {
    if (!frameWords.has(headword)) {
      const band = bandOfRank(rank)
      const word = { headword, isChrome: chromeWords.has(headword) }
      bands.set(band, [...(bands.get(band) ?? []), word])
    }
  }
  return bands
}

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
  ) {}

  static fromDirectory(directory: string): JsonLessonCatalog {
    const files = lessonContentFilesOf(directory)
    const shelved = files.lessons.map((lesson, index) =>
      shelvedLessonOf(lesson, index + 1, files.curriculum),
    )
    const chromeShelf = shelved.slice(0, files.curriculum.chromeLessonCount)
    return new JsonLessonCatalog(
      shelved,
      new Set(files.ranks.keys()),
      lessonBandsOf(files),
      bandWordsOf(files),
      placementWordsOf(files, chromeShelf),
      chromeShelf,
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
}
