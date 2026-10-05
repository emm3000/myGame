import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { composeServer } from './composeServer'

const server = composeServer(process.env, fileURLToPath(new URL('../content/', import.meta.url)))
const listener = serve(server)

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
