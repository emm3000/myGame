import {
  es,
  schoolSkillName,
  townFull,
  townFullAt,
  townPeople,
  townRate,
  townSeasonLine,
  townStockOf,
  townStocks,
  townWordsLearned,
  townWordsReviewed,
} from '@mygame/catalog'
import { type ResourceKind, ResourceKindSchema, type TownOverview } from '@mygame/contracts'
import { skillLevelOf } from '@mygame/domain'
import { type ReactElement, type Ref, useId } from 'react'
import { capitalize } from '../design-system/capitalize'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { formatQuantity } from '../design-system/formatQuantity'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { resourceAccent } from '../design-system/resourceAccent'
import { SeasonLine } from '../design-system/SeasonLine'
import { Track } from '../design-system/Track'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import { seasonNameOf } from '../seasons/seasonNameOf'
import { formatClock } from '../time/formatClock'
import type { LiveTown } from './liveTown'
import { townSeasonEndsInOf } from './townSeasonEndsInOf'

function SkillMark({
  resource,
  skills,
}: {
  readonly resource: ResourceKind
  readonly skills: TownOverview['skills']
}): ReactElement | null {
  const level = skillLevelOf(skills, resource)
  if (level === 0) {
    return null
  }
  return (
    <span className="font-sans text-caption text-ink">
      {schoolSkillName({ resource: townResourceNameOf(es, resource), level })}
    </span>
  )
}

const fillHourWindowMilliseconds = 8 * 60 * 60 * 1000

const fillsWithinWindow = (fullAt: string | null, readAt: string): fullAt is string =>
  fullAt !== null && Date.parse(fullAt) - Date.parse(readAt) <= fillHourWindowMilliseconds

const rateLineOf = (
  stock: TownOverview['stocks'][ResourceKind],
  isFull: boolean,
  readAt: string,
  at: Date,
): string => {
  const { fullAt } = stock
  if (isFull || !fillsWithinWindow(fullAt, readAt)) {
    return townRate({ rate: formatQuantity(Math.floor(stock.ratePerHour)) })
  }
  return townFullAt({ clock: formatClock(es, new Date(fullAt), at) })
}

function StockItem({
  resource,
  amount,
  stock,
  skills,
  readAt,
  at,
}: {
  readonly resource: ResourceKind
  readonly amount: number
  readonly stock: TownOverview['stocks'][ResourceKind]
  readonly skills: TownOverview['skills']
  readonly readAt: string
  readonly at: Date
}): ReactElement {
  const Icon = resourceAccent[resource]
  const shown = Math.floor(amount)
  const capacity = formatQuantity(stock.capacity)
  const isFull = shown >= stock.capacity
  return (
    <li aria-label={capitalize(townResourceNameOf(es, resource))} className="flex flex-col gap-1">
      <span className="flex items-center gap-2 font-sans text-label text-ink">
        <Icon sizeClass="size-icon" />
        {capitalize(townResourceNameOf(es, resource))}
      </span>
      <span className="font-sans text-numeral text-ink">{formatQuantity(shown)}</span>
      <span className="flex flex-wrap justify-between gap-x-3 font-sans text-caption text-ink-muted tabular-nums">
        <span>{isFull ? townFull({ capacity }) : townStockOf({ capacity })}</span>
        <span>{rateLineOf(stock, isFull, readAt, at)}</span>
      </span>
      <Track value={shown} total={stock.capacity} fillClass="fill-ink" />
      <SkillMark resource={resource} skills={skills} />
    </li>
  )
}

function TownSeason({ town }: { readonly town: LiveTown }): ReactElement | null {
  const { season } = town.overview
  if (season === null || town.seasonRemainingSeconds === null) {
    return null
  }
  return (
    <SeasonLine
      season={season.kind}
      headerLine={lineLabelOf(
        townSeasonLine({
          season: capitalize(seasonNameOf(season.kind)),
          year: season.year,
        }),
        'es',
      )}
      countdownLine={lineLabelOf(
        townSeasonEndsInOf(season.kind, town.seasonRemainingSeconds),
        'es',
      )}
    />
  )
}

export interface TownStocksProps {
  readonly town: LiveTown
  readonly titleRef: Ref<HTMLHeadingElement>
}

export function TownStocks({ town, titleRef }: TownStocksProps): ReactElement {
  const { overview, stocks } = town
  const titleId = useId()
  const Icon = resourceAccent.people
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-5"
    >
      <h3
        id={titleId}
        ref={titleRef}
        tabIndex={-1}
        className={`m-0 font-sans text-heading text-ink ${focusTargetClass}`}
      >
        {townStocks()}
      </h3>
      <ul
        aria-labelledby={titleId}
        className="m-0 grid list-none grid-cols-2 gap-4 p-0 lg:grid-cols-4"
      >
        {ResourceKindSchema.options.map((resource) => (
          <StockItem
            key={resource}
            resource={resource}
            amount={stocks[resource]}
            stock={overview.stocks[resource]}
            skills={overview.skills}
            readAt={overview.readAt}
            at={town.at}
          />
        ))}
      </ul>
      <p className="m-0 flex items-center gap-2 border-line border-t pt-3 font-sans text-body text-ink">
        <span className="flex text-ink">
          <Icon sizeClass="size-icon" />
        </span>
        {townPeople({ free: overview.people.free, atWork: overview.people.atWork })}
      </p>
      <p className="m-0 font-sans text-body text-ink">
        {townWordsReviewed({ count: overview.stableWordCount })}
      </p>
      <p className="m-0 font-sans text-body text-ink">
        {townWordsLearned({ count: overview.retainedWordCount })}
      </p>
      <TownSeason town={town} />
    </section>
  )
}
