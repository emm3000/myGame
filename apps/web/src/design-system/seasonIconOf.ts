import type { SeasonKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { AutumnIcon } from './icons/AutumnIcon'
import { SpringIcon } from './icons/SpringIcon'
import { SummerIcon } from './icons/SummerIcon'
import { WinterIcon } from './icons/WinterIcon'

export const seasonIconOf: Readonly<Record<SeasonKind, () => ReactElement>> = {
  spring: SpringIcon,
  summer: SummerIcon,
  autumn: AutumnIcon,
  winter: WinterIcon,
}
