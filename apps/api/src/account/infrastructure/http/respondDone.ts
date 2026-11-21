import type { Result } from '@mygame/domain'
import type { Context } from 'hono'
import type { Refusal } from '#platform/application/Refusal'
import { answerRefusal } from '#platform/infrastructure/http/respondRefusal'

export const answerDone = (c: Context, done: Result<void, Refusal>): Response =>
  done.ok ? c.body(null, 204) : answerRefusal(c, done.error)
