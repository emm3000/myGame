import type { ReactElement, ReactNode } from 'react'
import { SchoolTitled } from './SchoolTitled'

export function SchoolColumnTitled({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="mx-auto w-full max-w-form">
      <SchoolTitled>{children}</SchoolTitled>
    </div>
  )
}
