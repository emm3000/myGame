import { z } from 'zod'

export const WasteSizeSchema = z.enum({ small: 1, medium: 2, large: 3 })
