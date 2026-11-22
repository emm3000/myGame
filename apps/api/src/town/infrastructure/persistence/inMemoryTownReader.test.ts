import {
  inMemoryBandStarts,
  inMemoryCards,
  inMemoryEarnedSkills,
  inMemoryLessonSlots,
  inMemoryTownReader,
  inMemoryTowns,
} from '@mygame/domain/testing'
import { townReaderContract } from './townReaderContract.testSupport'

townReaderContract('inMemoryTownReader', async () => {
  const towns = inMemoryTowns([], inMemoryEarnedSkills([]))
  const lessonSlots = inMemoryLessonSlots([])
  return {
    reader: inMemoryTownReader(
      { towns, lessonSlots, cards: inMemoryCards([]), bandStarts: inMemoryBandStarts([]) },
      { scaffold: 'es', scaffoldVersion: 1 },
    ),
    towns,
    lessonSlots,
    registerPlayers: async () => {},
  }
})
