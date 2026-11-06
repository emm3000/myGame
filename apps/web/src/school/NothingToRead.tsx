import { schoolLessonNothingToRead, townGoToSchool } from '@mygame/catalog'
import type { ReactElement } from 'react'
import { TextLink } from '../design-system/TextLink'

export function NothingToRead(): ReactElement {
  return (
    <div className="flex max-w-form flex-col items-start gap-3 rounded-md border border-line border-dashed p-5">
      <p className="m-0 font-sans text-body text-ink">{schoolLessonNothingToRead()}</p>
      <TextLink to="/school">{townGoToSchool()}</TextLink>
    </div>
  )
}
