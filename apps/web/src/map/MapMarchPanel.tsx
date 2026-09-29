import type { ReactElement } from 'react'
import { copy } from '../copy'
import { FormAlert } from '../design-system/FormAlert'
import { MarchForm } from '../design-system/MarchForm'
import { MarchSent } from '../design-system/MarchSent'
import { marchFormOf } from './marchFormOf'
import { marchSentLinesOf } from './marchSentLinesOf'
import type { MapMarch } from './useMapMarch'

function OpenForm({ march }: { readonly march: MapMarch }): ReactElement | null {
  const { overview, target, entries } = march
  if (overview === undefined || target === undefined) {
    return null
  }
  return (
    <MarchForm
      {...marchFormOf(target, entries, overview)}
      infantry={{
        label: copy.march.infantryField,
        entry: entries.infantry,
        onChange: (infantry) => march.onEntriesChange({ ...entries, infantry }),
      }}
      hours={{
        label: copy.march.hoursField,
        entry: entries.hours,
        max: overview.forageTerms.maxStayHours,
        onChange: (hours) => march.onEntriesChange({ ...entries, hours }),
      }}
      isWaiting={march.isWaiting}
      onSend={march.onSend}
    />
  )
}

export function MapMarchPanel({ march }: { readonly march: MapMarch }): ReactElement {
  const sent = march.isSent ? march.overview?.march : undefined
  const refusal = march.refusal ?? march.fiefRefusal
  return (
    <div className="flex flex-col gap-3">
      <OpenForm march={march} />
      {sent !== undefined && sent !== null && march.overview !== undefined && (
        <MarchSent lines={marchSentLinesOf(sent, march.overview.readAt)} />
      )}
      {refusal !== undefined && <FormAlert message={copy.refusals[refusal]} />}
    </div>
  )
}
