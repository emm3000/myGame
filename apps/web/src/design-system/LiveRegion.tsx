import type { ReactElement } from 'react'

export function LiveRegion({ line }: { readonly line: string }): ReactElement {
  return (
    <div aria-live="polite" className="sr-only">
      {line}
    </div>
  )
}
