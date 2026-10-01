import type { UnitKind } from '@mygame/contracts'

export function byUnitKind<T>(valueFor: (unit: UnitKind) => T): Readonly<Record<UnitKind, T>> {
  return { infantry: valueFor('infantry'), cavalry: valueFor('cavalry') }
}
