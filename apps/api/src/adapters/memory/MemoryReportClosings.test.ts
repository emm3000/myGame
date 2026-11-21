import { reportClosingsContract } from '../reportClosingsContract'
import { MemoryReportClosings } from './MemoryReportClosings'

reportClosingsContract('MemoryReportClosings', async () => {
  const closings = new MemoryReportClosings()
  return {
    closings,
    signUp: async (playerId, at) => {
      await closings.serve(playerId, at)
      await closings.close(playerId)
    },
  }
})
