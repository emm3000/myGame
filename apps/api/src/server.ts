import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { composeServer } from './composeServer'

serve(composeServer(process.env, fileURLToPath(new URL('../content/', import.meta.url))))
