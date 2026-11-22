import { lessonSlotRepositoryContract } from './lessonSlotRepositoryContract.testSupport'
import { MemoryLessonSlotRepository } from './MemoryLessonSlotRepository'

lessonSlotRepositoryContract('MemoryLessonSlotRepository', async () => ({
  lessonSlots: new MemoryLessonSlotRepository(),
  registerTowns: async () => {},
}))
