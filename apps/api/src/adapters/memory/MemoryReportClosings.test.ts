import { reportClosingsContract } from '../reportClosingsContract'
import { MemoryReportClosings } from './MemoryReportClosings'

reportClosingsContract('MemoryReportClosings', async () => {
  const closings = new MemoryReportClosings()
  return {
    closings,
    signUp: (playerId, at) => closings.close(playerId, at),
  }
})
