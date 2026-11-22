import type { Band } from '../../curriculum/domain/Band'
import type { BandCatalog } from '../../curriculum/domain/BandCatalog'
import type { LessonCatalog } from '../../curriculum/domain/LessonCatalog'
import type { HeldCards } from '../../domain/HeldCards'
import type { Scaffold } from '../../scaffold/domain/Scaffold'
import type { FrameCatalog } from './FrameCatalog'

export type FrameLearner = {
  readonly cards: HeldCards
  readonly placedOutBands: ReadonlyArray<Band>
  readonly scaffold: Scaffold
  readonly lessons: Pick<LessonCatalog, 'lessonOfWord'> &
    Pick<BandCatalog, 'bandOfLesson'> &
    FrameCatalog
}
