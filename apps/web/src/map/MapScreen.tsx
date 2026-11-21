import type { RegionMap } from '@mygame/contracts'
import { type ReactElement, type RefObject, useEffect, useId, useRef, useState } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Button } from '../design-system/Button'
import { LabelText } from '../design-system/LabelText'
import { PlaceArt } from '../design-system/PlaceArt'
import { spokenLineOf } from '../design-system/spokenLineOf'
import { TextLink } from '../design-system/TextLink'
import { wasteArtOf } from '../design-system/wasteArtOf'
import { useFocusTarget } from '../focus/useFocusTarget'
import type { LiveTown } from '../town/liveTown'
import { CleanUpForm } from './CleanUpForm'
import { JobForm } from './JobForm'
import { JobOut } from './JobOut'
import { jobOutOf } from './jobOutOf'
import { type MapSiteRow, mapSiteRowOf } from './mapSiteRowOf'
import { terrainNameOf } from './terrainNameOf'
import type { TownJob } from './useJob'

export interface MapScreenProps {
  readonly map: RegionMap
  readonly town: LiveTown
  readonly job: TownJob
}

function AreaLinks({ map }: { readonly map: RegionMap }): ReactElement {
  const copy = usePlayerCopy()
  return (
    <nav className="flex flex-wrap gap-x-6">
      {map.area > 1 && (
        <TextLink to="/map/$area" params={{ area: String(map.area - 1) }}>
          <LabelText label={copy.chrome((catalog) => catalog.mapPrevious())} />
        </TextLink>
      )}
      {map.area < map.lastArea && (
        <TextLink to="/map/$area" params={{ area: String(map.area + 1) }}>
          <LabelText label={copy.chrome((catalog) => catalog.mapNext())} />
        </TextLink>
      )}
    </nav>
  )
}

function SiteHolder({ row }: { readonly row: MapSiteRow }): ReactElement {
  switch (row.kind) {
    case 'free':
      return (
        <p className="m-0 font-sans text-caption text-ink-muted">
          <LabelText label={row.line} />
        </p>
      )
    case 'waste':
      return (
        <>
          <p className="m-0 font-sans text-caption text-ink-muted">
            <LabelText label={row.sizeLine} />
          </p>
          <p className="m-0 font-sans text-body text-ink">
            <LabelText label={row.wasteLine} />
          </p>
        </>
      )
    case 'town':
      return <p className="m-0 font-sans text-body text-ink">{row.name}</p>
    case 'own':
      return (
        <>
          <p className="m-0 font-sans text-body text-ink">{row.name}</p>
          <p className="m-0 font-sans text-caption text-ink-muted">
            <LabelText label={row.line} />
          </p>
        </>
      )
    default: {
      const unreachable: never = row
      return unreachable
    }
  }
}

interface SiteItemProps {
  readonly row: MapSiteRow
  readonly area: number
  readonly town: LiveTown
  readonly job: TownJob
  readonly isChosen: boolean
  readonly onChoose: () => void
  readonly onSent: () => void
}

function SiteHeading({ row }: { readonly row: MapSiteRow }): ReactElement {
  const heading = (
    <div className="flex flex-col gap-1">
      <h3 className="m-0 font-sans text-title text-ink">
        <LabelText label={row.label} />
      </h3>
      <SiteHolder row={row} />
    </div>
  )
  if (row.kind !== 'waste') {
    return heading
  }
  return (
    <div className="flex items-center gap-4">
      <PlaceArt shapes={wasteArtOf(row.size)} sizeClass="size-thumbnail" />
      {heading}
    </div>
  )
}

function SiteForm({
  row,
  id,
  area,
  town,
  job,
  onSent,
}: Omit<SiteItemProps, 'isChosen' | 'onChoose'> & { readonly id: string }): ReactElement | null {
  const target = { area, site: row.site }
  switch (row.kind) {
    case 'free':
      return <JobForm id={id} target={target} town={town} job={job} onSent={onSent} />
    case 'waste':
      return <CleanUpForm id={id} target={target} town={town} job={job} onSent={onSent} />
    default:
      return null
  }
}

function SiteItem({
  row,
  area,
  town,
  job,
  isChosen,
  onChoose,
  onSent,
}: SiteItemProps): ReactElement {
  const formId = useId()
  const isSendable = row.kind === 'free' || row.kind === 'waste'
  return (
    <li
      aria-label={spokenLineOf(row.label)}
      className="flex flex-col gap-2 border-line border-t py-4 first:border-t-0"
    >
      <SiteHeading row={row} />
      {isSendable && (
        <Button
          type="button"
          tone="quiet"
          accessibleName={spokenLineOf(row.actionName)}
          isExpanded={isChosen}
          controls={isChosen ? formId : undefined}
          onClick={onChoose}
        >
          <LabelText label={row.actionLabel} />
        </Button>
      )}
      {isChosen && (
        <SiteForm row={row} id={formId} area={area} town={town} job={job} onSent={onSent} />
      )}
    </li>
  )
}

function useFocusOnJobShown(sentAt: string | undefined): {
  readonly titleRef: RefObject<HTMLHeadingElement | null>
  readonly focusOnShow: () => void
} {
  const title = useFocusTarget<HTMLHeadingElement>()
  const isFocusAwaited = useRef(false)
  useEffect(() => {
    if (sentAt !== undefined && isFocusAwaited.current) {
      isFocusAwaited.current = false
      title.focus()
    }
  }, [sentAt, title.focus])
  return {
    titleRef: title.ref,
    focusOnShow: () => {
      isFocusAwaited.current = true
    },
  }
}

export function MapScreen({ map, town, job }: MapScreenProps): ReactElement {
  const copy = usePlayerCopy()
  const [chosenSite, setChosenSite] = useState<number>()
  const jobOut = jobOutOf(town, copy)
  const jobTitle = useFocusOnJobShown(town.overview.job?.sentAt)
  const heading = copy.chrome((catalog) => catalog.mapArea({ area: map.area }))
  const onSent = (): void => {
    setChosenSite(undefined)
    jobTitle.focusOnShow()
  }
  return (
    <div className="flex w-full max-w-form flex-col gap-6">
      {jobOut !== undefined && <JobOut content={jobOut} job={job} titleRef={jobTitle.titleRef} />}
      <section aria-label={spokenLineOf(heading)} className="flex flex-col gap-2">
        <div>
          <h2 className="m-0 font-sans text-heading text-ink">
            <LabelText label={heading} />
          </h2>
          <p className="m-0 font-sans text-caption text-ink-muted">
            <LabelText label={terrainNameOf(map.terrain, copy)} />
          </p>
        </div>
        <AreaLinks map={map} />
        <ul className="m-0 flex list-none flex-col p-0">
          {map.sites.map((site) => {
            const row = mapSiteRowOf(site, copy)
            return (
              <SiteItem
                key={site.site}
                row={row}
                area={map.area}
                town={town}
                job={job}
                isChosen={chosenSite === site.site}
                onChoose={() => setChosenSite(chosenSite === site.site ? undefined : site.site)}
                onSent={onSent}
              />
            )
          })}
        </ul>
      </section>
    </div>
  )
}
