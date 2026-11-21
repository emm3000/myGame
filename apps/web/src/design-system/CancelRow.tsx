import type { ReactElement } from 'react'
import { Button } from './Button'
import type { CancelAction } from './CancelAction'
import type { Label } from './Label'
import { LabelText } from './LabelText'
import { spokenLanguageOf } from './spokenLanguageOf'
import { spokenLineOf } from './spokenLineOf'

export function CancelRow({
  cancel,
  refund,
}: {
  readonly cancel: CancelAction
  readonly refund: Label | undefined
}): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 self-stretch border-line border-t pt-3">
      {refund !== undefined && (
        <p className="m-0 min-w-0 grow font-sans text-caption text-ink-muted">
          <LabelText label={refund} />
        </p>
      )}
      <Button
        type="button"
        tone="quiet"
        availability={cancel.isWaiting ? 'waiting' : 'available'}
        accessibleName={spokenLineOf(cancel.accessibleName)}
        accessibleLanguage={spokenLanguageOf(cancel.accessibleName)}
        onClick={cancel.onCancel}
      >
        <LabelText label={cancel.label} />
      </Button>
    </div>
  )
}
