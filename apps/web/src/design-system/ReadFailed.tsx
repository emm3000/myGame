import type { ReactElement } from 'react'
import { Button } from './Button'
import { FormAlert } from './FormAlert'
import type { Label } from './Label'
import { LabelText } from './LabelText'

export interface ReadFailedProps {
  readonly message: Label
  readonly retryLabel: Label
  readonly onRetry: () => void
}

export function ReadFailed({ message, retryLabel, onRetry }: ReadFailedProps): ReactElement {
  return (
    <section className="flex w-full max-w-form flex-col gap-3">
      <FormAlert message={message} />
      <Button type="button" tone="primary" onClick={onRetry}>
        <LabelText label={retryLabel} />
      </Button>
    </section>
  )
}
