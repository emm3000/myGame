import {
  reportNewsAll,
  reportNewsClose,
  reportNewsClosed,
  reportNewsNone,
  reportNewsTitle,
  reportNoReviewsDue,
  reportReviewsDue,
  reportStartReviews,
  reportTitle,
  schoolLessonReadWords,
} from '@mygame/catalog'
import { type ReactElement, type ReactNode, useId } from 'react'
import { Block } from '../design-system/Block'
import { Button } from '../design-system/Button'
import { ButtonLink } from '../design-system/ButtonLink'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { formatQuantity } from '../design-system/formatQuantity'
import { TextLink } from '../design-system/TextLink'
import { useFocusTarget } from '../focus/useFocusTarget'
import { NewsList } from '../news/NewsList'
import { NewsNote } from '../news/NewsNote'
import type { NewsRow } from '../news/newsRowOf'
import { ReviewsAhead } from '../review/ReviewsAhead'

export interface ReportNewsClose {
  readonly isClosed: boolean
  readonly isWaiting: boolean
  readonly refusalLine: string | undefined
  readonly onClose: (onClosed: () => void) => void
}

export interface ReportScreenProps {
  readonly dueCount: number
  readonly readFirst: ReadonlyArray<string>
  readonly nextReview: string | undefined
  readonly news: ReadonlyArray<NewsRow>
  readonly close: ReportNewsClose
}

function ReviewsDoor({ readFirst }: { readonly readFirst: ReadonlyArray<string> }): ReactElement {
  const [firstUnread] = readFirst
  if (firstUnread === undefined) {
    return (
      <ButtonLink to="/reviews" tone="primary">
        {reportStartReviews()}
      </ButtonLink>
    )
  }
  return (
    <ButtonLink to="/school/$lessonId" params={{ lessonId: firstUnread }} tone="primary">
      {schoolLessonReadWords()}
    </ButtonLink>
  )
}

function ReviewsDue({
  dueCount,
  readFirst,
  nextReview,
}: Pick<ReportScreenProps, 'dueCount' | 'readFirst' | 'nextReview'>): ReactElement {
  const countId = useId()
  if (dueCount === 0) {
    return <ReviewsAhead line={reportNoReviewsDue()} nextReview={nextReview} />
  }
  return (
    <div className="flex flex-col gap-3">
      <Block hue="periwinkle" labelledBy={countId}>
        <h2 id={countId} className="m-0 text-display wrap-anywhere">
          {reportReviewsDue({ count: formatQuantity(dueCount) })}
        </h2>
      </Block>
      <ReviewsDoor readFirst={readFirst} />
    </div>
  )
}

function NewsBody({
  news,
  close,
  onClosed,
}: ReportScreenProps & { readonly onClosed: () => void }): ReactElement {
  if (close.isClosed) {
    return <NewsNote line={reportNewsClosed()} />
  }
  if (news.length === 0) {
    return <NewsNote line={reportNewsNone()} />
  }
  return (
    <>
      <NewsList rows={news} />
      {close.refusalLine !== undefined && <FormAlert message={close.refusalLine} />}
      <Button
        type="button"
        tone="quiet"
        availability={close.isWaiting ? 'waiting' : 'available'}
        onClick={() => close.onClose(onClosed)}
      >
        {reportNewsClose()}
      </Button>
    </>
  )
}

export function ReportTitled({ children }: { readonly children: ReactNode }): ReactElement {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
      <h1 id={titleId} className="m-0 font-sans text-display text-ink">
        {reportTitle()}
      </h1>
      {children}
    </section>
  )
}

export function ReportScreen(props: ReportScreenProps): ReactElement {
  const newsId = useId()
  const newsTitle = useFocusTarget<HTMLHeadingElement>()
  return (
    <ReportTitled>
      <ReviewsDue
        dueCount={props.dueCount}
        readFirst={props.readFirst}
        nextReview={props.nextReview}
      />
      <section aria-labelledby={newsId} className="flex flex-col gap-3">
        <h2
          id={newsId}
          ref={newsTitle.ref}
          tabIndex={-1}
          className={`m-0 font-sans text-meta text-ink-muted ${focusTargetClass}`}
        >
          {reportNewsTitle()}
        </h2>
        <NewsBody {...props} onClosed={newsTitle.focus} />
        <p className="m-0 border-line border-t pt-1">
          <TextLink to="/news">{reportNewsAll()}</TextLink>
        </p>
      </section>
    </ReportTitled>
  )
}
