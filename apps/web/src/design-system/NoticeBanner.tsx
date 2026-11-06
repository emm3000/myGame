import { type ReactElement, useId } from 'react'
import { Button } from './Button'

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

const lineClass = 'm-0 min-w-0 py-1 font-sans text-caption'

function NoticeLine({
  id,
  line,
  outcome,
}: Pick<NoticeBannerProps, 'line' | 'outcome'> & { readonly id: string }): ReactElement {
  if (outcome === undefined) {
    return (
      <p id={id} className={`${lineClass} text-ink-muted`}>
        {line}
      </p>
    )
  }
  return outcome.kind === 'failed' ? (
    <p id={id} role="alert" className={`${lineClass} text-destructive-ink`}>
      {outcome.message}
    </p>
  ) : (
    <p id={id} role="status" className={`${lineClass} text-ink`}>
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
      className="sticky bottom-0 flex items-center justify-between gap-2 border-line border-t bg-surface px-5 md:px-8"
    >
      <NoticeLine id={lineId} line={props.line} outcome={props.outcome} />
      <span className="-mr-3 flex shrink-0">
        <Button type="button" tone="text" disabled={props.isBusy} onClick={props.onAction}>
          {props.actionLabel}
        </Button>
      </span>
    </section>
  )
}
