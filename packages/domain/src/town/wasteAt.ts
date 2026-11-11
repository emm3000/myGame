import type { Instant } from '../time/Instant'
import type { WasteSizeTerms } from './TownSettings'

const MILLISECONDS_PER_HOUR = 3_600_000

export const wasteAt = (
  size: WasteSizeTerms,
  lastCleanedAt: Instant | undefined,
  at: Instant,
): number => {
  if (lastCleanedAt === undefined) {
    return size.maxWaste
  }
  const elapsedMilliseconds = Math.max(0, at.epochMilliseconds - lastCleanedAt.epochMilliseconds)
  const regrown = Math.floor(
    (size.maxWaste * elapsedMilliseconds) / (size.regrowHours * MILLISECONDS_PER_HOUR),
  )
  return Math.min(size.maxWaste, regrown)
}
