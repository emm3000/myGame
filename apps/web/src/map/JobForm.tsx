import { es } from '@mygame/catalog'
import { type SendJob, SendJobSchema } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import { CardAction } from '../design-system/CardAction'
import { FormAlert } from '../design-system/FormAlert'
import { lineLabelOf } from '../design-system/lineLabelOf'
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
  const [entries, setEntries] = useState<JobEntries>(firstJobEntries)
  const form = jobFormOf(target, entries, town)
  const sentKey = form.job === undefined ? undefined : sentKeyOf(form.job)
  const quoted = useQuote(job.quote, SendJobSchema, form.job, town.overview.season)
  const payLine = jobPayLineOf(quoted?.ok === true ? quoted.value : undefined)
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
      aria-label={form.title}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4"
    >
      <h4 className="m-0 font-sans text-title text-ink">{form.title}</h4>
      {form.teamFields.map(({ hire, label, hint }) => (
        <TextField
          key={hire}
          label={lineLabelOf(label, 'es')}
          hint={lineLabelOf(hint, 'es')}
          name={`job-${hire}`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={entries[hire]}
          onChange={(entry) => enter(hire, entry)}
        />
      ))}
      <TextField
        label={lineLabelOf(form.hoursLabel, 'es')}
        name="job-hours"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={entries.hours}
        onChange={(entry) => enter('hours', entry)}
      />
      <p aria-live="polite" className="m-0 font-sans text-body text-ink empty:absolute">
        {payLine}
      </p>
      {quoted?.ok === false && quoted.refusal === 'Unexpected' && refused === undefined && (
        <FormAlert message={lineLabelOf(refusalLineOf(es, quoted.refusal, quoted.error), 'es')} />
      )}
      <CardAction
        type="button"
        label={lineLabelOf(form.actionLabel, 'es')}
        state={sendStateOf(form.state, quoted, refused !== undefined)}
        isWaiting={job.isSending}
        announcesReason
        onAction={onSend}
      />
      {refused !== undefined && (
        <FormAlert message={lineLabelOf(refusalLineOf(es, refused.refusal, refused.error), 'es')} />
      )}
    </section>
  )
}
