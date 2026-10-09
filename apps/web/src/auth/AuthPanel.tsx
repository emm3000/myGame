import type { FormEvent, ReactElement, ReactNode } from 'react'
import { copy } from '../copy'
import { Panel } from '../design-system/Panel'

export interface AuthPanelProps {
  readonly title: string
  readonly onSubmit?: () => void
  readonly children: ReactNode
  readonly footer?: ReactNode
}

const bodyClass = 'flex flex-col gap-4'

interface BodyProps {
  readonly onSubmit: (() => void) | undefined
  readonly children: ReactNode
}

function Body({ onSubmit, children }: BodyProps): ReactElement {
  if (onSubmit === undefined) {
    return <div className={bodyClass}>{children}</div>
  }
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onSubmit()
  }
  return (
    <form noValidate onSubmit={submit} className={bodyClass}>
      {children}
    </form>
  )
}

export function AuthPanel(props: AuthPanelProps): ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center bg-surface px-4 py-12 text-ink">
      <p className="m-0 mb-6 font-display text-title text-umber">{copy.shell.title}</p>
      <main className="w-full max-w-sm">
        <Panel element="section" toneClass="bg-surface-raised" spacingClass="gap-6 p-6">
          <h1 className="m-0 font-display text-display-xl text-ink">{props.title}</h1>
          <Body onSubmit={props.onSubmit}>{props.children}</Body>
          {props.footer === undefined ? null : (
            <p className="m-0 flex flex-wrap items-baseline gap-2 font-body text-caption text-ink-muted">
              {props.footer}
            </p>
          )}
        </Panel>
      </main>
    </div>
  )
}
