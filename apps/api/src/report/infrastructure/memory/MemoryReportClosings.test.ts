import { MemoryReportClosings } from './MemoryReportClosings'
import { reportClosingsContract } from './reportClosingsContract.testSupport'

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
