import type { ResourceKind } from '@mygame/contracts'
import type { ResourceKind as TownResourceKind } from '@mygame/contracts/town'
import type { ReactElement } from 'react'
import { FoodIcon } from './icons/FoodIcon'
import { GoldIcon } from './icons/GoldIcon'
import type { IconFrameProps } from './icons/IconFrame'
import { IronIcon } from './icons/IronIcon'
import { MaterialIcon } from './icons/MaterialIcon'
import { MoneyIcon } from './icons/MoneyIcon'
import { PeasantsIcon } from './icons/PeasantsIcon'
import { PeopleIcon } from './icons/PeopleIcon'
import { PowerIcon } from './icons/PowerIcon'
import { StoneIcon } from './icons/StoneIcon'
import { WoodIcon } from './icons/WoodIcon'

export type Accent = ResourceKind | TownResourceKind | 'peasants' | 'people'

type AccentIcon = (props: Pick<IconFrameProps, 'sizeClass'>) => ReactElement

export const resourceAccent: Readonly<Record<Accent, AccentIcon>> = {
  wood: WoodIcon,
  stone: StoneIcon,
  iron: IronIcon,
  gold: GoldIcon,
  food: FoodIcon,
  peasants: PeasantsIcon,
  money: MoneyIcon,
  power: PowerIcon,
  material: MaterialIcon,
  people: PeopleIcon,
}
