import { type ReactElement, useId } from 'react'
import { Button } from './Button'
import { FormAlert } from './FormAlert'
import { Panel } from './Panel'

export interface DigestRow {
  readonly key: string
  readonly occurredAt: string
  readonly instant: string
  readonly heading: string
  readonly subject: string
}

export interface DigestFief {
  readonly key: string
  readonly name: string
  readonly rows: ReadonlyArray<DigestRow>
}

export interface DigestCardProps {
  readonly title: string
  readonly fiefs: ReadonlyArray<DigestFief>
  readonly acknowledgeLabel: string
  readonly isWaiting: boolean
  readonly refusal: string | undefined
  readonly onAcknowledge: () => void
}

function DigestEntry({ row }: { readonly row: DigestRow }): ReactElement {
  return (
    <li className="flex flex-col gap-1 border-line border-t py-3 first:border-t-0">
      <time
        dateTime={row.occurredAt}
        className="whitespace-nowrap font-utility font-semibold text-caption text-ink-muted tabular-nums"
      >
        {row.instant}
      </time>
      <p className="m-0 font-body text-body text-ink">
        <b className="font-bold">{row.heading}</b> {row.subject}
      </p>
    </li>
  )
}

function DigestFiefSection({ fief }: { readonly fief: DigestFief }): ReactElement {
  return (
    <section className="flex flex-col gap-1">
      <h4 className="m-0 font-body text-heading text-ink">{fief.name}</h4>
      <ol aria-label={fief.name} className="m-0 flex list-none flex-col p-0">
        {fief.rows.map((row) => (
          <DigestEntry key={row.key} row={row} />
        ))}
      </ol>
    </section>
  )
}

export function DigestCard({
  title,
  fiefs,
  acknowledgeLabel,
  isWaiting,
  refusal,
  onAcknowledge,
}: DigestCardProps): ReactElement {
  const titleId = useId()
  return (
    <Panel
      element="article"
      labelledBy={titleId}
      toneClass="border-line-strong bg-surface-raised"
      spacingClass="gap-3 p-4"
    >
      <h3 id={titleId} className="m-0 font-display text-ink text-title">
        {title}
      </h3>
      <div className="grid items-start gap-x-6 gap-y-3 md:grid-cols-2">
        {fiefs.map((fief) => (
          <DigestFiefSection key={fief.key} fief={fief} />
        ))}
      </div>
      {refusal !== undefined && <FormAlert message={refusal} />}
      <div className="flex">
        <Button
          type="button"
          tone="primary"
          availability={isWaiting ? 'waiting' : 'available'}
          onClick={onAcknowledge}
        >
          {acknowledgeLabel}
        </Button>
      </div>
    </Panel>
  )
}
