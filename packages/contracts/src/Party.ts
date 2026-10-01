import { UnitCountsSchema } from './UnitCounts'

export const PartySchema = UnitCountsSchema.refine(
  (counts) => Object.values(counts).reduce((total, count) => total + count, 0) >= 1,
)
