import { fiefRepositoryContract } from '../fiefRepositoryContract'
import { MemoryFiefRepository } from './MemoryFiefRepository'
import { MemoryGuidanceDismissals } from './MemoryGuidanceDismissals'

fiefRepositoryContract('MemoryFiefRepository', async () => {
  const fiefs = new MemoryFiefRepository()
  return {
    fiefs,
    dismissals: new MemoryGuidanceDismissals(fiefs),
    registerPlayers: async () => {},
    freezeSkills: async (playerId, skills) => fiefs.freezeSkills(playerId, skills),
  }
})
