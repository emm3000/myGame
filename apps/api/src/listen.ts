import { setTimeout } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { composeServer } from './composeServer'
import { listenPortOf } from './listenPortOf'

const drainBoundMilliseconds = 10_000

const port = listenPortOf(process.env)
const server = composeServer(process.env, fileURLToPath(new URL('../content/', import.meta.url)))
const listener = serve({ fetch: server.fetch, port })

async function drainAndClose(): Promise<void> {
  await Promise.race([server.afterResponse.settled(), setTimeout(drainBoundMilliseconds)])
  await server.close()
}

function shutDown(): void {
  listener.close(() => {
    drainAndClose().then(
      () => process.exit(0),
      () => process.exit(1),
    )
  })
}

process.once('SIGTERM', shutDown)
process.once('SIGINT', shutDown)
