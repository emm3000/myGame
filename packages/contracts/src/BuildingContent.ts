import { z } from 'zod'
import { HireKindSchema } from './HireKind'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { DurationSecondsSchema, QuantitySchema, WholeCountSchema } from './Wire'

const levelsWith = <Effect extends z.ZodType>(effect: Effect) =>
  z
    .array(
      z.strictObject({
        level: z.number().int().positive(),
        cost: ResourceAmountsSchema,
        durationSeconds: DurationSecondsSchema,
        people: WholeCountSchema,
        effect,
      }),
    )
    .min(1)

const HireTermsContentSchema = z.strictObject({
  cost: ResourceAmountsSchema,
  durationSeconds: DurationSecondsSchema.positive(),
  people: WholeCountSchema.positive(),
  strength: WholeCountSchema.positive(),
  carry: WholeCountSchema.positive(),
  roadPercent: WholeCountSchema.positive(),
})

const ProducerLevelsSchema = levelsWith(z.strictObject({ ratePerHour: QuantitySchema }))

export const BuildingContentSchema = z.discriminatedUnion('building', [
  z.strictObject({
    building: z.literal('homes'),
    levels: levelsWith(z.strictObject({ peopleSupplied: WholeCountSchema })),
  }),
  z.strictObject({ building: z.literal('farm'), levels: ProducerLevelsSchema }),
  z.strictObject({ building: z.literal('factory'), levels: ProducerLevelsSchema }),
  z.strictObject({ building: z.literal('powerStation'), levels: ProducerLevelsSchema }),
  z.strictObject({
    building: z.literal('storage'),
    levels: levelsWith(z.strictObject({ capacity: WholeCountSchema.positive() })),
  }),
  z.strictObject({
    building: z.literal('school'),
    levels: levelsWith(
      z.strictObject({
        lessonPercent: WholeCountSchema.positive(),
        learningCap: WholeCountSchema.positive(),
      }),
    ),
  }),
  z.strictObject({
    building: z.literal('office'),
    hires: z.record(HireKindSchema, HireTermsContentSchema),
    levels: levelsWith(z.strictObject({ hires: z.array(HireKindSchema).min(1) })),
  }),
])

export type BuildingContent = z.infer<typeof BuildingContentSchema>
