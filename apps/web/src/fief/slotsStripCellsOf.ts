import { copy } from '../copy'
import type { StripCell, StripLine } from '../design-system/SlotsStrip'
import { formatFinishPieces } from '../time/formatFinishPieces'
import type { LiveFief } from './liveFief'
import { marchCountdownOf } from './marchCountdownOf'
import { marchPhaseLineOf } from './marchPhaseLineOf'
import { sectionAnchors } from './sectionAnchors'

const { status, names } = copy

const finishOf = (fief: LiveFief, remainingSeconds: number): ReadonlyArray<string> =>
  remainingSeconds <= 0 ? [copy.fief.finished] : formatFinishPieces(remainingSeconds, fief.at)

function waitingLineOf(fief: LiveFief): ReadonlyArray<StripLine> {
  const last = fief.waitingUpgrades.at(-1)
  return last === undefined
    ? []
    : [
        {
          heading: status.waitingHeading,
          value: String(fief.waitingUpgrades.length),
          timePieces: finishOf(fief, last.remainingSeconds),
        },
      ]
}

function buildCellOf(fief: LiveFief): StripCell {
  const { slot } = fief.overview
  const cell = { id: 'build', icon: 'slot', section: sectionAnchors.build } as const
  if (slot.kind === 'idle') {
    return { ...cell, kind: 'idle', label: status.idleBuild }
  }
  const work = {
    heading: status.buildHeading,
    value: status.work(names.buildings[slot.building], slot.targetLevel),
    timePieces: finishOf(fief, fief.slotRemainingSeconds),
  }
  return {
    ...cell,
    kind: 'busy',
    lines: [work, ...waitingLineOf(fief)],
    progress: {
      value: fief.slotTotalSeconds - fief.slotRemainingSeconds,
      total: fief.slotTotalSeconds,
    },
  }
}

function studyCellOf(fief: LiveFief): StripCell {
  const { study } = fief.overview
  const cell = { id: 'study', icon: 'slot', section: sectionAnchors.library } as const
  if (study.kind === 'idle') {
    return { ...cell, kind: 'idle', label: status.idleStudy }
  }
  return {
    ...cell,
    kind: 'busy',
    lines: [
      {
        heading: status.studyHeading,
        value: status.work(names.arts[study.art], study.targetLevel),
        timePieces: finishOf(fief, fief.studyRemainingSeconds),
      },
    ],
    progress: {
      value: fief.studyTotalSeconds - fief.studyRemainingSeconds,
      total: fief.studyTotalSeconds,
    },
  }
}

function recruitCellOf(fief: LiveFief): StripCell {
  const order = fief.recruitOrder
  const cell = { id: 'recruit', icon: 'slot', section: sectionAnchors.barracks } as const
  if (order === null) {
    return { ...cell, kind: 'idle', label: status.idleRecruit }
  }
  return {
    ...cell,
    kind: 'busy',
    lines: [
      {
        heading: status.recruitHeading,
        value: copy.army.orderLine(order.unit, order.delivered, order.count),
        timePieces: finishOf(fief, order.remainingSeconds),
      },
    ],
    progress: { value: order.totalSeconds - order.remainingSeconds, total: order.totalSeconds },
  }
}

function marchCellOf(fief: LiveFief): StripCell {
  const live = fief.march
  const answered = fief.overview.march
  const cell = { id: 'march', icon: 'march', section: sectionAnchors.barracks } as const
  if (live === null || answered === null) {
    return { ...cell, kind: 'idle', label: status.idleMarch }
  }
  const phase = marchPhaseLineOf(live, answered)
  return {
    ...cell,
    kind: 'busy',
    lines: [
      {
        heading: phase.heading,
        value: phase.value,
        timePieces: finishOf(fief, marchCountdownOf(live, answered).remainingSeconds),
      },
    ],
    progress: { value: live.elapsedSeconds, total: live.totalSeconds },
  }
}

function cargoCellsOf(fief: LiveFief): ReadonlyArray<StripCell> {
  const { incomingCargo } = fief.overview
  if (incomingCargo === null) {
    return []
  }
  return [
    {
      kind: 'busy',
      id: 'cargo',
      icon: 'march',
      section: sectionAnchors.incomingCargo,
      lines: [
        {
          heading: status.cargoHeading,
          value: status.cargoFrom(incomingCargo.from.name),
          timePieces: finishOf(fief, fief.incomingCargoRemainingSeconds),
        },
      ],
      progress: {
        value: fief.incomingCargoTotalSeconds - fief.incomingCargoRemainingSeconds,
        total: fief.incomingCargoTotalSeconds,
      },
    },
  ]
}

export function slotsStripCellsOf(fief: LiveFief): ReadonlyArray<StripCell> {
  const { buildings } = fief.overview
  const hasLibrary = buildings.library.level >= 1
  const hasBarracks = buildings.barracks.level >= 1
  return [
    buildCellOf(fief),
    ...(hasLibrary ? [studyCellOf(fief)] : []),
    ...(hasBarracks ? [recruitCellOf(fief), marchCellOf(fief)] : []),
    ...cargoCellsOf(fief),
  ]
}
