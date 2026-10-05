import { fileURLToPath } from 'node:url'
import { type FetchHandler, serve } from 'srvx'
import { webServerOptionsOf } from './src/production/webServerOptionsOf.ts'

interface ServerBuildModule {
  readonly default: { readonly fetch: FetchHandler }
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

const serverBuild = await loadServerBuild()

serve(
  webServerOptionsOf(process.env, {
    clientDirectory: fileURLToPath(new URL('./dist/client', import.meta.url)),
    render: serverBuild.default.fetch,
  }),
)
