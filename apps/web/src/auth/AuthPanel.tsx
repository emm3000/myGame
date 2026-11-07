import { shellTitle } from '@mygame/catalog'
import type { FormEvent, ReactElement, ReactNode } from 'react'
import { Panel } from '../design-system/Panel'

export interface AuthPanelProps {
  readonly title: string
  readonly lead?: string
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
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <div className="flex grow flex-col items-center px-4 py-12">
        <main className="w-full max-w-sm">
          <Panel
            element="section"
            toneClass="border-line bg-surface-raised"
            spacingClass="gap-6 p-6"
          >
            <p className="m-0 -mb-2 font-sans text-title text-action">{shellTitle()}</p>
            <h1 className="m-0 font-sans text-display text-ink">{props.title}</h1>
            {props.lead === undefined ? null : (
              <p className="m-0 -mt-2 font-sans text-body text-ink-muted">{props.lead}</p>
            )}
            <Body onSubmit={props.onSubmit}>{props.children}</Body>
            {props.footer === undefined ? null : (
              <p className="m-0 flex flex-wrap items-baseline gap-2 font-sans text-caption text-ink-muted">
                {props.footer}
              </p>
            )}
          </Panel>
        </main>
      </div>
    </div>
  )
}
