export type IrregularForms = {
  readonly past: string
  readonly pastParticiple: string
}

export type HaveBefore = 'none' | 'have' | "'s"

export type CardWordFormContext = {
  readonly irregularVerbs: ReadonlyMap<string, IrregularForms>
  readonly haveBefore: HaveBefore
}
