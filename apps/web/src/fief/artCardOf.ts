import {
  fiefMaxLevel,
  namesLevel,
  namesUnstudied,
  studyEffect,
  studyEffectAtMaxLevel,
  studyLibraryTooLow,
  studyRequires,
  studyStart,
  studyStudyRunning,
} from '@mygame/catalog'
import type { ArtKind } from '@mygame/contracts'
import type { ArtCardProps } from '../design-system/ArtCard'
import type { CardActionState } from '../design-system/CardAction'
import { capitalize } from '../design-system/capitalize'
import { resourceNameOf } from '../resources/resourceNameOf'
import { artNameOf } from './artNameOf'
import type { LiveFief } from './liveFief'
import { readyLineOf } from './readyLineOf'
import { resourceCostsOf } from './resourceCostsOf'
import { shortfallsOf } from './shortfallsOf'
import { tooExpensiveLineOf } from './tooExpensiveLineOf'

export type ArtCardContent = Omit<ArtCardProps, 'titleElement' | 'isWaiting' | 'onStudy'>

type NextArtLevel = NonNullable<LiveFief['overview']['arts'][ArtKind]['nextLevel']>

function stateOf(nextLevel: NextArtLevel, fief: LiveFief): CardActionState {
  if (fief.overview.study.kind !== 'idle') {
    return { kind: 'blocked', reason: studyStudyRunning() }
  }
  const libraryLevel = fief.overview.buildings.library.level
  if (nextLevel.requiredLibraryLevel > libraryLevel) {
    return {
      kind: 'blocked',
      reason: studyLibraryTooLow({
        required: nextLevel.requiredLibraryLevel,
        current: libraryLevel,
      }),
    }
  }
  const shortfalls = shortfallsOf(nextLevel.cost, fief.amounts)
  if (shortfalls.length > 0) {
    return {
      kind: 'blocked',
      reason: tooExpensiveLineOf(shortfalls),
      ready: readyLineOf(nextLevel.cost, fief),
    }
  }
  return { kind: 'affordable' }
}

export function artCardOf(art: ArtKind, fief: LiveFief): ArtCardContent {
  const { level, resource, ratePercent, nextLevel } = fief.overview.arts[art]
  const common = {
    name: capitalize(artNameOf(art)),
    levelLabel: level === 0 ? namesUnstudied() : namesLevel({ level }),
    actionLabel: studyStart(),
  }
  if (nextLevel === null) {
    return {
      ...common,
      effect: {
        resource,
        text: studyEffectAtMaxLevel({ percent: ratePercent, resource: resourceNameOf(resource) }),
      },
      costs: [],
      requirement: undefined,
      durationSeconds: 0,
      state: { kind: 'atMaxLevel', label: fiefMaxLevel() },
    }
  }
  const effect = studyEffect({
    percent: ratePercent,
    resource: resourceNameOf(resource),
    nextLevel: nextLevel.level,
    nextPercent: nextLevel.ratePercent,
  })
  return {
    ...common,
    effect: { resource, text: effect },
    costs: resourceCostsOf(nextLevel.cost, fief.amounts),
    requirement: {
      label: studyRequires({ libraryLevel: nextLevel.requiredLibraryLevel }),
      isMet: nextLevel.requiredLibraryLevel <= fief.overview.buildings.library.level,
    },
    durationSeconds: nextLevel.durationSeconds,
    state: stateOf(nextLevel, fief),
  }
}
