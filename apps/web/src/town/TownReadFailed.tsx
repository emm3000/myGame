import { townTryAgain } from '@mygame/catalog'
import type { ReactElement } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { ReadFailed } from '../design-system/ReadFailed'
import { refusalLineOf } from '../refusals/refusalLineOf'

interface TownReadFailedProps {
  readonly refusal: ApiRefusal
  readonly onRetry: () => void
}

export function TownReadFailed({ refusal, onRetry }: TownReadFailedProps): ReactElement {
  return (
    <ReadFailed message={refusalLineOf(refusal)} retryLabel={townTryAgain()} onRetry={onRetry} />
  )
}
