import { en, es } from '@mygame/catalog'
import type { Player } from '@mygame/contracts'
import type { Label, LineLanguage } from '../design-system/Label'
import { lineLabelOf } from '../design-system/lineLabelOf'
import type { Catalog, ChromeCatalog, PlayerCopy } from './PlayerCopy'

export type CopyLanguage = Pick<Player, 'scaffold' | 'chromePhase'>

type ChromeLine = (catalog: ChromeCatalog) => string

const bilingualLabelOf = (
  line: ChromeLine,
  scaffoldCatalog: Catalog,
  scaffoldLanguage: LineLanguage,
): Label => {
  const english = line(en)
  const scaffolded = line(scaffoldCatalog)
  if (scaffolded === english) {
    return lineLabelOf(english, 'en')
  }
  return {
    text: english,
    language: 'en',
    translation: { text: scaffolded, language: scaffoldLanguage },
  }
}

export function playerCopyOf({ scaffold, chromePhase }: CopyLanguage): PlayerCopy {
  const scaffoldCatalog: Catalog = scaffold === 'es' ? es : en
  const scaffoldLanguage: LineLanguage = scaffold === 'es' ? 'es' : 'en'
  const chrome = (line: ChromeLine): Label => {
    switch (chromePhase) {
      case 'scaffold':
        return lineLabelOf(line(scaffoldCatalog), scaffoldLanguage)
      case 'both':
        return bilingualLabelOf(line, scaffoldCatalog, scaffoldLanguage)
      case 'english':
        return lineLabelOf(line(en), 'en')
      default: {
        const unknownPhase: never = chromePhase
        return unknownPhase
      }
    }
  }
  return {
    chrome,
    fixedCopy: (line) => lineLabelOf(line(scaffoldCatalog, scaffoldCatalog), scaffoldLanguage),
  }
}
