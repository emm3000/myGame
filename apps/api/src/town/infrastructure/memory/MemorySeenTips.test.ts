import { MemorySeenTips } from './MemorySeenTips'
import { seenTipsContract } from './seenTipsContract.testSupport'

seenTipsContract('MemorySeenTips', async () => {
  const seenTips = new MemorySeenTips()
  return {
    seenTips,
    registerMayors: async () => {},
    seenTipsOf: (playerId) => seenTips.seenTipsOf(playerId),
  }
})
