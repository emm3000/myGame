import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { FormAlert } from '../design-system/FormAlert'
import { LabelText } from '../design-system/LabelText'
import { TextLink } from '../design-system/TextLink'

export function AreaNotFound(): ReactElement {
  const copy = usePlayerCopy()
  return (
    <section className="flex w-full max-w-form flex-col items-start gap-3">
      <FormAlert message={copy.fixedCopy((catalog) => catalog.refusalAreaNotFound())} />
      <TextLink to="/map">
        <LabelText label={copy.chrome((catalog) => catalog.mapBackToOwnArea())} />
      </TextLink>
    </section>
  )
}
