import type { DomainError, HoldoutCheckView, Result } from '@mygame/domain'
import type { Context } from 'hono'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { presentHoldoutChecks } from './presentHoldoutChecks'

export const respondHoldoutChecks = (
  c: Context,
  views: Result<ReadonlyArray<HoldoutCheckView>, DomainError>,
): Response =>
  views.ok ? c.json(presentHoldoutChecks(views.value)) : respondRefusal(c, views.error)
