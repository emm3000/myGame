import { inMemoryLessonSlots } from '@mygame/domain/testing'
import { lessonSlotRepositoryContract } from './lessonSlotRepositoryContract.testSupport'

lessonSlotRepositoryContract('inMemoryLessonSlots', async () => ({
  lessonSlots: inMemoryLessonSlots([]),
  registerTowns: async () => {},
}))
