export interface CancelAction {
  readonly label: string
  readonly accessibleName: string
  readonly isWaiting: boolean
  readonly onCancel: () => void
}
