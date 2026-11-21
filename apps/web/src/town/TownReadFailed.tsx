import type { ReactElement } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { ReadFailed } from '../design-system/ReadFailed'
import { refusalLineOf } from '../refusals/refusalLineOf'

interface TownReadFailedProps {
  readonly refusal: ApiRefusal
  readonly onRetry: () => void
}

export function TownReadFailed({ refusal, onRetry }: TownReadFailedProps): ReactElement {
  const copy = usePlayerCopy()
  return (
    <ReadFailed
      message={copy.fixedCopy((catalog) => refusalLineOf(catalog, refusal))}
      retryLabel={copy.chrome((catalog) => catalog.townTryAgain())}
      onRetry={onRetry}
    />
  )
}
