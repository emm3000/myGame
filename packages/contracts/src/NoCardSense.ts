import { z } from 'zod'

export const NoCardSenseSchema = z.array(z.string().regex(/^[a-z]+$/)).min(1)
