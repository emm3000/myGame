import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { composeServer } from './composeServer'

const server = composeServer(process.env, fileURLToPath(new URL('../content/', import.meta.url)))
const response = await server.fetch(new Request('http://localhost/openapi.json'))
await server.close()
if (response.status !== 200) {
  throw new Error(`GET /openapi.json answered ${response.status}`)
}
writeFileSync(
  fileURLToPath(new URL('../openapi.json', import.meta.url)),
  `${JSON.stringify(await response.json(), null, 2)}\n`,
)
