import { townTryAgain } from '@mygame/catalog'
import type { ReactElement } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { refusalLineOf } from '../refusals/refusalLineOf'

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
