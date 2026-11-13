export interface FailureSink {
  write(line: string): void
}
