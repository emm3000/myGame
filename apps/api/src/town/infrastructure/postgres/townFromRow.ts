import {
  type DomainError,
  type FullSince,
  Instant,
  type Result,
  Town,
  TownAddress,
  TownName,
  type TownSkill,
} from '@mygame/domain'
import { z } from 'zod'
import { buildingLevelsFromRow, waitingListFromRow, workSlotFromRow } from './buildingWorkFromRow'
import { byEarnedAt } from './byEarnedAt'
import { hiresFromRow, hiringSlotFromRow } from './hiringFromRow'
import { jobSlotFromRow } from './jobSlotFromRow'
import { townResource, type towns } from './townTables'

type TownRow = typeof towns.$inferSelect

export type TownReadRow = {
  readonly town: TownRow
  readonly levels: unknown
  readonly waitingWork: unknown
  readonly hires: unknown
  readonly hiringOrder: unknown
  readonly job: unknown
  readonly skills: unknown
}

const AggregatedSkillsSchema = z.array(
  z.strictObject({
    lessonId: z.string(),
    resource: z.enum(townResource.enumValues),
    ratePercent: z.number().int(),
    earnedAt: z.string(),
  }),
)

const skillsOf = (aggregate: unknown): ReadonlyArray<TownSkill> =>
  AggregatedSkillsSchema.parse(aggregate)
    .map((skill) => ({
      ...skill,
      earnedAt: Instant.fromEpochMilliseconds(Date.parse(skill.earnedAt)),
    }))
    .sort(byEarnedAt)

export const instantFromColumn = (date: Date | null): Instant | null =>
  date === null ? null : Instant.fromEpochMilliseconds(date.getTime())

const fullSinceOf = (row: TownRow): FullSince => ({
  money: instantFromColumn(row.fullSinceMoney),
  food: instantFromColumn(row.fullSinceFood),
  power: instantFromColumn(row.fullSincePower),
  material: instantFromColumn(row.fullSinceMaterial),
})

export const townFromRow = ({
  town: row,
  levels,
  waitingWork,
  hires,
  hiringOrder,
  job,
  skills,
}: TownReadRow): Result<Town, DomainError> => {
  const name = TownName.create(row.name)
  if (!name.ok) {
    return name
  }
  const address = TownAddress.create(row.region, row.area, row.site)
  if (!address.ok) {
    return address
  }
  return Town.restore({
    id: row.id,
    playerId: row.playerId,
    name: name.value,
    address: address.value,
    stocks: { money: row.money, food: row.food, power: row.power, material: row.material },
    storedAt: Instant.fromEpochMilliseconds(row.storedAt.getTime()),
    fullSince: fullSinceOf(row),
    buildingLevels: buildingLevelsFromRow(levels),
    workSlot: workSlotFromRow(row),
    waitingList: waitingListFromRow(waitingWork),
    hires: hiresFromRow(row, hires),
    hiringSlot: hiringSlotFromRow(hiringOrder),
    jobSlot: jobSlotFromRow(job),
    skills: skillsOf(skills),
  })
}
