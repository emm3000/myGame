import { type ReactElement, type ReactNode, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { LabelText } from '../design-system/LabelText'
import { NewsList } from './NewsList'
import { NewsNote } from './NewsNote'
import type { NewsRow } from './newsRowOf'

export function NewsTitled({ children }: { readonly children: ReactNode }): ReactElement {
  const titleId = useId()
  const copy = usePlayerCopy()
  return (
    <section aria-labelledby={titleId} className="flex w-full max-w-form flex-col gap-6">
      <h1 id={titleId} className="m-0 font-sans text-display text-ink">
        <LabelText label={copy.chrome((catalog) => catalog.newsTitle())} />
      </h1>
      {children}
    </section>
  )
}

export function NewsScreen({ rows }: { readonly rows: ReadonlyArray<NewsRow> }): ReactElement {
  const copy = usePlayerCopy()
  return (
    <NewsTitled>
      {rows.length === 0 ? (
        <NewsNote line={copy.chrome((catalog) => catalog.newsNone())} />
      ) : (
        <NewsList rows={rows} />
      )}
    </NewsTitled>
  )
}
