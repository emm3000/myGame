import { z } from 'zod'
import { UnitKindSchema } from './UnitKind'
import { WholeCountSchema } from './Wire'

export const UnitCountsSchema = z.record(UnitKindSchema, WholeCountSchema)
