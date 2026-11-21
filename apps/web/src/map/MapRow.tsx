import { type ReactElement, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { LabelText } from '../design-system/LabelText'
import { TextLink } from '../design-system/TextLink'

export function MapRow(): ReactElement {
  const titleId = useId()
  const copy = usePlayerCopy()
  return (
    <section
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col gap-2 border-line border-t py-4"
    >
      <h3 id={titleId} className="m-0 font-sans text-title text-ink">
        <LabelText label={copy.chrome((catalog) => catalog.mapTitle())} />
      </h3>
      <p className="m-0 font-sans text-caption text-ink-muted">
        <LabelText label={copy.chrome((catalog) => catalog.mapRowLine())} />
      </p>
      <TextLink to="/map">
        <LabelText label={copy.chrome((catalog) => catalog.mapRowLink())} />
      </TextLink>
    </section>
  )
}
