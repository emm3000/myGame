import type { DomainError, HoldoutCheckView, Result } from '@mygame/domain'
import type { Context } from 'hono'
import { answerRefusal } from '#platform/infrastructure/http/respondRefusal'
import { presentHoldoutChecks } from './presentHoldoutChecks'

export const answerHoldoutChecks = (
  c: Context,
  views: Result<ReadonlyArray<HoldoutCheckView>, DomainError>,
): Response =>
  views.ok ? c.json(presentHoldoutChecks(views.value)) : answerRefusal(c, views.error)
