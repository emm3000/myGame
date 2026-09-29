import type { ReactElement } from 'react'

export interface PreviewLine {
  readonly heading: string
  readonly value: string
  readonly isNumeral: boolean
  readonly isChanged?: boolean | undefined
}

const valueClassOf = (line: PreviewLine): string =>
  [
    line.isNumeral ? 'font-utility font-semibold tabular-nums' : '',
    line.isChanged ? 'text-ochre' : '',
  ]
    .filter((each) => each !== '')
    .join(' ')

export function PreviewLineText({ line }: { readonly line: PreviewLine }): ReactElement {
  return (
    <>
      <b className="font-bold">{line.heading}</b>{' '}
      <span className={valueClassOf(line)}>{line.value}</span>
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
          <PreviewLineText line={line} />
        </li>
      ))}
    </ul>
  )
}
