import type { Label } from './Label'

export interface CancelAction {
  readonly label: Label
  readonly accessibleName: string
  readonly isWaiting: boolean
  readonly onCancel: () => void
}
