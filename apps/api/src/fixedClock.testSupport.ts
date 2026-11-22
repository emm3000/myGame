import { type Clock, Instant } from '@mygame/domain'

export const fixedClock = (iso: string): Clock => ({
  now: () => Instant.fromEpochMilliseconds(Date.parse(iso)),
})
