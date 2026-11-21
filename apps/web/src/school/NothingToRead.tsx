import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { LabelText } from '../design-system/LabelText'
import { TextLink } from '../design-system/TextLink'
import { SchoolTitled } from './SchoolTitled'

export function NothingToRead(): ReactElement {
  const { chrome } = usePlayerCopy()
  return (
    <SchoolTitled>
      <div className="flex max-w-form flex-col items-start gap-3 rounded-md border border-line bg-surface-raised p-5">
        <p className="m-0 font-sans text-body text-ink">
          <LabelText label={chrome((catalog) => catalog.schoolLessonNothingToRead())} />
        </p>
        <TextLink to="/school">
          <LabelText label={chrome((catalog) => catalog.townGoToSchool())} />
        </TextLink>
      </div>
    </SchoolTitled>
  )
}
