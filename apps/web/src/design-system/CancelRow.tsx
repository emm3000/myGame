import type { ReactElement } from 'react'
import { Button } from './Button'
import type { CancelAction } from './CancelAction'

export function CancelRow({
  cancel,
  refund,
}: {
  readonly cancel: CancelAction
  readonly refund: string | undefined
}): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 self-stretch border-line border-t pt-3">
      {refund !== undefined && (
        <p className="m-0 min-w-0 grow font-body text-caption text-ink-muted">{refund}</p>
      )}
      <Button
        type="button"
        tone="quiet"
        availability={cancel.isWaiting ? 'waiting' : 'available'}
        accessibleName={cancel.accessibleName}
        onClick={cancel.onCancel}
      >
        {cancel.label}
      </Button>
    </div>
  )
}
