import type { ReactElement } from 'react'
import { copy } from '../copy'
import { CostList } from '../design-system/CostList'
import { FormAlert } from '../design-system/FormAlert'
import { type ChronicleRow, chronicleRowOf } from './chronicleRowOf'
import type { ChronicleState } from './useChronicle'

function ChronicleEntry({ row }: { readonly row: ChronicleRow }): ReactElement {
  return (
    <li className="flex flex-col gap-1 border-line border-t py-3 first:border-t-0 md:grid md:grid-cols-6 md:items-baseline md:gap-4">
      <time
        dateTime={row.occurredAt}
        className="whitespace-nowrap font-utility font-semibold text-caption text-ink-muted tabular-nums"
      >
        {row.instant}
      </time>
      <div className="flex flex-col gap-2 md:col-span-5">
        <p className="m-0 font-body text-body text-ink">
          <b className="font-bold">{row.heading}</b> {row.subject}
        </p>
        {row.refund === undefined ? null : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span aria-hidden="true" className="font-body text-body text-ink-muted">
              {copy.chronicle.recovered}
            </span>
            <span className="sr-only">{row.refund.sentence}</span>
            <span aria-hidden="true" className="flex">
              <CostList costs={row.refund.costs} />
            </span>
          </div>
        )}
      </div>
    </li>
  )
}

function ChronicleBody({ state }: { readonly state: ChronicleState }): ReactElement {
  switch (state.kind) {
    case 'loading':
      return <p className="m-0">{copy.chronicle.loading}</p>
    case 'refused':
      return <FormAlert message={copy.refusals[state.refusal]} />
    case 'read': {
      if (state.chronicle.events.length === 0) {
        return (
          <p className="m-0 rounded-md border border-line border-dashed p-4 text-ink-faint">
            {copy.chronicle.empty}
          </p>
        )
      }
      return (
        <ol
          aria-label={copy.chronicle.title}
          className="m-0 flex list-none flex-col rounded-md border border-line bg-surface-raised px-4 shadow-card"
        >
          {state.chronicle.events.map((event) => {
            const row = chronicleRowOf(event, state.readAt)
            return <ChronicleEntry key={row.key} row={row} />
          })}
        </ol>
      )
    }
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export function ChronicleScreen({ state }: { readonly state: ChronicleState }): ReactElement {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="m-0 font-display text-title text-ink">{copy.chronicle.title}</h2>
      <ChronicleBody state={state} />
    </section>
  )
}
