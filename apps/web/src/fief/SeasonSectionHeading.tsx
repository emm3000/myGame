import type { ReactElement } from 'react'
import { SeasonMark, type SeasonMarkProps } from '../design-system/SeasonMark'

export interface SeasonSectionHeadingProps {
  readonly id: string
  readonly title: string
  readonly mark: SeasonMarkProps | undefined
}

export function SeasonSectionHeading({ id, title, mark }: SeasonSectionHeadingProps): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h3 id={id} className="m-0 font-body text-heading text-ink">
        {title}
      </h3>
      {mark !== undefined && (
        <span className="flex">
          <SeasonMark {...mark} />
        </span>
      )}
    </div>
  )
}
