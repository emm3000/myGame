export interface AfterResponse {
  defer(start: () => Promise<void>): void
}
