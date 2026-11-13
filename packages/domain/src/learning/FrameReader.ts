import type { BandCatalog } from '../ports/BandCatalog'
import type { FrameCatalog } from '../ports/FrameCatalog'
import type { LessonCatalog } from '../ports/LessonCatalog'
import type { Band } from './BandStart'
import type { HeldCard } from './HeldCard'
import type { Scaffold } from './Scaffold'

export type FrameReader = {
  readonly cards: ReadonlyArray<HeldCard>
  readonly placedOutBands: ReadonlyArray<Band>
  readonly scaffold: Scaffold
  readonly lessons: Pick<LessonCatalog, 'lessonOfWord'> &
    Pick<BandCatalog, 'bandOfLesson'> &
    FrameCatalog
}
