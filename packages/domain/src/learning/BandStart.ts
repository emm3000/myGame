import type { Instant } from '../time/Instant'

export type Band = number

export type Headword = string

export type BandWord = {
  readonly headword: Headword
  readonly isChrome: boolean
}

export type BandStart = {
  readonly band: Band
  readonly startedAt: Instant
  readonly heldOutWords: ReadonlyArray<Headword>
}
