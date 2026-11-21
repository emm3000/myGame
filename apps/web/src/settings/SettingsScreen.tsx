import {
  scaffoldEs,
  scaffoldLabel,
  scaffoldNone,
  settingsCardsKept,
  settingsSaved,
  settingsSaving,
  settingsTitle,
} from '@mygame/catalog'
import type { Scaffold } from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import { FormAlert } from '../design-system/FormAlert'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { ScaffoldChoice } from '../design-system/ScaffoldChoice'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { ScaffoldChange } from './useScaffoldSetting'

export interface SettingsScreenProps {
  readonly stored: Scaffold
  readonly change: ScaffoldChange
  readonly onPick: (scaffold: Scaffold) => void
}

const scaffoldLines: Readonly<Record<Scaffold, string>> = {
  es: scaffoldEs(),
  none: scaffoldNone(),
}

function ChangeNote({ line }: { readonly line: string }): ReactElement {
  return (
    <p role="status" className="m-0 font-sans text-body text-ink">
      {line}
    </p>
  )
}

function ChangeLine({ change }: { readonly change: ScaffoldChange }): ReactElement | null {
  switch (change.kind) {
    case 'untouched':
      return null
    case 'saving':
      return <ChangeNote line={settingsSaving()} />
    case 'saved':
      return <ChangeNote line={settingsSaved()} />
    case 'refused':
      return <FormAlert message={lineLabelOf(refusalLineOf(change.refusal), 'es')} />
    default: {
      const unreachable: never = change
      return unreachable
    }
  }
}

export function SettingsScreen({ stored, change, onPick }: SettingsScreenProps): ReactElement {
  const titleId = useId()
  const isSaving = change.kind === 'saving'
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
      <h1 id={titleId} className="m-0 font-sans text-display text-ink">
        {settingsTitle()}
      </h1>
      <div className="flex flex-col gap-4">
        <ScaffoldChoice
          legend={scaffoldLabel()}
          lines={scaffoldLines}
          picked={isSaving ? change.scaffold : stored}
          isDisabled={isSaving}
          onPick={onPick}
        />
        <p className="m-0 font-sans text-caption text-ink-muted">{settingsCardsKept()}</p>
        <ChangeLine change={change} />
      </div>
    </section>
  )
}
