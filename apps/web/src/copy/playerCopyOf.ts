import { en, es } from '@mygame/catalog'
import type { Player } from '@mygame/contracts'
import type { Label } from '../design-system/Label'
import type { Catalog, CatalogLine, PlayerCopy } from './PlayerCopy'

export type CopyLanguage = Pick<Player, 'scaffold' | 'chromePhase'>

const bilingualLabelOf = (english: string, scaffolded: string): Label => ({
  text: english,
  translation: scaffolded === english ? null : scaffolded,
})

export function playerCopyOf({ scaffold, chromePhase }: CopyLanguage): PlayerCopy {
  const scaffoldCatalog: Catalog = scaffold === 'es' ? es : en
  const chrome = (line: CatalogLine): Label => {
    switch (chromePhase) {
      case 'scaffold':
        return { text: line(scaffoldCatalog), translation: null }
      case 'both':
        return bilingualLabelOf(line(en), line(scaffoldCatalog))
      case 'english':
        return { text: line(en), translation: null }
      default: {
        const unknownPhase: never = chromePhase
        return unknownPhase
      }
    }
  }
  return { chrome, fixedCopy: (line) => line(scaffoldCatalog) }
}
