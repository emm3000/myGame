export interface CancelAction {
  readonly label: string
  readonly isWaiting: boolean
  readonly onCancel: () => void
}
