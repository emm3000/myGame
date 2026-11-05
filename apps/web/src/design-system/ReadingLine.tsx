import type { ReactElement } from 'react'

export function ReadingLine({ line }: { readonly line: string }): ReactElement {
  return (
    <section aria-busy="true" className="flex flex-col gap-3">
      <p role="status" className="m-0 font-sans text-body text-ink-muted">
        {line}
      </p>
    </section>
  )
}
