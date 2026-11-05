import { lessonSlotRepositoryContract } from '../lessonSlotRepositoryContract'
import { MemoryLessonSlots } from './MemoryLessonSlots'

lessonSlotRepositoryContract('MemoryLessonSlots', async () => ({
  lessonSlots: new MemoryLessonSlots(),
  registerTowns: async () => {},
}))
