import { z } from 'zod'

export const HomographsSchema = z.record(z.string().min(1), z.string().min(1))
