import type { ReactElement, ReactNode } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { LabelText } from '../design-system/LabelText'

export function SchoolTitled({ children }: { readonly children: ReactNode }): ReactElement {
  const { chrome } = usePlayerCopy()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0 font-sans text-display text-ink">
        <LabelText label={chrome((catalog) => catalog.namesPlacesSchool())} />
      </h1>
      {children}
    </div>
  )
}
