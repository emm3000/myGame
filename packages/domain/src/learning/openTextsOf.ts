import type { BandCatalog } from '../ports/BandCatalog'
import type { Band } from './BandStart'
import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'
import { stageOf } from './stageOf'
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
