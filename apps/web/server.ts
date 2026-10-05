import { type FetchHandler, type ServerMiddleware, serve } from 'srvx'
import { serveStatic } from 'srvx/static'

interface ServerBuildModule {
  readonly default: { readonly fetch: FetchHandler }
}

const highestPort = 65535
const hashedAssetPrefix = '/assets/'
const hashedAssetCacheControl = 'public, max-age=31536000, immutable'

function portFrom(value: string | undefined): number {
  const port = Number(value)
  if (!Number.isInteger(port) || port <= 0 || port > highestPort) {
    throw new Error(`WEB_PORT must be an integer from 1 to ${highestPort}, got ${value}`)
  }
  return port
}

function isServerBuildModule(value: unknown): value is ServerBuildModule {
  if (typeof value !== 'object' || value === null || !('default' in value)) {
    return false
  }
  const build = value.default
  return (
    typeof build === 'object' &&
    build !== null &&
    'fetch' in build &&
    typeof build.fetch === 'function'
  )
}

async function loadServerBuild(): Promise<ServerBuildModule> {
  const serverBuild: unknown = await import(
    new URL('./dist/server/server.js', import.meta.url).href
  )
  if (!isServerBuildModule(serverBuild)) {
    throw new Error('dist/server/server.js does not default-export a fetch handler')
  }
  return serverBuild
}

const cacheHashedAssets: ServerMiddleware = async (request, next) => {
  const response = await next()
  if (response.ok && new URL(request.url).pathname.startsWith(hashedAssetPrefix)) {
    response.headers.set('cache-control', hashedAssetCacheControl)
  }
  return response
}

const port = portFrom(process.env.WEB_PORT)
const serverBuild = await loadServerBuild()

serve({
  port,
  fetch: serverBuild.default.fetch,
  gracefulShutdown: true,
  middleware: [
    cacheHashedAssets,
    serveStatic({ dir: new URL('./dist/client', import.meta.url).pathname }),
  ],
})
