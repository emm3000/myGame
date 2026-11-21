import { lessonSlotRepositoryContract } from './lessonSlotRepositoryContract.testSupport'
import { MemoryLessonSlots } from './MemoryLessonSlots'

lessonSlotRepositoryContract('MemoryLessonSlots', async () => ({
  lessonSlots: new MemoryLessonSlots(),
  registerTowns: async () => {},
}))
