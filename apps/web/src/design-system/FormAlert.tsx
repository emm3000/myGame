import type { ReactElement } from 'react'

export function FormAlert({ message }: { readonly message: string }): ReactElement {
  return (
    <p
      role="alert"
      className="m-0 rounded-md border border-destructive-ink bg-destructive-soft px-3 py-2 font-sans text-caption text-destructive-ink"
    >
      {message}
    </p>
  )
}
