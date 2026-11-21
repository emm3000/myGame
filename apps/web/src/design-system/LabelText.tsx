import type { ReactElement } from 'react'
import type { Label } from './Label'

export function LabelText({ label }: { readonly label: Label }): ReactElement {
  if (label.translation === null) {
    return <>{label.text}</>
  }
  return (
    <span className="inline-flex flex-col">
      <span>{label.text}</span> <span className="font-sans text-caption">{label.translation}</span>
    </span>
  )
}
