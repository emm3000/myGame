import { bandOf, type DomainError, ok, type PlacementSample, type Result } from '@mygame/domain'

export type StoredPlacementWord = { readonly band: number; readonly wordId: string }

export const placementSamplesFromRows = (
  rows: ReadonlyArray<StoredPlacementWord>,
): Result<ReadonlyArray<PlacementSample>, DomainError> => {
  const samples: Array<PlacementSample> = []
  for (const band of new Set(rows.map((row) => row.band))) {
    const known = bandOf(band)
    if (!known.ok) {
      return known
    }
    samples.push({
      band: known.value,
      wordIds: rows.filter((row) => row.band === band).map(({ wordId }) => wordId),
    })
  }
  return ok(samples)
}
