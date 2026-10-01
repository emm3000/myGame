import type { ReactElement } from 'react'
import { SeasonMark, type SeasonMarkProps } from './SeasonMark'

export interface PreviewLine {
  readonly heading: string
  readonly value: string
  readonly isNumeral: boolean
  readonly marks?: ReadonlyArray<SeasonMarkProps> | undefined
}

export function PreviewLineText({ line }: { readonly line: PreviewLine }): ReactElement {
  return (
    <>
      <b className="font-bold">{line.heading}</b>{' '}
      <span className={line.isNumeral ? 'font-utility font-semibold tabular-nums' : ''}>
        {line.value}
      </span>
    </>
  )
}

export function PreviewLines({
  lines,
}: {
  readonly lines: ReadonlyArray<PreviewLine>
}): ReactElement {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {lines.map((line) => (
        <li key={line.heading} className="font-body text-body text-ink">
          {line.marks === undefined || line.marks.length === 0 ? (
            <PreviewLineText line={line} />
          ) : (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>
                <PreviewLineText line={line} />
              </span>
              {line.marks.map((mark) => (
                <SeasonMark key={mark.words} season={mark.season} words={mark.words} />
              ))}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
