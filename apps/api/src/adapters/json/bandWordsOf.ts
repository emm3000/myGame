import { type Band, type BandWord, headwordOf } from '@mygame/domain'
import { frameWordsOf } from '../../contentGate/frameWordsOf'
import { bandOfRank } from './bandOfRank'
import type { LessonContentFiles } from './lessonContentFilesOf'

export const bandWordsOf = ({
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
