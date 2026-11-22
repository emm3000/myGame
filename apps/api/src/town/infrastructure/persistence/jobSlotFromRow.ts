import { Instant, idleJobSlot, type Job, type JobCleanUp, type JobSlot } from '@mygame/domain'
import { z } from 'zod'
import { stocksFromRow } from './stocksFromRow'

const AggregatedJobsSchema = z
  .array(
    z.strictObject({
      region: z.number().int(),
      area: z.number().int(),
      site: z.number().int(),
      workerCount: z.number().int(),
      truckCount: z.number().int(),
      hours: z.number().int(),
      sentAt: z.string(),
      oneWaySeconds: z.number().int(),
      payMoney: z.number(),
      payFood: z.number(),
      payPower: z.number(),
      payMaterial: z.number(),
      payPercentMoney: z.number().int(),
      payPercentFood: z.number().int(),
      payPercentPower: z.number().int(),
      payPercentMaterial: z.number().int(),
      calledBackAt: z.string().nullable(),
      wasteSize: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
      waste: z.number().int().nullable(),
      strength: z.number().int().nullable(),
      hasArrived: z.boolean(),
    }),
  )
  .max(1)

type AggregatedJob = z.infer<typeof AggregatedJobsSchema>[number]

const instantFromIso = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const cleanUpOf = ({
  wasteSize,
  waste,
  strength,
  hasArrived,
}: AggregatedJob): { readonly cleanUp?: JobCleanUp } => {
  if (wasteSize === null && waste === null && strength === null) {
    return {}
  }
  if (wasteSize === null || waste === null || strength === null) {
    throw new Error('A stored job holds a half-written clean-up')
  }
  return { cleanUp: { size: wasteSize, waste, strength, hasArrived } }
}

export const jobSlotFromRow = (aggregate: unknown): JobSlot => {
  const [job] = AggregatedJobsSchema.parse(aggregate)
  if (job === undefined) {
    return idleJobSlot
  }
  const sent: Job = {
    kind: 'out',
    site: { region: job.region, area: job.area, site: job.site },
    team: { worker: job.workerCount, truck: job.truckCount },
    hours: job.hours,
    sentAt: instantFromIso(job.sentAt),
    oneWaySeconds: job.oneWaySeconds,
    pay: stocksFromRow(job.payMoney, job.payFood, job.payPower, job.payMaterial),
    payPercent: {
      money: job.payPercentMoney,
      food: job.payPercentFood,
      power: job.payPercentPower,
      material: job.payPercentMaterial,
    },
  }
  const calledBack =
    job.calledBackAt === null ? sent : { ...sent, calledBackAt: instantFromIso(job.calledBackAt) }
  return { ...calledBack, ...cleanUpOf(job) }
}
