import type { FiefOverview } from '@mygame/contracts'

export function isQueueFull({ slot, queue }: FiefOverview): boolean {
  return slot.kind === 'busy' && queue.entries.length >= queue.cap
}
