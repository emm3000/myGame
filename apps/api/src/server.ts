import { serve } from '@hono/node-server'
import { composeServer } from './composeServer'

serve(composeServer(process.env))
