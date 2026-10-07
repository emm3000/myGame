import type { ReactElement } from 'react'
import { FormAlert } from './FormAlert'

export interface NoticeToggleProps {
  readonly label: string
  readonly stateWords: string
  readonly promise: string
  readonly isOn: boolean
  readonly deniedLine: string | undefined
  readonly onToggle: () => void
}

export function NoticeToggle({
  label,
  stateWords,
  promise,
  isOn,
  deniedLine,
  onToggle,
}: NoticeToggleProps): ReactElement {
  return (
    <>
      <div className="order-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 md:order-2">
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          onClick={onToggle}
          className="inline-flex min-h-control cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-utility text-button text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
        >
          <span
            aria-hidden="true"
            className={`flex h-6 w-switch items-center rounded-sm border p-px ${isOn ? 'justify-end border-umber bg-umber' : 'justify-start border-line-strong bg-surface-sunken'}`}
          >
            <span className={`size-icon rounded-sm ${isOn ? 'bg-on-umber' : 'bg-line-strong'}`} />
          </span>
          {label}
          <span aria-hidden="true" className="text-caption font-semibold text-ink-muted">
            {stateWords}
          </span>
        </button>
        <span className="font-body text-caption text-ink-muted">{promise}</span>
      </div>
      {deniedLine !== undefined && (
        <div className="order-4 basis-full md:order-3">
          <FormAlert message={deniedLine} />
        </div>
      )}
    </>
  )
}
