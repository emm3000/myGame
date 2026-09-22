import { serve } from '@hono/node-server'
import { composeServer } from './compositionRoot'

serve(composeServer(process.env))
