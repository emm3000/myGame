import { fileURLToPath } from 'node:url'
import { composeServer } from './composeServer'

const server = composeServer(process.env, fileURLToPath(new URL('../content/', import.meta.url)))

export default { fetch: server.fetch }
