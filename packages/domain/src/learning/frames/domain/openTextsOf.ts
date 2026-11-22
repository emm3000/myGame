import type { Band } from '../../curriculum/domain/Band'
import type { BandCatalog } from '../../curriculum/domain/BandCatalog'
import { stageOf } from '../../curriculum/domain/stageOf'
import type { HeldCard } from '../../domain/HeldCard'
import type { Lesson } from '../../domain/Lesson'
import type { Text } from './Text'

export type TextLearner = {
  readonly curriculum: ReadonlyArray<Lesson>
  readonly cards: ReadonlyArray<HeldCard>
  readonly placedOutBands: ReadonlyArray<Band>
  readonly bands: Pick<BandCatalog, 'bandOfLesson'>
}

export const openTextsOf = (
  texts: ReadonlyArray<Text>,
  { curriculum, cards, placedOutBands, bands }: TextLearner,
): ReadonlyArray<Text> => {
  const stage = stageOf(curriculum, cards, placedOutBands, bands)
  return stage
    .toReversed()
    .flatMap((lessonId) => texts.filter(({ fromLessonId }) => fromLessonId === lessonId))
}
