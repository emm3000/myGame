import type { HealthResponse } from '@mygame/contracts'
import type { Context } from 'hono'

export class HealthController {
  constructor(private readonly health: HealthResponse) {}

  async handle(c: Context): Promise<Response> {
    return c.json(this.health)
  }
}
