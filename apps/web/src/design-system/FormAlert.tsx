import type { ReactElement } from 'react'

export function FormAlert({ message }: { readonly message: string }): ReactElement {
  return (
    <p
      role="alert"
      className="m-0 rounded-md border border-rust bg-rust-soft px-3 py-2 font-body text-caption text-ink"
    >
      {message}
    </p>
  )
}
