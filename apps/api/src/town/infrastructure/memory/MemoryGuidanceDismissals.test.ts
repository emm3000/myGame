import { guidanceDismissalsContract } from './guidanceDismissalsContract.testSupport'
import { MemoryEarnedSkillRepository } from './MemoryEarnedSkillRepository'
import { MemoryGuidanceDismissals } from './MemoryGuidanceDismissals'
import { MemoryTownRepository } from './MemoryTownRepository'

guidanceDismissalsContract('MemoryGuidanceDismissals', async () => {
  const towns = new MemoryTownRepository(new MemoryEarnedSkillRepository())
  const dismissals = new MemoryGuidanceDismissals(towns)
  return {
    dismissals,
    towns,
    registerPlayers: async () => {},
    dismissedAtOf: (playerId) => dismissals.dismissedAt(playerId),
  }
})
