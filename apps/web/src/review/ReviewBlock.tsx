import { type ReactElement, useId } from 'react'
import { Block } from '../design-system/Block'
import { blockHueOf } from '../design-system/blockHueOf'

export interface ReviewBlockProps {
  readonly cue: string
  readonly cueLang: 'en' | 'es'
  readonly frame: string
  readonly walked: number
}

export function ReviewBlock({ cue, cueLang, frame, walked }: ReviewBlockProps): ReactElement {
  const cueId = useId()
  return (
    <Block hue={blockHueOf(walked)} labelledBy={cueId}>
      <h2 id={cueId} lang={cueLang} className="m-0 text-word wrap-anywhere">
        {cue}
      </h2>
      <p lang="en" className="m-0 text-reading wrap-anywhere">
        {frame}
      </p>
    </Block>
  )
}
