import { type ReactElement, useId } from 'react'
import { Button } from './Button'
import { FormAlert } from './FormAlert'
import { MailIcon } from './icons/MailIcon'

export type NoticeOutcome =
  | { readonly kind: 'sent'; readonly message: string }
  | { readonly kind: 'failed'; readonly message: string }

export interface NoticeBannerProps {
  readonly line: string
  readonly actionLabel: string
  readonly isBusy: boolean
  readonly onAction: () => void
  readonly outcome: NoticeOutcome | undefined
}

function Outcome({ outcome }: { readonly outcome: NoticeOutcome }): ReactElement {
  if (outcome.kind === 'failed') {
    return <FormAlert message={outcome.message} />
  }
  return (
    <p
      role="status"
      className="m-0 rounded-md border border-moss bg-moss-soft px-3 py-2 font-body text-caption text-ink"
    >
      {outcome.message}
    </p>
  )
}

export function NoticeBanner(props: NoticeBannerProps): ReactElement {
  const lineId = useId()
  return (
    <section
      aria-labelledby={lineId}
      aria-busy={props.isBusy}
      className="flex flex-col gap-3 rounded-md border-l-4 border-l-ochre bg-surface-raised px-4 py-3 shadow-card"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-start gap-3 md:flex-1 md:items-center">
          <span className="flex text-ochre">
            <MailIcon />
          </span>
          <p id={lineId} className="m-0 min-w-0 flex-1 font-body text-body text-ink">
            {props.line}
          </p>
        </div>
        <span className="flex flex-col">
          <Button type="button" tone="quiet" disabled={props.isBusy} onClick={props.onAction}>
            {props.actionLabel}
          </Button>
        </span>
      </div>
      {props.outcome === undefined ? null : <Outcome outcome={props.outcome} />}
    </section>
  )
}
