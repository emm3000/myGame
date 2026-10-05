import type { FetchHandler, ServerMiddleware, ServerOptions } from 'srvx'
import { serveStatic } from 'srvx/static'

export interface WebServerParts {
  readonly clientDirectory: string
  readonly render: FetchHandler
}

const highestPort = 65535
const hashedAssetPrefix = '/assets/'
const hashedAssetCacheControl = 'public, max-age=31536000, immutable'
const artPrefix = '/art/'
const artCacheControl = 'public, max-age=86400'

function portFrom(value: string | undefined): number {
  const port = Number(value)
  if (!Number.isInteger(port) || port <= 0 || port > highestPort) {
    throw new Error(`WEB_PORT must be an integer from 1 to ${highestPort}, got ${value}`)
  }
  return port
}

function cacheControlOf(pathname: string): string | undefined {
  if (pathname.startsWith(hashedAssetPrefix)) {
    return hashedAssetCacheControl
  }
  if (pathname.startsWith(artPrefix)) {
    return artCacheControl
  }
  return undefined
}

const cacheStaticFiles: ServerMiddleware = async (request, next) => {
  const response = await next()
  const cacheControl = cacheControlOf(new URL(request.url).pathname)
  if (response.ok && cacheControl !== undefined) {
    response.headers.set('cache-control', cacheControl)
  }
  return response
}

function uncompressedStaticFiles(clientDirectory: string): ServerMiddleware {
  const staticFiles = serveStatic({ dir: clientDirectory })
  return (request, next) => staticFiles(new Request(request.url, { method: request.method }), next)
}

export function webServerOptionsOf(
  environment: NodeJS.ProcessEnv,
  { clientDirectory, render }: WebServerParts,
): ServerOptions {
  return {
    port: portFrom(environment.WEB_PORT),
    fetch: render,
    gracefulShutdown: true,
    middleware: [cacheStaticFiles, uncompressedStaticFiles(clientDirectory)],
  }
}
