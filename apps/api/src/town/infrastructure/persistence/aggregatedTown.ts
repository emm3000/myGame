import { eq, type SQL, sql } from 'drizzle-orm'
import { jsonAggregateOf } from '#platform/infrastructure/persistence/jsonAggregateOf'
import { townHires, townHiringOrders } from './hiringTables'
import { townJobs } from './jobsTables'
import { earnedSkills } from './schoolTables'
import { townBuildings, towns, townWaitingWork } from './townTables'

export type AggregatedTown = {
  readonly levels: SQL<unknown>
  readonly waitingWork: SQL<unknown>
  readonly hires: SQL<unknown>
  readonly hiringOrder: SQL<unknown>
  readonly job: SQL<unknown>
  readonly skills: SQL<unknown>
}

export const aggregatedTown: AggregatedTown = {
  levels: jsonAggregateOf(
    townBuildings,
    { building: townBuildings.building, level: townBuildings.level },
    eq(townBuildings.townId, towns.id),
    sql`${townBuildings.building}`,
  ),
  waitingWork: jsonAggregateOf(
    townWaitingWork,
    {
      building: townWaitingWork.building,
      level: townWaitingWork.level,
      costMoney: townWaitingWork.costMoney,
      costFood: townWaitingWork.costFood,
      costPower: townWaitingWork.costPower,
      costMaterial: townWaitingWork.costMaterial,
      durationSeconds: townWaitingWork.durationSeconds,
    },
    eq(townWaitingWork.townId, towns.id),
    sql`${townWaitingWork.position}`,
  ),
  hires: jsonAggregateOf(
    townHires,
    { hire: townHires.hire, count: townHires.count },
    eq(townHires.townId, towns.id),
    sql`${townHires.hire}`,
  ),
  hiringOrder: jsonAggregateOf(
    townHiringOrders,
    {
      hire: townHiringOrders.hire,
      count: townHiringOrders.count,
      costMoney: townHiringOrders.costMoney,
      costFood: townHiringOrders.costFood,
      costPower: townHiringOrders.costPower,
      costMaterial: townHiringOrders.costMaterial,
      secondsPerHire: townHiringOrders.secondsPerHire,
      startedAt: townHiringOrders.startedAt,
    },
    eq(townHiringOrders.townId, towns.id),
    sql`${townHiringOrders.townId}`,
  ),
  job: jsonAggregateOf(
    townJobs,
    {
      region: townJobs.region,
      area: townJobs.area,
      site: townJobs.site,
      workerCount: townJobs.workerCount,
      truckCount: townJobs.truckCount,
      hours: townJobs.hours,
      sentAt: townJobs.sentAt,
      oneWaySeconds: townJobs.oneWaySeconds,
      payMoney: townJobs.payMoney,
      payFood: townJobs.payFood,
      payPower: townJobs.payPower,
      payMaterial: townJobs.payMaterial,
      payPercentMoney: townJobs.payPercentMoney,
      payPercentFood: townJobs.payPercentFood,
      payPercentPower: townJobs.payPercentPower,
      payPercentMaterial: townJobs.payPercentMaterial,
      calledBackAt: townJobs.calledBackAt,
      wasteSize: townJobs.wasteSize,
      waste: townJobs.waste,
      strength: townJobs.strength,
      hasArrived: townJobs.hasArrived,
    },
    eq(townJobs.townId, towns.id),
    sql`${townJobs.townId}`,
  ),
  skills: jsonAggregateOf(
    earnedSkills,
    {
      lessonId: earnedSkills.lessonId,
      resource: earnedSkills.resource,
      ratePercent: earnedSkills.ratePercent,
      earnedAt: earnedSkills.earnedAt,
    },
    eq(earnedSkills.playerId, towns.playerId),
    sql`${earnedSkills.earnedAt}, ${earnedSkills.lessonId} COLLATE "C"`,
  ),
}
