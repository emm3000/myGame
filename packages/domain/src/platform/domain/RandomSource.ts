export interface RandomSource {
  sampleOf<T>(items: ReadonlyArray<T>, count: number): ReadonlyArray<T>
}
