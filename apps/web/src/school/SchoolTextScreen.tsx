import type { FrameSpan, OpenText, WordSupport } from '@mygame/contracts'
import { type ReactElement, useId, useState } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Block } from '../design-system/Block'
import { Button } from '../design-system/Button'
import { LabelText } from '../design-system/LabelText'
import { TextLink } from '../design-system/TextLink'

interface SpanAt {
  readonly sentence: number
  readonly span: number
}

function SupportText({ support }: { readonly support: WordSupport }): ReactElement {
  return (
    <span lang={support.language} className="text-gloss text-on-block-muted">
      {support.text}
    </span>
  )
}

function SpanPiece({
  span,
  isOpen,
  regionId,
  onTap,
}: {
  readonly span: FrameSpan
  readonly isOpen: boolean
  readonly regionId: string
  readonly onTap: () => void
}): ReactElement {
  const { support } = span
  if (support === null) {
    return <>{span.text}</>
  }
  if (support.shown === 'beside') {
    return (
      <>
        {span.text} <SupportText support={support} />
      </>
    )
  }
  return (
    <Button
      type="button"
      tone="readingWord"
      isExpanded={isOpen}
      controls={regionId}
      onClick={onTap}
    >
      {span.text}
    </Button>
  )
}

const supportAt = (text: OpenText, at: SpanAt | null): WordSupport | null => {
  const support = at === null ? null : (text.sentences[at.sentence]?.[at.span]?.support ?? null)
  return support?.shown === 'onTap' ? support : null
}

function Sentence({
  spans,
  sentence,
  regionId,
  tapped,
  onTap,
}: {
  readonly spans: ReadonlyArray<FrameSpan>
  readonly sentence: number
  readonly regionId: string
  readonly tapped: SpanAt | null
  readonly onTap: (at: SpanAt) => void
}): ReactElement {
  return (
    <p lang="en" className="m-0 text-reading wrap-anywhere">
      {spans.map((span, index) => (
        <SpanPiece
          // biome-ignore lint/suspicious/noArrayIndexKey: a text's spans are content that never reorders
          key={index}
          span={span}
          isOpen={tapped?.sentence === sentence && tapped.span === index}
          regionId={regionId}
          onTap={() => onTap({ sentence, span: index })}
        />
      ))}
    </p>
  )
}

export interface SchoolTextScreenProps {
  readonly text: OpenText
}

export function SchoolTextScreen({ text }: SchoolTextScreenProps): ReactElement {
  const titleId = useId()
  const supportIdPrefix = useId()
  const supportIdOf = (sentence: number): string => `${supportIdPrefix}-${sentence}`
  const { chrome } = usePlayerCopy()
  const [tapped, setTapped] = useState<SpanAt | null>(null)
  const openSupport = supportAt(text, tapped)
  const toggle = (at: SpanAt): void =>
    setTapped((current) =>
      current?.sentence === at.sentence && current.span === at.span ? null : at,
    )
  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-4">
      <h1 id={titleId} lang="en" className="m-0 font-sans text-title text-ink">
        {text.title}
      </h1>
      <Block hue="peach" labelledBy={titleId}>
        {text.sentences.map((spans, sentence) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a text's sentences are content that never reorders
          <div key={sentence} className="flex flex-col gap-1">
            <Sentence
              spans={spans}
              sentence={sentence}
              regionId={supportIdOf(sentence)}
              tapped={tapped}
              onTap={toggle}
            />
            <p
              id={supportIdOf(sentence)}
              role="status"
              aria-live="polite"
              className="m-0 empty:absolute"
            >
              {openSupport !== null && tapped?.sentence === sentence && (
                <SupportText support={openSupport} />
              )}
            </p>
          </div>
        ))}
      </Block>
      <TextLink to="/school">
        <LabelText label={chrome((catalog) => catalog.townGoToSchool())} />
      </TextLink>
    </div>
  )
}
