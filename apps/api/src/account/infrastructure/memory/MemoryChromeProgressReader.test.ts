import { chromeProgressContract } from './chromeProgressReaderContract.testSupport'
import { MemoryChromeProgress } from './MemoryChromeProgressReader'

chromeProgressContract('MemoryChromeProgress', async () => {
  const progress = new MemoryChromeProgress()
  return {
    progress,
    signUp: async (playerId) => progress.addPlayer(playerId),
    holdCard: async (playerId, wordId) => progress.holdCard(playerId, wordId),
    earnSkill: async (playerId, lessonId) => progress.earnSkill(playerId, lessonId),
    foundTown: async (playerId) => progress.foundTown(playerId),
    runLesson: async (playerId, lessonId, finishesAt) =>
      progress.runLesson(playerId, lessonId, finishesAt),
  }
})
