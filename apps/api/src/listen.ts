import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { composeServer } from './composeServer'
import { listenPortOf } from './listenPortOf'

const port = listenPortOf(process.env)
const server = composeServer(process.env, fileURLToPath(new URL('../content/', import.meta.url)))
const listener = serve({ fetch: server.fetch, port })

function shutDown(): void {
  listener.close(() => {
    server.close().then(
      () => process.exit(0),
      () => process.exit(1),
    )
  })
}

process.once('SIGTERM', shutDown)
process.once('SIGINT', shutDown)
