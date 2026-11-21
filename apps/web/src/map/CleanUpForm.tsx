import { type SendCleanUp, SendCleanUpSchema } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { CardAction } from '../design-system/CardAction'
import { FormAlert } from '../design-system/FormAlert'
import { LabelText } from '../design-system/LabelText'
import { spokenLineOf } from '../design-system/spokenLineOf'
import { TextField } from '../design-system/TextField'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { LiveTown } from '../town/liveTown'
import { cleanUpFormOf, firstCleanUpEntries } from './cleanUpFormOf'
import { type CleanUpQuoteLines, cleanUpQuoteLinesOf } from './cleanUpQuoteLinesOf'
import { sendStateOf } from './sendStateOf'
import type { TeamEntries } from './teamFormOf'
import { sentKeyOf, type TownJob } from './useJob'
import { useQuote } from './useQuote'

export interface CleanUpFormProps {
  readonly id: string
  readonly target: SendCleanUp['site']
  readonly town: LiveTown
  readonly job: TownJob
  readonly onSent: () => void
}

function QuoteLines({ lines }: { readonly lines: CleanUpQuoteLines | undefined }): ReactElement {
  return (
    <div aria-live="polite" className="flex flex-col gap-1 empty:absolute">
      {lines !== undefined && (
        <>
          <p className="m-0 font-sans text-body text-ink">
            <LabelText label={lines.waste} />
          </p>
          <p className="m-0 font-sans text-body text-ink">
            <LabelText label={lines.team} />
          </p>
          {lines.pay !== undefined && (
            <p className="m-0 font-sans text-body text-ink">
              <LabelText label={lines.pay} />
            </p>
          )}
          {lines.short !== undefined && (
            <p className="m-0 font-sans text-caption text-warning-ink">
              <LabelText label={lines.short} />
            </p>
          )}
        </>
      )}
    </div>
  )
}

export function CleanUpForm({ id, target, town, job, onSent }: CleanUpFormProps): ReactElement {
  const copy = usePlayerCopy()
  const [entries, setEntries] = useState<TeamEntries>(firstCleanUpEntries)
  const form = cleanUpFormOf(target, entries, town, copy)
  const sentKey = form.cleanUp === undefined ? undefined : sentKeyOf(form.cleanUp)
  const quoted = useQuote(job.quoteCleanUp, SendCleanUpSchema, form.cleanUp, town.overview.season)
  const lines = quoted?.ok === true ? cleanUpQuoteLinesOf(quoted.value, copy) : undefined
  const refused = job.sendRefused?.subject === sentKey ? job.sendRefused : undefined
  const enter = (field: keyof TeamEntries, entry: string): void =>
    setEntries((held) => ({ ...held, [field]: entry }))
  const onSend = (): void => {
    if (form.cleanUp !== undefined) {
      job.sendCleanUp(form.cleanUp, onSent)
    }
  }
  return (
    <section
      id={id}
      aria-label={spokenLineOf(form.title)}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4"
    >
      <h4 className="m-0 font-sans text-title text-ink">
        <LabelText label={form.title} />
      </h4>
      {form.teamFields.map(({ hire, label, hint }) => (
        <TextField
          key={hire}
          label={label}
          hint={hint}
          name={`clean-up-${hire}`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={entries[hire]}
          onChange={(entry) => enter(hire, entry)}
        />
      ))}
      <QuoteLines lines={lines} />
      {quoted?.ok === false && quoted.refusal === 'Unexpected' && refused === undefined && (
        <FormAlert
          message={copy.fixedCopy((catalog) =>
            refusalLineOf(catalog, quoted.refusal, quoted.error),
          )}
        />
      )}
      <CardAction
        type="button"
        label={form.actionLabel}
        state={sendStateOf(form.state, quoted, refused !== undefined, copy)}
        isWaiting={job.isSending}
        announcesReason
        onAction={onSend}
      />
      {refused !== undefined && (
        <FormAlert
          message={copy.fixedCopy((catalog) =>
            refusalLineOf(catalog, refused.refusal, refused.error),
          )}
        />
      )}
    </section>
  )
}
