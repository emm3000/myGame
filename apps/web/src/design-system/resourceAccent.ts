import type { ResourceKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { FoodIcon } from './icons/FoodIcon'
import { GoldIcon } from './icons/GoldIcon'
import { IronIcon } from './icons/IronIcon'
import { PeasantsIcon } from './icons/PeasantsIcon'
import { StoneIcon } from './icons/StoneIcon'
import { WoodIcon } from './icons/WoodIcon'

export type Accent = ResourceKind | 'peasants'

interface AccentStyle {
  readonly Icon: () => ReactElement
  readonly textClass: string
  readonly fillClass: string
}

export const resourceAccent: Readonly<Record<Accent, AccentStyle>> = {
  wood: { Icon: WoodIcon, textClass: 'text-wood', fillClass: 'fill-wood' },
  stone: { Icon: StoneIcon, textClass: 'text-stone', fillClass: 'fill-stone' },
  iron: { Icon: IronIcon, textClass: 'text-iron', fillClass: 'fill-iron' },
  gold: { Icon: GoldIcon, textClass: 'text-gold', fillClass: 'fill-gold' },
  food: { Icon: FoodIcon, textClass: 'text-food', fillClass: 'fill-food' },
  peasants: { Icon: PeasantsIcon, textClass: 'text-peasants', fillClass: 'fill-peasants' },
}
