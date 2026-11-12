import type { TipKind } from './TipKind'

const everyTip: Readonly<Record<TipKind, true>> = {
  people: true,
  seasons: true,
  waitingList: true,
  office: true,
  jobs: true,
  fullStore: true,
}

const isTipKind = (key: string): key is TipKind => key in everyTip

export const tipKinds: ReadonlyArray<TipKind> = Object.keys(everyTip).filter(isTipKind)
