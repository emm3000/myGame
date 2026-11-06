import {
  hintsDismiss,
  hintsLinesBarracks,
  hintsLinesFullStore,
  hintsLinesLibrary,
  hintsLinesMarches,
  hintsLinesPeasants,
  hintsLinesQueue,
  hintsLinesSeasons,
} from '@mygame/catalog'
import type { HintKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import type { HintProps } from '../design-system/Hint'
import { MarchIcon } from '../design-system/icons/MarchIcon'
import { PeasantsIcon } from '../design-system/icons/PeasantsIcon'
import { SlotIcon } from '../design-system/icons/SlotIcon'
import { resourceAccent } from '../design-system/resourceAccent'
import { seasonIconOf } from '../design-system/seasonIconOf'
import type { ShownHint } from './ShownHint'
import type { HintsHandle } from './useHints'

const hintLines: Readonly<Record<HintKind, () => string>> = {
  peasants: hintsLinesPeasants,
  seasons: hintsLinesSeasons,
  queue: hintsLinesQueue,
  library: hintsLinesLibrary,
  barracks: hintsLinesBarracks,
  marches: hintsLinesMarches,
  fullStore: hintsLinesFullStore,
}

function iconOf(hint: ShownHint): ReactElement {
  switch (hint.kind) {
    case 'peasants':
      return <PeasantsIcon />
    case 'seasons': {
      const SeasonIcon = seasonIconOf[hint.season]
      return <SeasonIcon />
    }
    case 'queue':
    case 'library':
    case 'barracks':
      return <SlotIcon />
    case 'marches':
      return <MarchIcon />
    case 'fullStore': {
      const Icon = resourceAccent[hint.resource]
      return <Icon />
    }
    default: {
      const unreachable: never = hint
      return unreachable
    }
  }
}

export function hintPropsOf(hint: ShownHint, hints: HintsHandle): HintProps {
  return {
    icon: iconOf(hint),
    line: hintLines[hint.kind](),
    dismissLabel: hintsDismiss(),
    onDismiss: () => hints.dismiss(hint.kind),
  }
}
