import type { ReactElement } from 'react'
import { type PreviewLine, PreviewLineText } from './PreviewLines'

export function MarchSent({ lines }: { readonly lines: ReadonlyArray<PreviewLine> }): ReactElement {
  return (
    <div
      role="status"
      className="flex w-full max-w-form flex-col gap-1 rounded-md border border-ink bg-surface-sunken px-3 py-2"
    >
      {lines.map((line) => (
        <p key={line.heading} className="m-0 font-sans text-body text-ink">
          <PreviewLineText line={line} />
        </p>
      ))}
    </div>
  )
}
