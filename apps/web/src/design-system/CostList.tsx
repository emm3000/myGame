import type { ReactElement } from 'react'
import { formatQuantity } from './formatQuantity'
import { type Accent, resourceAccent } from './resourceAccent'

export interface CardCost {
  readonly kind: Accent
  readonly amount: number
  readonly isShort: boolean
}

export function CostList({ costs }: { readonly costs: ReadonlyArray<CardCost> }): ReactElement {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-2 p-0 font-utility text-numeral tabular-nums">
      {costs.map((cost) => {
        const { Icon, textClass } = resourceAccent[cost.kind]
        return (
          <li
            key={cost.kind}
            className={`flex items-center gap-1 ${cost.isShort ? 'text-rust' : 'text-ink'}`}
          >
            <span className={`flex ${textClass}`}>
              <Icon />
            </span>
            {formatQuantity(cost.amount)}
          </li>
        )
      })}
    </ul>
  )
}
