import { townFull, townPeople, townRate, townStockOf, townStocks } from '@mygame/catalog'
import { type ResourceKind, ResourceKindSchema, type TownOverview } from '@mygame/contracts/town'
import { type ReactElement, useId } from 'react'
import { capitalize } from '../design-system/capitalize'
import { formatQuantity } from '../design-system/formatQuantity'
import { resourceAccent } from '../design-system/resourceAccent'
import { Track } from '../design-system/Track'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import type { LiveStocks } from './liveTown'

function StockItem({
  resource,
  amount,
  stock,
}: {
  readonly resource: ResourceKind
  readonly amount: number
  readonly stock: TownOverview['stocks'][ResourceKind]
}): ReactElement {
  const Icon = resourceAccent[resource]
  const shown = Math.floor(amount)
  const capacity = formatQuantity(stock.capacity)
  const isFull = shown >= stock.capacity
  return (
    <li aria-label={capitalize(townResourceNameOf(resource))} className="flex flex-col gap-1">
      <span className="flex items-center gap-2 font-sans text-label text-ink">
        <Icon sizeClass="size-icon" />
        {capitalize(townResourceNameOf(resource))}
      </span>
      <span className="flex flex-wrap items-baseline justify-between gap-x-3 font-sans tabular-nums">
        <span className="text-heading text-ink">{formatQuantity(shown)}</span>
        <span className="text-caption text-ink-muted">
          {isFull ? townFull({ capacity }) : townStockOf({ capacity })}
        </span>
        <span className="text-caption text-ink-muted">
          {townRate({ rate: formatQuantity(Math.floor(stock.ratePerHour)) })}
        </span>
      </span>
      <Track value={shown} total={stock.capacity} fillClass="fill-ink" />
    </li>
  )
}

export function TownStocks({
  overview,
  stocks,
}: {
  readonly overview: TownOverview
  readonly stocks: LiveStocks
}): ReactElement {
  const titleId = useId()
  const Icon = resourceAccent.people
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-5"
    >
      <h3 id={titleId} className="m-0 font-sans text-heading text-ink">
        {townStocks()}
      </h3>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {ResourceKindSchema.options.map((resource) => (
          <StockItem
            key={resource}
            resource={resource}
            amount={stocks[resource]}
            stock={overview.stocks[resource]}
          />
        ))}
      </ul>
      <p className="m-0 flex items-center gap-2 border-line border-t pt-3 font-sans text-body text-ink">
        <span className="flex text-ink">
          <Icon sizeClass="size-icon" />
        </span>
        {townPeople({ free: overview.people.free, atWork: overview.people.atWork })}
      </p>
    </section>
  )
}
