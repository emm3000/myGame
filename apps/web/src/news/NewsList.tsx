import type { ReactElement } from 'react'
import type { NewsRow } from './newsRowOf'

function NewsEntry({ row }: { readonly row: NewsRow }): ReactElement {
  return (
    <li className="flex flex-col gap-1 border-line border-t py-3">
      <time
        dateTime={row.occurredAt}
        className="whitespace-nowrap font-sans text-caption text-ink-muted"
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

export function NewsList({ rows }: { readonly rows: ReadonlyArray<NewsRow> }): ReactElement {
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {rows.map((row) => (
        <NewsEntry key={row.key} row={row} />
      ))}
    </ol>
  )
}
