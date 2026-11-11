import type { ReactElement } from 'react'
import { ClockIcon } from './icons/ClockIcon'

export interface SlotCountdown {
  readonly words: string
  readonly time: string
}

export type CountdownGround = 'paper' | 'block'

const groundClass: Readonly<
  Record<CountdownGround, { readonly line: string; readonly time: string }>
> = {
  paper: { line: 'text-ink-muted', time: 'text-ink' },
  block: { line: 'text-on-block-muted', time: 'text-on-block' },
}

export function CountdownLine({
  words,
  time,
  ground = 'paper',
}: SlotCountdown & { readonly ground?: CountdownGround }): ReactElement {
  const { line, time: timeClass } = groundClass[ground]
  return (
    <span role="timer" className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-sans ${line}`}>
      <ClockIcon sizeClass="size-icon" />
      <span className="text-caption">{words}</span>
      <span className={`text-heading tabular-nums ${timeClass}`}>{time}</span>
    </span>
  )
}
