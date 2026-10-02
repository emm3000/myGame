import { type UnitKind, UnitKindSchema } from '@mygame/contracts'

export const partyKinds: ReadonlyArray<UnitKind> = UnitKindSchema.options.filter(
  (unit) => unit !== 'settler',
)
