import type { HintKind } from '@mygame/contracts'
import { useState } from 'react'
import type { ApiClient } from '../api/apiClient'

export interface HintsHandle {
  readonly hidden: ReadonlySet<HintKind>
  readonly dismiss: (hint: HintKind) => void
}

export function useHints(apiClient: ApiClient, seenHints: ReadonlyArray<HintKind>): HintsHandle {
  const [dismissed, setDismissed] = useState<ReadonlySet<HintKind>>(new Set())
  const dismiss = (hint: HintKind): void => {
    if (dismissed.has(hint)) {
      return
    }
    setDismissed((current) => new Set([...current, hint]))
    void apiClient.markHintSeen(hint)
  }
  return { hidden: new Set([...seenHints, ...dismissed]), dismiss }
}
