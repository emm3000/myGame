import type { CurriculumContent } from '@mygame/contracts'
import {
  type Band,
  headwordOf,
  type LessonId,
  type LessonWord,
  type PlacementWord,
} from '@mygame/domain'
import type { ShelvedLesson } from '../../application/ports/LessonLibrary'
import { bandOfRank } from './bandOfRank'
import { bandWordsOf } from './bandWordsOf'
import { frameWordsOf } from './frameWordsOf'
import type { LessonShelf } from './LessonShelf'
import { lessonBandsOf } from './lessonBandsOf'
import type { LessonContentFiles, LessonOfFiles, LexiconEntry } from './readLessonContentFiles'
import { resolvedFramesOf } from './resolvedFramesOf'

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

export const lessonShelfOf = (files: LessonContentFiles): LessonShelf => {
  const lessons = files.lessons.map((lesson) => shelvedLessonOf(lesson, files.curriculum))
  const chromeLessons = lessons.slice(0, files.curriculum.chromeLessonCount)
  return {
    lessons,
    chromeLessons,
    headwords: new Set(files.ranks.keys()),
    lessonBands: lessonBandsOf(files),
    bandWords: bandWordsOf(files),
    placementWords: placementWordsOf(files, chromeLessons),
    resolvedFrames: resolvedFramesOf(files),
    texts: files.texts.map(({ id, fromLessonId, title, sentences }) => ({
      id,
      fromLessonId,
      title,
      sentences,
    })),
  }
}
