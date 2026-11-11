import { mapRowLine, mapRowLink, mapTitle } from '@mygame/catalog'
import { type ReactElement, useId } from 'react'
import { TextLink } from '../design-system/TextLink'

export function MapRow(): ReactElement {
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col gap-2 border-line border-t py-4"
    >
      <h3 id={titleId} className="m-0 font-sans text-title text-ink">
        {mapTitle()}
      </h3>
      <p className="m-0 font-sans text-caption text-ink-muted">{mapRowLine()}</p>
      <TextLink to="/map">{mapRowLink()}</TextLink>
    </section>
  )
}
