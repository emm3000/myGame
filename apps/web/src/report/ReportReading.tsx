import { reportLoading } from '@mygame/catalog'
import type { ReactElement } from 'react'

export function ReportReading(): ReactElement {
  return (
    <section aria-busy="true" className="flex flex-col gap-3">
      <p role="status" className="m-0 font-sans text-body text-ink-muted">
        {reportLoading()}
      </p>
    </section>
  )
}
