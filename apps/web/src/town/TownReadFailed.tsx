import { es, townTryAgain } from '@mygame/catalog'
import type { ReactElement } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { ReadFailed } from '../design-system/ReadFailed'
import { refusalLineOf } from '../refusals/refusalLineOf'

interface TownReadFailedProps {
  readonly refusal: ApiRefusal
  readonly onRetry: () => void
}

export function TownReadFailed({ refusal, onRetry }: TownReadFailedProps): ReactElement {
  return (
    <ReadFailed
      message={lineLabelOf(refusalLineOf(es, refusal), 'es')}
      retryLabel={lineLabelOf(townTryAgain(), 'es')}
      onRetry={onRetry}
    />
  )
}
