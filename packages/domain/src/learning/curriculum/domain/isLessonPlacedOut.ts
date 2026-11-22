import type { Lesson } from '../../domain/Lesson'
import type { Band } from './Band'
import type { BandCatalog } from './BandCatalog'

export const isLessonPlacedOut = (
  { id }: Pick<Lesson, 'id'>,
  placedOutBands: ReadonlyArray<Band>,
  bands: Pick<BandCatalog, 'bandOfLesson'>,
): boolean => {
  const band = bands.bandOfLesson(id)
  return band !== undefined && placedOutBands.includes(band)
}
