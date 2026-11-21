export type LineLanguage = 'en' | 'es'

export interface LabelLine {
  readonly text: string
  readonly language: LineLanguage
}

export interface Label extends LabelLine {
  readonly translation: LabelLine | null
}
