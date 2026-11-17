import { levelWordNeedOf } from '@mygame/domain'
import { countedWordsOf } from './countedWordsOf'
import type { GateContent } from './GateContent'

const shortfallOf = (
  content: GateContent,
  schoolLevel: number,
  topSchoolLevel: number,
): ReadonlyArray<string> => {
  const level = Math.min(schoolLevel + 1, topSchoolLevel)
  const need = levelWordNeedOf(level, content.wordNeed)
  const counted = countedWordsOf(content, schoolLevel)
  if (need === null || counted >= need.count) {
    return []
  }
  return [
    `school level ${schoolLevel} counts ${counted} words, short of the ${need.count} level ${level} needs`,
  ]
}

export const checkWordNeed = (content: GateContent): ReadonlyArray<string> => {
  const topSchoolLevel = Math.max(...content.schoolLevels)
  return content.schoolLevels.flatMap((schoolLevel) =>
    shortfallOf(content, schoolLevel, topSchoolLevel),
  )
}
