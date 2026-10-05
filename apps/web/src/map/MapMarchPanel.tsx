import { ResourceKindSchema } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { copy } from '../copy'
import { FormAlert } from '../design-system/FormAlert'
import { MarchForm } from '../design-system/MarchForm'
import { MarchSent } from '../design-system/MarchSent'
import { partyKinds } from '../units/partyKinds'
import { attackFormOf } from './attackFormOf'
import { foundingFormOf } from './foundingFormOf'
import { marchFormOf } from './marchFormOf'
import { marchSentLinesOf } from './marchSentLinesOf'
import { transportFormOf } from './transportFormOf'
import type { MapMarch } from './useMapMarch'

function OpenForm({ march }: { readonly march: MapMarch }): ReactElement | null {
  const { overview, target, entries } = march
  if (overview === undefined || target === undefined) {
    return null
  }
  if (target.order.kind === 'found') {
    return (
      <MarchForm
        {...foundingFormOf(target, march.name, overview)}
        counts={[]}
        name={{ label: copy.founding.nameField, entry: march.name, onChange: march.onNameChange }}
        isWaiting={march.isWaiting}
        onSend={march.onSend}
      />
    )
  }
  const counts = partyKinds.map((unit) => ({
    label: copy.march.countField(unit),
    entry: entries.units[unit],
    min: 0,
    onChange: (entry: string) =>
      march.onEntriesChange({ ...entries, units: { ...entries.units, [unit]: entry } }),
  }))
  if (target.order.kind === 'transport') {
    const amounts = ResourceKindSchema.options.map((resource) => ({
      label: copy.transport.amountField(resource),
      entry: entries.cargo[resource],
      min: 0,
      onChange: (entry: string) =>
        march.onEntriesChange({ ...entries, cargo: { ...entries.cargo, [resource]: entry } }),
    }))
    return (
      <MarchForm
        {...transportFormOf(target, entries, overview)}
        counts={counts}
        amounts={amounts}
        isWaiting={march.isWaiting}
        onSend={march.onSend}
      />
    )
  }
  const { camp } = target
  if (camp !== null) {
    return (
      <MarchForm
        {...attackFormOf({ ...target, camp }, entries.units, overview)}
        counts={counts}
        isWaiting={march.isWaiting}
        onSend={march.onSend}
      />
    )
  }
  return (
    <MarchForm
      {...marchFormOf(target, entries, overview)}
      counts={counts}
      hours={{
        label: copy.march.hoursField,
        entry: entries.hours,
        min: 1,
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
  const refusalLine =
    march.refusalLine ??
    (march.fiefRefusal === undefined ? undefined : copy.refusals[march.fiefRefusal])
  return (
    <div className="flex flex-col gap-3">
      <OpenForm march={march} />
      {sent !== undefined && sent !== null && march.overview !== undefined && (
        <MarchSent lines={marchSentLinesOf(sent, march.overview.readAt)} />
      )}
      {refusalLine !== undefined && <FormAlert message={refusalLine} />}
    </div>
  )
}
