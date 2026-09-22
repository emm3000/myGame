import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import type { ApiClient } from '../api/apiClient'
import { createAppRouter } from '../router'

export const renderAppAt = (path: string, apiClient: ApiClient): void => {
  const router = createAppRouter({
    apiClient,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(<RouterProvider router={router} />, { container: document })
}
