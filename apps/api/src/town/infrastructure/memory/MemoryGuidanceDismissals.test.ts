import { inMemoryEarnedSkills, inMemoryTowns } from '@mygame/domain/testing'
import { guidanceDismissalsContract } from './guidanceDismissalsContract.testSupport'
import { MemoryGuidanceDismissals } from './MemoryGuidanceDismissals'

guidanceDismissalsContract('MemoryGuidanceDismissals', async () => {
  const towns = inMemoryTowns([], inMemoryEarnedSkills([]))
  const dismissals = new MemoryGuidanceDismissals(towns)
  return {
    dismissals,
    towns,
    registerPlayers: async () => {},
    dismissedAtOf: (playerId) => dismissals.dismissedAt(playerId),
  }
})
