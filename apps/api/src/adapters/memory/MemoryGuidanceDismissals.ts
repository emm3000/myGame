import type { FiefId, FiefOfPlayer, Instant } from '@mygame/domain'
import type { GuidanceDismissal, GuidanceDismissals } from '../../guidance/GuidanceDismissals'
import type { MemoryFiefRepository } from './MemoryFiefRepository'

export class MemoryGuidanceDismissals implements GuidanceDismissals {
  private readonly dismissed = new Map<FiefId, Instant>()

  constructor(private readonly fiefs: MemoryFiefRepository) {}

  async dismiss({ playerId, fiefId }: FiefOfPlayer, now: Instant): Promise<GuidanceDismissal> {
    const isHeld = this.fiefs
      .heldFiefs()
      .some((fief) => fief.id === fiefId && fief.playerId === playerId)
    if (!isHeld) {
      return 'fiefNotFound'
    }
    this.dismissed.set(fiefId, now)
    return 'dismissed'
  }

  async isDismissed(fiefId: FiefId): Promise<boolean> {
    return this.dismissed.has(fiefId)
  }
}
