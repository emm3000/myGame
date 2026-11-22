import {
  type BandStart,
  bandOf,
  type DomainError,
  type HoldoutCheck,
  Instant,
  ok,
  type Result,
} from '@mygame/domain'

export type StoredBandStart = {
  readonly band: number
  readonly startedAt: Date
  readonly heldOutWords: ReadonlyArray<string>
  readonly checks: ReadonlyArray<HoldoutCheck>
}

export const bandStartFromRow = ({
  band,
  startedAt,
  heldOutWords,
  checks,
}: StoredBandStart): Result<BandStart, DomainError> => {
  const known = bandOf(band)
  if (!known.ok) {
    return known
  }
  return ok({
    band: known.value,
    startedAt: Instant.fromEpochMilliseconds(startedAt.getTime()),
    heldOutWords,
    checks,
  })
}
