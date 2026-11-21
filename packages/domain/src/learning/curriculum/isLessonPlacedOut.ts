import type { Lesson } from '../Lesson'
import type { Band } from './BandStart'
import type { BandCatalog } from './ports/BandCatalog'

export const isLessonPlacedOut = (
  { id }: Pick<Lesson, 'id'>,
  placedOutBands: ReadonlyArray<Band>,
  bands: Pick<BandCatalog, 'bandOfLesson'>,
): boolean => {
  const band = bands.bandOfLesson(id)
  return band !== undefined && placedOutBands.includes(band)
}
