import { screen } from '@testing-library/react'

export const inkPills = (): ReadonlyArray<string | null> =>
  [...screen.queryAllByRole('button'), ...screen.queryAllByRole('link')]
    .filter((control) => control.getAttribute('data-tone') === 'primary')
    .map((control) => control.textContent)
