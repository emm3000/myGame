import type { ReactElement } from 'react'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'

export function NewsNote({ line }: { readonly line: Label }): ReactElement {
  return (
    <p className="m-0 border-line border-t py-3 font-sans text-body text-ink">
      <LabelText label={line} />
    </p>
  )
}
