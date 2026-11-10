import type { ResourceKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { FoodIcon } from './icons/FoodIcon'
import type { IconFrameProps } from './icons/IconFrame'
import { MaterialIcon } from './icons/MaterialIcon'
import { MoneyIcon } from './icons/MoneyIcon'
import { PeopleIcon } from './icons/PeopleIcon'
import { PowerIcon } from './icons/PowerIcon'

export type Accent = ResourceKind | 'people'

type AccentIcon = (props: Pick<IconFrameProps, 'sizeClass'>) => ReactElement

export const resourceAccent: Readonly<Record<Accent, AccentIcon>> = {
  food: FoodIcon,
  money: MoneyIcon,
  power: PowerIcon,
  material: MaterialIcon,
  people: PeopleIcon,
}
