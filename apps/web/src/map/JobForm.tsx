import type { SendJob } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import { CardAction } from '../design-system/CardAction'
import { FormAlert } from '../design-system/FormAlert'
import { TextField } from '../design-system/TextField'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { LiveTown } from '../town/liveTown'
import { firstJobEntries, type JobEntries, jobFormOf } from './jobFormOf'
import { jobPayLineOf } from './jobPayLineOf'
import type { TownJob } from './useJob'
import { useJobQuote } from './useJobQuote'

export interface JobFormProps {
  readonly id: string
  readonly target: SendJob['site']
  readonly town: LiveTown
  readonly job: TownJob
  readonly onSent: () => void
}

export function JobForm({ id, target, town, job, onSent }: JobFormProps): ReactElement {
  const [entries, setEntries] = useState<JobEntries>(firstJobEntries)
  const form = jobFormOf(target, entries, town)
  const payLine = jobPayLineOf(useJobQuote(job.quote, form.job))
  const refused = job.sendRefused?.subject === target.site ? job.sendRefused : undefined
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
      aria-label={form.title}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4"
    >
      <h4 className="m-0 font-sans text-title text-ink">{form.title}</h4>
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
      <p aria-live="polite" className="m-0 font-sans text-body text-ink">
        {payLine}
      </p>
      <CardAction
        type="button"
        label={form.actionLabel}
        state={form.state}
        isWaiting={job.isSending}
        onAction={onSend}
      />
      {refused !== undefined && (
        <FormAlert message={refusalLineOf(refused.refusal, refused.error)} />
      )}
    </section>
  )
}
