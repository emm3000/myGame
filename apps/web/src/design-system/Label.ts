export type LineLanguage = 'en' | 'es'

export interface LabelInset {
  readonly at: number
  readonly text: string
  readonly language: LineLanguage
}

export interface LabelFigure {
  readonly at: number
  readonly text: string
}

export interface LabelLine {
  readonly text: string
  readonly language: LineLanguage
  readonly inset?: LabelInset
  readonly figures?: ReadonlyArray<LabelFigure>
}

export interface Label extends LabelLine {
  readonly translation: LabelLine | null
}
