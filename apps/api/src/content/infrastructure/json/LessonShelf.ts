import type {
  Band,
  BandWord,
  KeepGoingTerms,
  LessonId,
  PlacementWord,
  ShelvedLesson,
  Text,
} from '@mygame/domain'
import type { ResolvedFrames } from './resolvedFramesOf'

export type LessonShelf = {
  readonly lessons: ReadonlyArray<ShelvedLesson>
  readonly chromeLessons: ReadonlyArray<ShelvedLesson>
  readonly headwords: ReadonlySet<string>
  readonly lessonBands: ReadonlyMap<LessonId, Band>
  readonly bandWords: ReadonlyMap<Band, ReadonlyArray<BandWord>>
  readonly placementWords: ReadonlyMap<Band, ReadonlyArray<PlacementWord>>
  readonly resolvedFrames: ResolvedFrames
  readonly texts: ReadonlyArray<Text>
  readonly keepGoing: KeepGoingTerms
}
