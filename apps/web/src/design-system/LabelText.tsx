import type { ReactElement } from 'react'
import type { Label, LabelLine } from './Label'

function LineText({
  line,
  className,
}: {
  readonly line: LabelLine
  readonly className?: string
}): ReactElement {
  const { inset } = line
  if (inset === undefined) {
    return (
      <span lang={line.language} className={className}>
        {line.text}
      </span>
    )
  }
  return (
    <span lang={line.language} className={className}>
      {line.text.slice(0, inset.at)}
      <span lang={inset.language}>{inset.text}</span>
      {line.text.slice(inset.at + inset.text.length)}
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
