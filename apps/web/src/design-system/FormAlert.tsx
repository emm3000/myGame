import type { ReactElement } from 'react'
import type { Label } from './Label'
import { LabelText } from './LabelText'

export function FormAlert({ message }: { readonly message: Label }): ReactElement {
  return (
    <p
      role="alert"
      className="m-0 rounded-md border border-destructive-ink bg-destructive-soft px-3 py-2 font-sans text-caption text-destructive-ink"
    >
      <LabelText label={message} />
    </p>
  )
}
