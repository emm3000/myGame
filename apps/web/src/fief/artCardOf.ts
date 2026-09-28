import type { ArtKind, ResourceKind } from '@mygame/contracts'
import { copy } from '../copy'
import type { ArtCardProps } from '../design-system/ArtCard'
import type { CardActionState } from '../design-system/CardAction'
import { capitalize } from '../design-system/capitalize'
import type { LiveFief } from './liveFief'
import { resourceCostsOf, shortfallsOf } from './resourceCosts'

export type ArtCardContent = Omit<ArtCardProps, 'titleElement' | 'isWaiting' | 'onStudy'>

const { names } = copy

const artResource: Readonly<Record<ArtKind, ResourceKind>> = {
  smithing: 'iron',
  masonry: 'stone',
}

type NextArtLevel = NonNullable<LiveFief['overview']['arts'][ArtKind]['nextLevel']>

function stateOf(nextLevel: NextArtLevel, fief: LiveFief): CardActionState {
  if (fief.overview.study.kind === 'busy') {
    return { kind: 'blocked', reason: copy.study.studyRunning }
  }
  const libraryLevel = fief.overview.buildings.library.level
  if (nextLevel.requiredLibraryLevel > libraryLevel) {
    return {
      kind: 'blocked',
      reason: copy.study.libraryTooLow(nextLevel.requiredLibraryLevel, libraryLevel),
    }
  }
  const shortfalls = shortfallsOf(nextLevel.cost, fief.amounts)
  if (shortfalls.length > 0) {
    return { kind: 'blocked', reason: copy.fief.tooExpensive(shortfalls) }
  }
  return { kind: 'affordable' }
}

export function artCardOf(art: ArtKind, fief: LiveFief): ArtCardContent {
  const { level, ratePercent, nextLevel } = fief.overview.arts[art]
  const resource = artResource[art]
  const common = {
    name: capitalize(names.arts[art]),
    levelLabel: level === 0 ? names.unstudied : names.level(level),
    actionLabel: copy.study.start,
  }
  if (nextLevel === null) {
    return {
      ...common,
      effect: { resource, text: copy.study.effectAtMaxLevel(ratePercent, resource) },
      costs: [],
      requirement: undefined,
      durationSeconds: 0,
      state: { kind: 'atMaxLevel', label: copy.fief.maxLevel },
    }
  }
  const next = { level: nextLevel.level, percent: nextLevel.ratePercent }
  return {
    ...common,
    effect: { resource, text: copy.study.effect(ratePercent, resource, next) },
    costs: resourceCostsOf(nextLevel.cost, fief.amounts),
    requirement: {
      label: copy.study.requires(nextLevel.requiredLibraryLevel),
      isMet: nextLevel.requiredLibraryLevel <= fief.overview.buildings.library.level,
    },
    durationSeconds: nextLevel.durationSeconds,
    state: stateOf(nextLevel, fief),
  }
}
