import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { type CurriculumContent, CurriculumContentSchema } from '@mygame/contracts'

const curriculumFile = fileURLToPath(
  new URL('../../../content/lessons/curriculum.json', import.meta.url),
)

export const shippedCurriculum: CurriculumContent = CurriculumContentSchema.parse(
  JSON.parse(readFileSync(curriculumFile, 'utf8')),
)
