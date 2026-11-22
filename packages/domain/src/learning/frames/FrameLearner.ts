import type { Band } from '../curriculum/Band'
import type { BandCatalog } from '../curriculum/ports/BandCatalog'
import type { LessonCatalog } from '../curriculum/ports/LessonCatalog'
import type { HeldCards } from '../HeldCards'
import type { Scaffold } from '../scaffold/Scaffold'
import type { FrameCatalog } from './ports/FrameCatalog'

export type FrameLearner = {
  readonly cards: HeldCards
  readonly placedOutBands: ReadonlyArray<Band>
  readonly scaffold: Scaffold
  readonly lessons: Pick<LessonCatalog, 'lessonOfWord'> &
    Pick<BandCatalog, 'bandOfLesson'> &
    FrameCatalog
}
