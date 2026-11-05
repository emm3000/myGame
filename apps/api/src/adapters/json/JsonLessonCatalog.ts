import type { CurriculumContent } from '@mygame/contracts'
import type {
  Band,
  BandWord,
  Headword,
  LessonId,
  LessonSkill,
  LessonWord,
  WordId,
} from '@mygame/domain'
import { frameWordsOf } from '../../contentGate/frameWordsOf'
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
  return {
    id: entry.id,
    acceptedForms: [entry.lemma, ...(entry.acceptedForms ?? [])],
    gloss: entry.gloss.es,
    frame: entry.frame,
    gappedFrame: entry.gappedFrame,
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

const headwordOf = ({ lemma }: LexiconEntry): Headword => lemma.toLowerCase()

const bandOfTaughtLesson = (
  { content, words }: LessonOfFiles,
  ranks: ReadonlyMap<string, number>,
): Band => {
  const wordRanks = words.flatMap((entry) => ranks.get(headwordOf(entry)) ?? [])
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
    lessons.slice(0, curriculum.chromeLessonCount).flatMap(({ words }) => words.map(headwordOf)),
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

export class JsonLessonCatalog implements LessonLibrary {
  constructor(
    private readonly shelved: ReadonlyArray<ShelvedLesson>,
    private readonly headwords: ReadonlySet<string>,
    private readonly lessonBands: ReadonlyMap<LessonId, Band>,
    private readonly bandWords: ReadonlyMap<Band, ReadonlyArray<BandWord>>,
  ) {}

  static fromDirectory(directory: string): JsonLessonCatalog {
    const files = lessonContentFilesOf(directory)
    return new JsonLessonCatalog(
      files.lessons.map((lesson, index) => shelvedLessonOf(lesson, index + 1, files.curriculum)),
      new Set(files.ranks.keys()),
      lessonBandsOf(files),
      bandWordsOf(files),
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

  lessons(): ReadonlyArray<ShelvedLesson> {
    return this.shelved
  }
}
