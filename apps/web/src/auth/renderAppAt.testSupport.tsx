import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { StrictMode } from 'react'
import type { ApiClient } from '../api/apiClient'
import { type AppRouter, createAppRouter } from '../router'

export interface RenderOptions {
  readonly isStrict: boolean
}

export const renderAppAt = (
  path: string,
  apiClient: ApiClient,
  { isStrict }: RenderOptions = { isStrict: false },
): AppRouter => {
  const router = createAppRouter({
    apiClient,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const app = <RouterProvider router={router} />
  render(isStrict ? <StrictMode>{app}</StrictMode> : app, { container: document })
  return router
}
