import type { LessonLibrary } from '../../application/ports/LessonLibrary'
import { jsonBandCatalogOf } from './jsonBandCatalogOf'
import { jsonFrameCatalogOf } from './jsonFrameCatalogOf'
import { jsonLessonCatalogOf } from './jsonLessonCatalogOf'
import { jsonPlacementWordCatalogOf } from './jsonPlacementWordCatalogOf'
import { jsonTextCatalogOf } from './jsonTextCatalogOf'
import { lessonShelfOf } from './lessonShelfOf'
import { readLessonContentFiles } from './readLessonContentFiles'

export const readJsonLessonLibrary = (directory: string): LessonLibrary => {
  const shelf = lessonShelfOf(readLessonContentFiles(directory))
  return {
    ...jsonLessonCatalogOf(shelf),
    ...jsonBandCatalogOf(shelf),
    ...jsonPlacementWordCatalogOf(shelf),
    ...jsonFrameCatalogOf(shelf),
    ...jsonTextCatalogOf(shelf),
  }
}
