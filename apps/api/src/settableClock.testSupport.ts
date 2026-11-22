import { type Clock, Instant } from '@mygame/domain'

export type SettableClock = Clock & { readonly setTo: (iso: string) => void }

export const settableClock = (iso: string): SettableClock => {
  let current = Instant.fromEpochMilliseconds(Date.parse(iso))
  return {
    now: () => current,
    setTo: (next) => {
      current = Instant.fromEpochMilliseconds(Date.parse(next))
    },
  }
}
