import { fileURLToPath } from 'node:url'
import { Hono } from 'hono'
import { composeServer } from './composeServer'

const server = composeServer(process.env, fileURLToPath(new URL('../content/', import.meta.url)))

export default new Hono().mount('/', server.fetch)
