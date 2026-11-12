import type { BandCatalog } from '../ports/BandCatalog'
import type { Band } from './BandStart'
import type { Lesson } from './Lesson'

export const isLessonPlacedOut = (
  { id }: Lesson,
  placedOutBands: ReadonlyArray<Band>,
  bands: Pick<BandCatalog, 'bandOfLesson'>,
): boolean => {
  const band = bands.bandOfLesson(id)
  return band !== undefined && placedOutBands.includes(band)
}
