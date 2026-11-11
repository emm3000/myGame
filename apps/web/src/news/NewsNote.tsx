import type { ReactElement } from 'react'

export function NewsNote({ line }: { readonly line: string }): ReactElement {
  return <p className="m-0 border-line border-t py-3 font-sans text-body text-ink">{line}</p>
}
