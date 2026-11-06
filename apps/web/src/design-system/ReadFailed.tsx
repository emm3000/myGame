import type { ReactElement } from 'react'
import { Button } from './Button'
import { FormAlert } from './FormAlert'

export interface ReadFailedProps {
  readonly message: string
  readonly retryLabel: string
  readonly onRetry: () => void
}

export function ReadFailed({ message, retryLabel, onRetry }: ReadFailedProps): ReactElement {
  return (
    <section className="flex w-full max-w-form flex-col gap-3">
      <FormAlert message={message} />
      <Button type="button" tone="primary" onClick={onRetry}>
        {retryLabel}
      </Button>
    </section>
  )
}
