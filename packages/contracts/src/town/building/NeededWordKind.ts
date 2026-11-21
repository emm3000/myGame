import { z } from 'zod'

export const NeededWordKindSchema = z.enum(['stable', 'retained']).meta({ id: 'NeededWordKind' })
