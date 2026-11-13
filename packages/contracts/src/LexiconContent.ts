import { z } from 'zod'

const MAXIMUM_FRAMES = 3

const NoCardSenseSchema = z.array(z.string().regex(/^[a-z]+$/)).min(1)

const AnchorFrameSchema = z.strictObject({
  frame: z.string().min(1),
  gappedFrame: z.string().min(1),
  noCardSense: NoCardSenseSchema.optional(),
})

const LaterFrameSchema = z.strictObject({
  frame: z.string().min(1),
  gappedFrame: z.string().min(1),
  fromLessonId: z.string().min(1),
  noCardSense: NoCardSenseSchema.optional(),
})

const FramesSchema = z
  .tuple([AnchorFrameSchema], LaterFrameSchema)
  .refine((frames) => frames.length <= MAXIMUM_FRAMES, {
    error: `A word holds at most ${MAXIMUM_FRAMES} frames`,
  })

const LexiconEntrySchema = z.strictObject({
  id: z.string().min(1),
  lemma: z.string().min(1),
  partOfSpeech: z.enum(['noun', 'verb', 'adjective', 'adverb']),
  frames: FramesSchema,
  gloss: z.strictObject({ es: z.string().min(1).optional() }),
  definition: z.string().min(1).optional(),
  acceptedForms: z.array(z.string().min(1)).optional(),
  homographs: z.record(z.string().min(1), z.string().min(1)).optional(),
  isOffList: z.literal(true).optional(),
  source: z.enum(['phave', 'phrase']).optional(),
})

export const LexiconContentSchema = z.array(LexiconEntrySchema).min(1)

export type LexiconContent = z.infer<typeof LexiconContentSchema>
