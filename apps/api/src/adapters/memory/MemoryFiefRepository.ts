import {
  byUnitKind,
  type DomainError,
  type EarnedSkill,
  err,
  Fief,
  type FiefId,
  type FiefRepository,
  type Instant,
  ok,
  type PlayerId,
  type PlotAddress,
  type Result,
  type StoredFief,
} from '@mygame/domain'
import { byEarnedAt } from '../byEarnedAt'
import { reservedPlotOf } from './reservedPlotOf'

const sharesPlot = (left: Fief, right: Fief): boolean =>
  left.coordinates.kingdom === right.coordinates.kingdom &&
  left.coordinates.province === right.coordinates.province &&
  left.coordinates.plot === right.coordinates.plot

const byProvinceThenPlot = (left: Fief, right: Fief): number =>
  left.coordinates.province - right.coordinates.province ||
  left.coordinates.plot - right.coordinates.plot

const storedFiefOf = (
  fief: Fief,
  guidanceDismissedAt: Instant | null,
  skills: ReadonlyArray<EarnedSkill>,
): StoredFief => {
  const { kingdom, province, plot } = fief.coordinates
  return {
    id: fief.id,
    playerId: fief.playerId,
    name: fief.name.value,
    address: { kingdom, province, plot },
    stocks: fief.stocks,
    storedAt: fief.storedAt,
    buildingLevels: fief.buildingLevels,
    artLevels: fief.artLevels,
    units: byUnitKind((unit) => fief.units.countOf(unit)),
    slot: fief.slot,
    buildQueue: fief.buildQueue,
    studySlot: fief.studySlot,
    recruitOrder: fief.recruitOrder,
    march: fief.march,
    ...(fief.incomingCargo === undefined ? {} : { incomingCargo: fief.incomingCargo }),
    fullSince: fief.fullSince,
    guidanceDismissedAt,
    skills,
  }
}

export class MemoryFiefRepository implements FiefRepository {
  private readonly fiefs = new Map<string, Fief>()
  private readonly guidanceDismissals = new Map<FiefId, Instant>()
  private readonly skills = new Map<PlayerId, ReadonlyArray<EarnedSkill>>()

  heldFiefs(): ReadonlyArray<Fief> {
    return [...this.fiefs.values()]
  }

  async occupiedPlots(): Promise<ReadonlyArray<PlotAddress>> {
    const held = [...this.fiefs.values()].map(({ coordinates: { kingdom, province, plot } }) => ({
      kingdom,
      province,
      plot,
    }))
    const reserved = [...this.fiefs.values()].flatMap((fief) => reservedPlotOf(fief) ?? [])
    return [...held, ...reserved]
  }

  async holdsFief(playerId: PlayerId): Promise<boolean> {
    return [...this.fiefs.values()].some((fief) => fief.playerId === playerId)
  }

  async fiefsOf(playerId: PlayerId): Promise<ReadonlyArray<FiefId>> {
    return [...this.fiefs.values()]
      .filter((fief) => fief.playerId === playerId)
      .sort(byProvinceThenPlot)
      .map((fief) => fief.id)
  }

  async foundingsOnTheRoadOf(playerId: PlayerId): Promise<number> {
    return [...this.fiefs.values()].filter(
      (fief) => fief.playerId === playerId && reservedPlotOf(fief) !== undefined,
    ).length
  }

  dismissGuidance(fiefId: FiefId, at: Instant): void {
    this.guidanceDismissals.set(fiefId, at)
  }

  async fiefOf(fiefId: FiefId): Promise<Result<Fief | undefined, DomainError>> {
    const fief = this.fiefs.get(fiefId)
    if (fief === undefined) {
      return ok(undefined)
    }
    return Fief.restore(
      storedFiefOf(
        fief,
        this.guidanceDismissals.get(fiefId) ?? null,
        this.skills.get(fief.playerId) ?? [],
      ),
    )
  }

  private keepSkillsOf(fief: Fief): void {
    const kept = this.skills.get(fief.playerId) ?? []
    const earned = fief.skills.filter(
      (skill) => !kept.some(({ lessonId }) => lessonId === skill.lessonId),
    )
    this.skills.set(fief.playerId, [...kept, ...earned].sort(byEarnedAt))
  }

  async save(fief: Fief): Promise<Result<void, DomainError>> {
    const rival = [...this.fiefs.values()].find(
      (stored) => stored.id !== fief.id && sharesPlot(stored, fief),
    )
    if (rival !== undefined) {
      return err({ kind: 'CoordinatesTaken', coordinates: fief.coordinates })
    }
    const reserved = reservedPlotOf(fief)
    const reservedByRival =
      reserved !== undefined &&
      [...this.fiefs.values()].some((stored) => {
        const rivalPlot = reservedPlotOf(stored)
        return (
          stored.id !== fief.id &&
          rivalPlot?.province === reserved.province &&
          rivalPlot.plot === reserved.plot
        )
      })
    if (reserved !== undefined && reservedByRival) {
      return err({ kind: 'PlotReserved', province: reserved.province, plot: reserved.plot })
    }
    this.fiefs.set(fief.id, fief)
    this.keepSkillsOf(fief)
    return ok(undefined)
  }
}
