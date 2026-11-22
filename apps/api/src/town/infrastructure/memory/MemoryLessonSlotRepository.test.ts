import { lessonSlotRepositoryContract } from './lessonSlotRepositoryContract.testSupport'
import { MemoryLessonSlots } from './MemoryLessonSlotRepository'

lessonSlotRepositoryContract('MemoryLessonSlots', async () => ({
  lessonSlots: new MemoryLessonSlots(),
  registerTowns: async () => {},
}))
