import { z } from 'zod'
import { InstantSchema } from './Wire'

const ReviewedWordSchema = z.strictObject({
  wordId: z.string().min(1),
  lessonId: z.string().min(1),
  dueAt: InstantSchema,
})

const RecognitionReviewSchema = ReviewedWordSchema.extend({
  mode: z.literal('recognition'),
  word: z.string().min(1),
  frame: z.string().min(1),
  choices: z.array(
    z.strictObject({
      choiceId: z.string().min(1),
      gloss: z.string().min(1),
    }),
  ),
}).meta({ id: 'RecognitionReview' })

const RecallReviewSchema = ReviewedWordSchema.extend({
  mode: z.literal('recall'),
  gloss: z.string().min(1),
  gappedFrame: z.string().min(1),
}).meta({ id: 'RecallReview' })

export const DueReviewSchema = z
  .discriminatedUnion('mode', [RecognitionReviewSchema, RecallReviewSchema])
  .meta({ id: 'DueReview' })

export type DueReview = z.infer<typeof DueReviewSchema>
