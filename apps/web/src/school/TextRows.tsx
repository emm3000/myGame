import type { TownOverview } from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { LabelText } from '../design-system/LabelText'
import { TextLink } from '../design-system/TextLink'

export interface TextRowsProps {
  readonly texts: TownOverview['texts']
}

export function TextRows({ texts }: TextRowsProps): ReactElement | null {
  const titleId = useId()
  const { chrome } = usePlayerCopy()
  if (texts.length === 0) {
    return null
  }
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-1">
      <h2 id={titleId} className="m-0 font-sans text-heading text-ink">
        <LabelText label={chrome((catalog) => catalog.schoolTexts())} />
      </h2>
      <ul className="m-0 flex list-none flex-col p-0">
        {texts.map(({ id, title }) => (
          <li key={id} className="border-line border-t first:border-t-0">
            <TextLink to="/school/texts/$textId" params={{ textId: id }} lang="en">
              {title}
            </TextLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
