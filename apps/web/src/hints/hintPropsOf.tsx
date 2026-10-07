import type { ReactElement } from 'react'
import { copy } from '../copy'
import type { HintProps } from '../design-system/Hint'
import { MarchIcon } from '../design-system/icons/MarchIcon'
import { PeasantsIcon } from '../design-system/icons/PeasantsIcon'
import { SlotIcon } from '../design-system/icons/SlotIcon'
import { resourceAccent } from '../design-system/resourceAccent'
import { seasonIconOf } from '../design-system/seasonIconOf'
import type { ShownHint } from './ShownHint'
import type { HintsHandle } from './useHints'

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
      const { Icon } = resourceAccent[hint.resource]
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
    line: copy.hints.lines[hint.kind],
    dismissLabel: copy.hints.dismiss,
    onDismiss: () => hints.dismiss(hint.kind),
  }
}
