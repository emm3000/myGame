import type { Band } from '../curriculum/BandStart'
import type { BandCatalog } from '../curriculum/ports/BandCatalog'
import { stageOf } from '../curriculum/stageOf'
import type { HeldCard } from '../HeldCard'
import type { Lesson } from '../Lesson'
import type { Text } from './Text'

export type TextReader = {
  readonly curriculum: ReadonlyArray<Lesson>
  readonly cards: ReadonlyArray<HeldCard>
  readonly placedOutBands: ReadonlyArray<Band>
  readonly bands: Pick<BandCatalog, 'bandOfLesson'>
}

export const openTextsOf = (
  texts: ReadonlyArray<Text>,
  { curriculum, cards, placedOutBands, bands }: TextReader,
): ReadonlyArray<Text> => {
  const stage = stageOf(curriculum, cards, placedOutBands, bands)
  return stage
    .toReversed()
    .flatMap((lessonId) => texts.filter(({ fromLessonId }) => fromLessonId === lessonId))
}
