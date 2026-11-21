import type { ReactElement, ReactNode } from 'react'
import type { Label, LabelFigure, LabelInset, LabelLine } from './Label'

type LineMark =
  | ({ readonly kind: 'inset' } & LabelInset)
  | ({ readonly kind: 'figure' } & LabelFigure)

const marksOf = ({ inset, figures }: LabelLine): ReadonlyArray<LineMark> =>
  [
    ...(inset === undefined ? [] : [{ kind: 'inset' as const, ...inset }]),
    ...(figures ?? []).map((figure) => ({ kind: 'figure' as const, ...figure })),
  ].sort((first, second) => first.at - second.at)

function MarkText({ mark }: { readonly mark: LineMark }): ReactElement {
  return mark.kind === 'inset' ? (
    <span lang={mark.language}>{mark.text}</span>
  ) : (
    <span className="tabular-nums">{mark.text}</span>
  )
}

function piecesOf(line: LabelLine): ReadonlyArray<ReactNode> {
  const { pieces, from } = marksOf(line).reduce<{
    readonly pieces: ReadonlyArray<ReactNode>
    readonly from: number
  }>(
    (drawn, mark) => ({
      pieces: [
        ...drawn.pieces,
        line.text.slice(drawn.from, mark.at),
        <MarkText key={mark.at} mark={mark} />,
      ],
      from: mark.at + mark.text.length,
    }),
    { pieces: [], from: 0 },
  )
  return [...pieces, line.text.slice(from)]
}

function LineText({
  line,
  className,
}: {
  readonly line: LabelLine
  readonly className?: string
}): ReactElement {
  return (
    <span lang={line.language} className={className}>
      {piecesOf(line)}
    </span>
  )
}

export function LabelText({ label }: { readonly label: Label }): ReactElement {
  const { translation } = label
  if (translation === null) {
    return <LineText line={label} />
  }
  return (
    <span className="inline-flex flex-col">
      <LineText line={label} /> <LineText line={translation} className="font-sans text-caption" />
    </span>
  )
}
