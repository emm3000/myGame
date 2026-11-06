import type { ReactElement, ReactNode } from 'react'
import { type BlockHue, hueClassOf } from './blockHueOf'

export interface BlockProps {
  readonly hue: BlockHue
  readonly labelledBy: string
  readonly children: ReactNode
}

export function Block({ hue, labelledBy, children }: BlockProps): ReactElement {
  return (
    <section
      aria-labelledby={labelledBy}
      data-hue={hue}
      className={`flex flex-col gap-3 rounded-lg p-6 font-sans text-on-block ${hueClassOf(hue)}`}
    >
      {children}
    </section>
  )
}
