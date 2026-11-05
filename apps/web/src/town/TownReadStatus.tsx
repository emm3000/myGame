import { townLoading, townTryAgain } from '@mygame/catalog'
import type { ReactElement } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { refusalLineOf } from '../refusals/refusalLineOf'

export function TownReading(): ReactElement {
  return (
    <section aria-busy="true" className="flex flex-col gap-3">
      <p role="status" className="m-0 font-sans text-body text-ink-muted">
        {townLoading()}
      </p>
    </section>
  )
}

interface TownReadFailedProps {
  readonly refusal: ApiRefusal
  readonly onRetry: () => void
}

export function TownReadFailed({ refusal, onRetry }: TownReadFailedProps): ReactElement {
  return (
    <section className="flex flex-col items-start gap-3">
      <FormAlert message={refusalLineOf(refusal)} />
      <Button type="button" tone="primary" onClick={onRetry}>
        {townTryAgain()}
      </Button>
    </section>
  )
}
