import { z } from 'zod'

export const HoldoutCheckAnswersSchema = z
  .strictObject({
    answers: z.array(z.strictObject({ wordId: z.string().min(1), choiceId: z.string().min(1) })),
  })
  .meta({ id: 'HoldoutCheckAnswers' })

export type HoldoutCheckAnswers = z.infer<typeof HoldoutCheckAnswersSchema>
