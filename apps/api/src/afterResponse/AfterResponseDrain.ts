export interface AfterResponseDrain {
  settled(): Promise<void>
  unsettledAfter(deadline: Promise<void>): Promise<number>
}
