import type { HeldCard } from './HeldCard'
import type { Scaffold } from './Scaffold'

export type SupportLevel = {
  readonly shown: 'beside' | 'onTap'
  readonly help: 'gloss' | 'definition'
}

export const ON_TAP_STABILITY_DAYS = 7

export const DEFINITION_STABILITY_DAYS = 30

const stabilityDaysOf = (held: HeldCard | undefined, isPlacedOut: boolean): number => {
  if (held === undefined) {
    return isPlacedOut ? ON_TAP_STABILITY_DAYS : 0
  }
  return held.card.stored.stability ?? 0
}

export const supportLevelOf = (
  held: HeldCard | undefined,
  isPlacedOut: boolean,
  scaffold: Scaffold,
): SupportLevel => {
  const stabilityDays = stabilityDaysOf(held, isPlacedOut)
  const shown = stabilityDays < ON_TAP_STABILITY_DAYS ? 'beside' : 'onTap'
  if (scaffold === 'none') {
    return { shown, help: 'definition' }
  }
  return { shown, help: stabilityDays < DEFINITION_STABILITY_DAYS ? 'gloss' : 'definition' }
}
