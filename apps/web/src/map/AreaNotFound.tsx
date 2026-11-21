import { mapBackToOwnArea, refusalAreaNotFound } from '@mygame/catalog'
import type { ReactElement } from 'react'
import { FormAlert } from '../design-system/FormAlert'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { TextLink } from '../design-system/TextLink'

export function AreaNotFound(): ReactElement {
  return (
    <section className="flex w-full max-w-form flex-col items-start gap-3">
      <FormAlert message={lineLabelOf(refusalAreaNotFound(), 'es')} />
      <TextLink to="/map">{mapBackToOwnArea()}</TextLink>
    </section>
  )
}
