import type { FiefOfPlayer, Instant } from '@mygame/domain'
import type { GuidanceDismissal, GuidanceDismissals } from '../../guidance/GuidanceDismissals'
import type { MemoryFiefRepository } from './MemoryFiefRepository'

export class MemoryGuidanceDismissals implements GuidanceDismissals {
  constructor(private readonly fiefs: MemoryFiefRepository) {}

  async dismiss({ playerId, fiefId }: FiefOfPlayer, now: Instant): Promise<GuidanceDismissal> {
    const isHeld = this.fiefs
      .heldFiefs()
      .some((fief) => fief.id === fiefId && fief.playerId === playerId)
    if (!isHeld) {
      return 'fiefNotFound'
    }
    this.fiefs.dismissGuidance(fiefId, now)
    return 'dismissed'
  }
}
