import { seenTipsContract } from '../seenTipsContract'
import { MemorySeenTips } from './MemorySeenTips'

seenTipsContract('MemorySeenTips', async () => {
  const seenTips = new MemorySeenTips()
  return {
    seenTips,
    registerMayors: async () => {},
    seenTipsOf: (playerId) => seenTips.seenTipsOf(playerId),
  }
})
