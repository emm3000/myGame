import { namesPlacesSchool } from '@mygame/catalog'
import type { ReactElement, ReactNode } from 'react'

export function SchoolTitled({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0 font-sans text-display text-ink">{namesPlacesSchool()}</h1>
      {children}
    </div>
  )
}
