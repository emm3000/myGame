export function elapsedMsSince(receivedAtMs: number, deviceNowMs: number): number {
  return Math.max(0, deviceNowMs - receivedAtMs)
}
