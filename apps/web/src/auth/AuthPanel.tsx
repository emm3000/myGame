import type { FormEvent, ReactElement, ReactNode } from 'react'
import { copy } from '../copy'

export interface AuthPanelProps {
  readonly title: string
  readonly onSubmit: () => void
  readonly children: ReactNode
  readonly footer: ReactNode
}

export function AuthPanel(props: AuthPanelProps): ReactElement {
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    props.onSubmit()
  }
  return (
    <div className="flex min-h-screen flex-col items-center bg-surface px-4 py-12 text-ink">
      <p className="m-0 mb-6 font-display text-title text-umber">{copy.shell.title}</p>
      <main className="flex w-full max-w-sm flex-col gap-6 rounded-md border border-line bg-surface-raised p-6 shadow-card">
        <h1 className="m-0 font-display text-display-xl text-ink">{props.title}</h1>
        <form noValidate onSubmit={submit} className="flex flex-col gap-4">
          {props.children}
        </form>
        <p className="m-0 flex flex-wrap items-baseline gap-2 font-body text-caption text-ink-muted">
          {props.footer}
        </p>
      </main>
    </div>
  )
}
