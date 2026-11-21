import { type SendJob, SendJobSchema } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { CardAction } from '../design-system/CardAction'
import { FormAlert } from '../design-system/FormAlert'
import { LabelText } from '../design-system/LabelText'
import { spokenLineOf } from '../design-system/spokenLineOf'
import { TextField } from '../design-system/TextField'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { LiveTown } from '../town/liveTown'
import { firstJobEntries, type JobEntries, jobFormOf } from './jobFormOf'
import { jobPayLineOf } from './jobPayLineOf'
import { sendStateOf } from './sendStateOf'
import { sentKeyOf, type TownJob } from './useJob'
import { useQuote } from './useQuote'

export interface JobFormProps {
  readonly id: string
  readonly target: SendJob['site']
  readonly town: LiveTown
  readonly job: TownJob
  readonly onSent: () => void
}

export function JobForm({ id, target, town, job, onSent }: JobFormProps): ReactElement {
  const copy = usePlayerCopy()
  const [entries, setEntries] = useState<JobEntries>(firstJobEntries)
  const form = jobFormOf(target, entries, town, copy)
  const sentKey = form.job === undefined ? undefined : sentKeyOf(form.job)
  const quoted = useQuote(job.quote, SendJobSchema, form.job, town.overview.season)
  const payLine =
    quoted?.ok === true
      ? jobPayLineOf(copy, quoted.value.pay, (catalog, amounts) => catalog.mapJobPay({ amounts }))
      : undefined
  const refused = job.sendRefused?.subject === sentKey ? job.sendRefused : undefined
  const enter = (field: keyof JobEntries, entry: string): void =>
    setEntries((held) => ({ ...held, [field]: entry }))
  const onSend = (): void => {
    if (form.job !== undefined) {
      job.send(form.job, onSent)
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
          name={`job-${hire}`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={entries[hire]}
          onChange={(entry) => enter(hire, entry)}
        />
      ))}
      <TextField
        label={form.hoursLabel}
        name="job-hours"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={entries.hours}
        onChange={(entry) => enter('hours', entry)}
      />
      <p aria-live="polite" className="m-0 font-sans text-body text-ink empty:absolute">
        {payLine !== undefined && <LabelText label={payLine} />}
      </p>
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
