import { townLoadFailed, townLoading, townTryAgain } from '@mygame/catalog'
import type { ReactElement } from 'react'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'

export function TownReading(): ReactElement {
  return (
    <section aria-busy="true" className="flex flex-col gap-3">
      <p role="status" className="m-0 font-sans text-body text-ink-muted">
        {townLoading()}
      </p>
    </section>
  )
}

export function TownReadFailed({ onRetry }: { readonly onRetry: () => void }): ReactElement {
  return (
    <section className="flex flex-col items-start gap-3">
      <FormAlert message={townLoadFailed()} />
      <Button type="button" tone="primary" onClick={onRetry}>
        {townTryAgain()}
      </Button>
    </section>
  )
}
