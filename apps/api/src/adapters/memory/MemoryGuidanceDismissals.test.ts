import { guidanceDismissalsContract } from '../guidanceDismissalsContract'
import { MemoryEarnedSkills } from './MemoryEarnedSkills'
import { MemoryGuidanceDismissals } from './MemoryGuidanceDismissals'
import { MemoryTownRepository } from './MemoryTownRepository'

guidanceDismissalsContract('MemoryGuidanceDismissals', async () => {
  const towns = new MemoryTownRepository(new MemoryEarnedSkills())
  const dismissals = new MemoryGuidanceDismissals(towns)
  return {
    dismissals,
    towns,
    registerPlayers: async () => {},
    dismissedAtOf: (playerId) => dismissals.dismissedAt(playerId),
  }
})
