import { guidanceDismissalsContract } from '../guidanceDismissalsContract'
import { MemoryFiefRepository } from './MemoryFiefRepository'
import { MemoryGuidanceDismissals } from './MemoryGuidanceDismissals'

guidanceDismissalsContract('MemoryGuidanceDismissals', async () => {
  const fiefs = new MemoryFiefRepository()
  return {
    dismissals: new MemoryGuidanceDismissals(fiefs),
    fiefs,
    registerPlayers: async () => {},
  }
})
