import type { DomainError, Result } from '@mygame/domain'
import type { Context } from 'hono'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'

export const respondGuidanceChange = (c: Context, changed: Result<void, DomainError>): Response =>
  changed.ok ? c.body(null, 204) : respondRefusal(c, changed.error)
