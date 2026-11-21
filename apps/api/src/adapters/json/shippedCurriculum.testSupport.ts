import { readFileSync } from 'node:fs'
import { type CurriculumContent, CurriculumContentSchema } from '@mygame/contracts'
import { apiPackagePath } from '../../apiPackagePath.testSupport'

const curriculumFile = apiPackagePath('content/lessons/curriculum.json')

export const shippedCurriculum: CurriculumContent = CurriculumContentSchema.parse(
  JSON.parse(readFileSync(curriculumFile, 'utf8')),
)
