import { z } from 'zod'
import { BuildingKindSchema } from './BuildingKind'
import { GoalSchema } from './Goal'
import { HoldoutCheckWeekSchema } from './HoldoutCheckWeek'
import { PlacementBandSchema } from './PlacementBand'
import { WholeCountSchema } from './Wire'

const ProducerSchema = BuildingKindSchema.extract(['farm', 'factory', 'powerStation'])

const ReviewsStepSchema = z
  .strictObject({
    kind: z.literal('reviews'),
    count: WholeCountSchema.positive(),
    readFirst: z.array(z.string().min(1)),
  })
  .meta({ id: 'ReviewsStep' })

const HoldoutCheckStepSchema = z
  .strictObject({
    kind: z.literal('holdoutCheck'),
    band: PlacementBandSchema,
    week: HoldoutCheckWeekSchema,
  })
  .meta({ id: 'HoldoutCheckStep' })

const LessonRunningStepSchema = z
  .strictObject({
    kind: z.literal('lessonRunning'),
    producer: ProducerSchema.nullable(),
  })
  .meta({ id: 'LessonRunningStep' })

const ReleasedLessonStepSchema = z
  .strictObject({
    kind: z.literal('releasedLesson'),
    lessonId: z.string().min(1),
    band: PlacementBandSchema,
    position: WholeCountSchema.min(1),
  })
  .meta({ id: 'ReleasedLessonStep' })

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
    HoldoutCheckStepSchema,
    LessonRunningStepSchema,
    ReleasedLessonStepSchema,
    LessonToStudyStepSchema,
    CaughtUpStepSchema,
  ])
  .meta({ id: 'NextStep' })

export type NextStep = z.infer<typeof NextStepSchema>
