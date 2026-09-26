import type { ReactElement, ReactNode } from 'react'

export type ButtonTone = 'primary' | 'quiet'

export interface ButtonProps {
  readonly children: ReactNode
  readonly type: 'button' | 'submit'
  readonly tone: ButtonTone
  readonly disabled?: boolean
  readonly accessibleName?: string
  readonly onClick?: (() => void) | undefined
}

const toneClass: Readonly<Record<ButtonTone, string>> = {
  primary: 'border-umber bg-umber text-on-umber',
  quiet: 'border-line-strong bg-surface-raised text-ink',
}

export function Button(props: ButtonProps): ReactElement {
  return (
    <button
      type={props.type}
      disabled={props.disabled}
      aria-label={props.accessibleName}
      onClick={props.onClick}
      className={`cursor-pointer rounded-md border px-3 py-2 font-utility text-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken disabled:text-ink-faint ${toneClass[props.tone]}`}
    >
      {props.children}
    </button>
  )
}
