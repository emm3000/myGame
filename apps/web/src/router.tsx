import { createRouter, type RouterHistory } from '@tanstack/react-router'
import { type ApiClient, createApiClient } from './api/apiClient'
import { routeTree } from './routeTree.gen'

export interface AppRouterOptions {
  readonly apiClient: ApiClient
  readonly history?: RouterHistory
}

function buildRouter({ apiClient, history }: AppRouterOptions) {
  return createRouter({
    routeTree,
    context: { apiClient },
    scrollRestoration: true,
    ...(history === undefined ? {} : { history }),
  })
}

export type AppRouter = ReturnType<typeof buildRouter>

export function createAppRouter(options: AppRouterOptions): AppRouter {
  return buildRouter(options)
}

export function getRouter(): AppRouter {
  return createAppRouter({ apiClient: createApiClient('/api') })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}
