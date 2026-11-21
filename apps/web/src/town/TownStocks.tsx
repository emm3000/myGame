import { type ResourceKind, ResourceKindSchema, type TownOverview } from '@mygame/contracts'
import { skillLevelOf } from '@mygame/domain'
import { type ReactElement, type Ref, useId } from 'react'
import type { ChromeCatalog } from '../copy/PlayerCopy'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { capitalize } from '../design-system/capitalize'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { formatQuantity } from '../design-system/formatQuantity'
import { LabelText } from '../design-system/LabelText'
import { resourceAccent } from '../design-system/resourceAccent'
import { SeasonLine } from '../design-system/SeasonLine'
import { spokenLanguageOf } from '../design-system/spokenLanguageOf'
import { spokenLineOf } from '../design-system/spokenLineOf'
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
  const copy = usePlayerCopy()
  if (level === 0) {
    return null
  }
  return (
    <span className="font-sans text-caption text-ink">
      <LabelText
        label={copy.chrome((catalog) =>
          catalog.schoolSkillName({ resource: townResourceNameOf(catalog, resource), level }),
        )}
      />
    </span>
  )
}

const fillHourWindowMilliseconds = 8 * 60 * 60 * 1000

const fillsWithinWindow = (fullAt: string | null, readAt: string): fullAt is string =>
  fullAt !== null && Date.parse(fullAt) - Date.parse(readAt) <= fillHourWindowMilliseconds

interface StockRead {
  readonly stock: TownOverview['stocks'][ResourceKind]
  readonly isFull: boolean
  readonly readAt: string
  readonly at: Date
}

const rateLineOf = (catalog: ChromeCatalog, { stock, isFull, readAt, at }: StockRead): string => {
  const { fullAt } = stock
  if (isFull || !fillsWithinWindow(fullAt, readAt)) {
    return catalog.townRate({ rate: formatQuantity(Math.floor(stock.ratePerHour)) })
  }
  return catalog.townFullAt({ clock: formatClock(catalog, new Date(fullAt), at) })
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
  const copy = usePlayerCopy()
  const name = copy.chrome((catalog) => capitalize(townResourceNameOf(catalog, resource)))
  return (
    <li
      aria-label={spokenLineOf(name)}
      lang={spokenLanguageOf(name)}
      className="flex flex-col gap-1"
    >
      <span className="flex items-center gap-2 font-sans text-label text-ink">
        <Icon sizeClass="size-icon" />
        <LabelText label={name} />
      </span>
      <span className="font-sans text-numeral text-ink">{formatQuantity(shown)}</span>
      <span className="flex flex-wrap justify-between gap-x-3 font-sans text-caption text-ink-muted tabular-nums">
        <span>
          <LabelText
            label={copy.chrome((catalog) =>
              isFull ? catalog.townFull({ capacity }) : catalog.townStockOf({ capacity }),
            )}
          />
        </span>
        <span>
          <LabelText
            label={copy.chrome((catalog) => rateLineOf(catalog, { stock, isFull, readAt, at }))}
          />
        </span>
      </span>
      <Track value={shown} total={stock.capacity} fillClass="fill-ink" />
      <SkillMark resource={resource} skills={skills} />
    </li>
  )
}

function TownSeason({ town }: { readonly town: LiveTown }): ReactElement | null {
  const { season } = town.overview
  const remainingSeconds = town.seasonRemainingSeconds
  const copy = usePlayerCopy()
  if (season === null || remainingSeconds === null) {
    return null
  }
  return (
    <SeasonLine
      season={season.kind}
      headerLine={copy.chrome((catalog) =>
        catalog.townSeasonLine({
          season: capitalize(seasonNameOf(catalog, season.kind)),
          year: season.year,
        }),
      )}
      countdownLine={copy.chrome((catalog) =>
        townSeasonEndsInOf(catalog, season.kind, remainingSeconds),
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
  const copy = usePlayerCopy()
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
        <LabelText label={copy.chrome((catalog) => catalog.townStocks())} />
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
        <LabelText
          label={copy.chrome((catalog) =>
            catalog.townPeople({ free: overview.people.free, atWork: overview.people.atWork }),
          )}
        />
      </p>
      <p className="m-0 font-sans text-body text-ink">
        <LabelText
          label={copy.chrome((catalog) =>
            catalog.townWordsReviewed({ count: overview.stableWordCount }),
          )}
        />
      </p>
      <p className="m-0 font-sans text-body text-ink">
        <LabelText
          label={copy.chrome((catalog) =>
            catalog.townWordsLearned({ count: overview.retainedWordCount }),
          )}
        />
      </p>
      <TownSeason town={town} />
    </section>
  )
}
