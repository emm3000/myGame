import { type Band, type DomainError, ok, type PlacedOutBands, type Result } from '@mygame/domain'

// TODO(#743) a Drizzle adapter over the stored placement replaces this one.
export class NoPlacedOutBands implements PlacedOutBands {
  async placedOutBandsOf(): Promise<Result<ReadonlyArray<Band>, DomainError>> {
    return ok([])
  }
}
