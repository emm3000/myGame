import type { UnitKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { CavalryIcon } from './icons/CavalryIcon'
import { InfantryIcon } from './icons/InfantryIcon'

export const unitIconOf: Readonly<Record<UnitKind, () => ReactElement>> = {
  infantry: InfantryIcon,
  cavalry: CavalryIcon,
}
