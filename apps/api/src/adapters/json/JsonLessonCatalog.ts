import type { CurriculumContent } from '@mygame/contracts'
import type { LessonId, LessonSkill, LessonWord, WordId } from '@mygame/domain'
import type { LessonLibrary, ShelvedLesson } from '../../learning/LessonLibrary'
import { type LessonOfFiles, type LexiconEntry, lessonContentFilesOf } from './lessonContentFilesOf'

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

export class JsonLessonCatalog implements LessonLibrary {
  constructor(
    private readonly shelved: ReadonlyArray<ShelvedLesson>,
    private readonly headwords: ReadonlySet<string>,
  ) {}

  static fromDirectory(directory: string): JsonLessonCatalog {
    const { curriculum, lessons, ranks } = lessonContentFilesOf(directory)
    return new JsonLessonCatalog(
      lessons.map((lesson, index) => shelvedLessonOf(lesson, index + 1, curriculum)),
      new Set(ranks.keys()),
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
