import type { HintProps } from '../design-system/Hint'

export const hintFocusingAfterDismiss = (hint: HintProps, focus: () => void): HintProps => ({
  ...hint,
  onDismiss: () => {
    focus()
    hint.onDismiss()
  },
})
