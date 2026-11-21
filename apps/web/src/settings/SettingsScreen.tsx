import type { Scaffold } from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { FormAlert } from '../design-system/FormAlert'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'
import { ScaffoldChoice } from '../design-system/ScaffoldChoice'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { ScaffoldChange } from './useScaffoldSetting'

export interface SettingsScreenProps {
  readonly stored: Scaffold
  readonly change: ScaffoldChange
  readonly onPick: (scaffold: Scaffold) => void
}

function ChangeNote({ line }: { readonly line: Label }): ReactElement {
  return (
    <p role="status" className="m-0 font-sans text-body text-ink">
      <LabelText label={line} />
    </p>
  )
}

function ChangeLine({ change }: { readonly change: ScaffoldChange }): ReactElement | null {
  const { fixedCopy } = usePlayerCopy()
  switch (change.kind) {
    case 'untouched':
      return null
    case 'saving':
      return <ChangeNote line={fixedCopy((catalog) => catalog.settingsSaving())} />
    case 'saved':
      return <ChangeNote line={fixedCopy((catalog) => catalog.settingsSaved())} />
    case 'refused':
      return <FormAlert message={fixedCopy((catalog) => refusalLineOf(catalog, change.refusal))} />
    default: {
      const unreachable: never = change
      return unreachable
    }
  }
}

export function SettingsScreen({ stored, change, onPick }: SettingsScreenProps): ReactElement {
  const titleId = useId()
  const { fixedCopy } = usePlayerCopy()
  const isSaving = change.kind === 'saving'
  const legend = fixedCopy((catalog) => catalog.scaffoldLabel())
  const scaffoldLines: Readonly<Record<Scaffold, string>> = {
    es: fixedCopy((catalog) => catalog.scaffoldEs()).text,
    none: fixedCopy((catalog) => catalog.scaffoldNone()).text,
  }
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
      <h1 id={titleId} className="m-0 font-sans text-display text-ink">
        <LabelText label={fixedCopy((catalog) => catalog.settingsTitle())} />
      </h1>
      <div lang={legend.language} className="flex flex-col gap-4">
        <ScaffoldChoice
          legend={legend.text}
          lines={scaffoldLines}
          picked={isSaving ? change.scaffold : stored}
          isDisabled={isSaving}
          onPick={onPick}
        />
        <p className="m-0 font-sans text-caption text-ink-muted">
          <LabelText label={fixedCopy((catalog) => catalog.settingsCardsKept())} />
        </p>
        <ChangeLine change={change} />
      </div>
    </section>
  )
}
