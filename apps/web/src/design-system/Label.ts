export type LineLanguage = 'en' | 'es'

export interface LabelInset {
  readonly at: number
  readonly text: string
  readonly language: LineLanguage
}

export interface LabelLine {
  readonly text: string
  readonly language: LineLanguage
  readonly inset?: LabelInset
}

export interface Label extends LabelLine {
  readonly translation: LabelLine | null
}
