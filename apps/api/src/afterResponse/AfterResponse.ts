export interface AfterResponse {
  defer(work: Promise<void>): void
}
