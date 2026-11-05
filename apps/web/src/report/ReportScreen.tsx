import {
  reportNewsClose,
  reportNewsClosed,
  reportNewsNone,
  reportNewsTitle,
  reportNoReviewsDue,
  reportReviewsDue,
  reportStartReviews,
  reportTitle,
} from '@mygame/catalog'
import { type ReactElement, useId } from 'react'
import { Button } from '../design-system/Button'
import { ButtonLink } from '../design-system/ButtonLink'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { formatQuantity } from '../design-system/formatQuantity'
import { Panel } from '../design-system/Panel'
import { useFocusTarget } from '../focus/useFocusTarget'
import type { ReportNewsRow } from './reportNewsRowOf'

export interface ReportNewsClose {
  readonly isClosed: boolean
  readonly isWaiting: boolean
  readonly refusalLine: string | undefined
  readonly onClose: (onClosed: () => void) => void
}

export interface ReportScreenProps {
  readonly dueCount: number
  readonly news: ReadonlyArray<ReportNewsRow>
  readonly close: ReportNewsClose
}

const emptyClass =
  'm-0 max-w-form rounded-md border border-line border-dashed p-5 font-sans text-body text-ink'

function ReviewsDue({ dueCount }: { readonly dueCount: number }): ReactElement {
  if (dueCount === 0) {
    return <p className={emptyClass}>{reportNoReviewsDue()}</p>
  }
  return (
    <Panel element="article" toneClass="bg-surface-raised" spacingClass="max-w-form gap-3 p-5">
      <p className="m-0 font-sans text-heading text-ink">
        {reportReviewsDue({ count: formatQuantity(dueCount) })}
      </p>
      <div className="flex">
        <ButtonLink to="/reviews" tone="primary">
          {reportStartReviews()}
        </ButtonLink>
      </div>
    </Panel>
  )
}

function NewsEntry({ row }: { readonly row: ReportNewsRow }): ReactElement {
  return (
    <li className="flex flex-col gap-1 border-line border-t py-3 first:border-t-0">
      <time
        dateTime={row.occurredAt}
        className="whitespace-nowrap font-sans font-semibold text-caption text-ink-muted tabular-nums"
      >
        {row.instant}
      </time>
      <p className="m-0 font-sans text-body text-ink">{row.line}</p>
      {row.pay === undefined ? null : (
        <p className="m-0 font-sans text-caption text-ink-muted">{row.pay}</p>
      )}
    </li>
  )
}

function NewsBody({
  news,
  close,
  onClosed,
}: ReportScreenProps & { readonly onClosed: () => void }): ReactElement {
  if (close.isClosed) {
    return <p className={emptyClass}>{reportNewsClosed()}</p>
  }
  if (news.length === 0) {
    return <p className={emptyClass}>{reportNewsNone()}</p>
  }
  return (
    <>
      <ol className="m-0 flex list-none flex-col p-0">
        {news.map((row) => (
          <NewsEntry key={row.key} row={row} />
        ))}
      </ol>
      {close.refusalLine !== undefined && <FormAlert message={close.refusalLine} />}
      <div className="flex">
        <Button
          type="button"
          tone="primary"
          availability={close.isWaiting ? 'waiting' : 'available'}
          onClick={() => close.onClose(onClosed)}
        >
          {reportNewsClose()}
        </Button>
      </div>
    </>
  )
}

export function ReportScreen(props: ReportScreenProps): ReactElement {
  const titleId = useId()
  const newsId = useId()
  const newsTitle = useFocusTarget<HTMLHeadingElement>()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
      <h2 id={titleId} className="m-0 font-sans text-title text-ink">
        {reportTitle()}
      </h2>
      <ReviewsDue dueCount={props.dueCount} />
      <Panel
        element="section"
        labelledBy={newsId}
        toneClass="bg-surface-raised"
        spacingClass="max-w-form gap-3 p-5"
      >
        <h3
          id={newsId}
          ref={newsTitle.ref}
          tabIndex={-1}
          className={`m-0 font-sans text-heading text-ink ${focusTargetClass}`}
        >
          {reportNewsTitle()}
        </h3>
        <NewsBody {...props} onClosed={newsTitle.focus} />
      </Panel>
    </section>
  )
}
