import type { BandCatalog } from '../ports/BandCatalog'
import type { FrameCatalog } from '../ports/FrameCatalog'
import type { LessonCatalog } from '../ports/LessonCatalog'
import type { Band } from './BandStart'
import type { HeldCards } from './HeldCards'
import type { Scaffold } from './Scaffold'

export type FrameReader = {
  readonly cards: HeldCards
  readonly placedOutBands: ReadonlyArray<Band>
  readonly scaffold: Scaffold
  readonly lessons: Pick<LessonCatalog, 'lessonOfWord'> &
    Pick<BandCatalog, 'bandOfLesson'> &
    FrameCatalog
}
