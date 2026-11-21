import type { ReactElement } from 'react'
import type { Label } from './Label'

export function LabelText({ label }: { readonly label: Label }): ReactElement {
  const { translation } = label
  if (translation === null) {
    return <span lang={label.language}>{label.text}</span>
  }
  return (
    <span className="inline-flex flex-col">
      <span lang={label.language}>{label.text}</span>{' '}
      <span lang={translation.language} className="font-sans text-caption">
        {translation.text}
      </span>
    </span>
  )
}
