import { newsNone, newsTitle } from '@mygame/catalog'
import { type ReactElement, type ReactNode, useId } from 'react'
import { NewsList } from './NewsList'
import type { NewsRow } from './newsRowOf'

export function NewsTitled({ children }: { readonly children: ReactNode }): ReactElement {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex w-full max-w-form flex-col gap-6">
      <h1 id={titleId} className="m-0 font-sans text-display text-ink">
        {newsTitle()}
      </h1>
      {children}
    </section>
  )
}

export function NewsScreen({ rows }: { readonly rows: ReadonlyArray<NewsRow> }): ReactElement {
  return (
    <NewsTitled>
      {rows.length === 0 ? (
        <p className="m-0 border-line border-t py-3 font-sans text-body text-ink">{newsNone()}</p>
      ) : (
        <NewsList rows={rows} />
      )}
    </NewsTitled>
  )
}
