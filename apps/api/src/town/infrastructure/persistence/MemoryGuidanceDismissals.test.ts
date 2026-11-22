import {
  inMemoryEarnedSkills,
  inMemoryTowns,
  MemoryGuidanceDismissals,
} from '@mygame/domain/testing'
import { guidanceDismissalsContract } from './guidanceDismissalsContract.testSupport'

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
