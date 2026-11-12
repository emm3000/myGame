import { z } from 'zod'
import { BuildingKindSchema } from './BuildingKind'
import { GoalSchema } from './Goal'
import { WholeCountSchema } from './Wire'

const ProducerSchema = BuildingKindSchema.extract(['farm', 'factory', 'powerStation'])

const ReviewsStepSchema = z
  .strictObject({
    kind: z.literal('reviews'),
    count: WholeCountSchema.positive(),
    readFirst: z.array(z.string().min(1)),
  })
  .meta({ id: 'ReviewsStep' })

const LessonRunningStepSchema = z
  .strictObject({
    kind: z.literal('lessonRunning'),
    producer: ProducerSchema.nullable(),
  })
  .meta({ id: 'LessonRunningStep' })

const LessonToStudyStepSchema = z
  .strictObject({
    kind: z.literal('lessonToStudy'),
    lessonId: z.string().min(1),
  })
  .meta({ id: 'LessonToStudyStep' })

const CaughtUpStepSchema = z
  .strictObject({
    kind: z.literal('caughtUp'),
    goal: z.lazy(() => GoalSchema).nullable(),
  })
  .meta({ id: 'CaughtUpStep' })

export const NextStepSchema = z
  .discriminatedUnion('kind', [
    ReviewsStepSchema,
    LessonRunningStepSchema,
    LessonToStudyStepSchema,
    CaughtUpStepSchema,
  ])
  .meta({ id: 'NextStep' })

export type NextStep = z.infer<typeof NextStepSchema>
