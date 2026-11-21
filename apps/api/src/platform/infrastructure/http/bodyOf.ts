import type { Context } from 'hono'

export const bodyOf = (c: Context): Promise<unknown> => c.req.json().catch(() => undefined)
