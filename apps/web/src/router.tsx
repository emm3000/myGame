import { createRouter, type Router, type RouterHistory } from '@tanstack/react-router'
import { type ApiClient, createApiClient } from './api/apiClient'
import { routeTree } from './routeTree.gen'

export interface AppRouterOptions {
  readonly apiClient: ApiClient
  readonly history?: RouterHistory
}

export type AppRouter = Router<typeof routeTree>

export function createAppRouter({ apiClient, history }: AppRouterOptions): AppRouter {
  return createRouter({
    routeTree,
    context: { apiClient },
    scrollRestoration: true,
    ...(history === undefined ? {} : { history }),
  })
}

export function getRouter(): AppRouter {
  return createAppRouter({ apiClient: createApiClient('/api') })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}
