import type { ResourceKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { FoodIcon } from './icons/FoodIcon'
import { GoldIcon } from './icons/GoldIcon'
import type { IconFrameProps } from './icons/IconFrame'
import { IronIcon } from './icons/IronIcon'
import { PeasantsIcon } from './icons/PeasantsIcon'
import { StoneIcon } from './icons/StoneIcon'
import { WoodIcon } from './icons/WoodIcon'

export type Accent = ResourceKind | 'peasants'

interface AccentStyle {
  readonly Icon: (props: Pick<IconFrameProps, 'sizeClass'>) => ReactElement
  readonly textClass: string
  readonly fillClass: string
}

export const resourceAccent: Readonly<Record<Accent, AccentStyle>> = {
  wood: { Icon: WoodIcon, textClass: 'text-material', fillClass: 'fill-material' },
  stone: { Icon: StoneIcon, textClass: 'text-material', fillClass: 'fill-material' },
  iron: { Icon: IronIcon, textClass: 'text-material', fillClass: 'fill-material' },
  gold: { Icon: GoldIcon, textClass: 'text-money', fillClass: 'fill-money' },
  food: { Icon: FoodIcon, textClass: 'text-food', fillClass: 'fill-food' },
  peasants: { Icon: PeasantsIcon, textClass: 'text-people', fillClass: 'fill-people' },
}
