import type { Context } from 'hono'

const bearerPattern = /^Bearer +(\S+)$/i

export const readBearerToken = (c: Context): string | undefined =>
  bearerPattern.exec(c.req.header('authorization') ?? '')?.[1]
