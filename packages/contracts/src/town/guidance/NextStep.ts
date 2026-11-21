import { z } from 'zod'
import { HoldoutCheckWeekSchema } from '../../holdout/HoldoutCheckWeek'
import { PlacementBandSchema } from '../../placement/PlacementBand'
import { WholeCountSchema } from '../../platform/Wire'
import { GoalSchema } from './Goal'

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

const NextStepTextSchema = z
  .strictObject({
    id: z.string().min(1),
    title: z.string().min(1),
  })
  .meta({ id: 'NextStepText' })

const LessonRunningStepSchema = z
  .strictObject({
    kind: z.literal('lessonRunning'),
    goal: z.lazy(() => GoalSchema).nullable(),
    text: z.lazy(() => NextStepTextSchema).nullable(),
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
    reason: z.enum(['learningCap', 'schoolTooLow', 'lessonsDone']),
    goal: z.lazy(() => GoalSchema).nullable(),
    text: z.lazy(() => NextStepTextSchema).nullable(),
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

export type NextStepText = z.infer<typeof NextStepTextSchema>
