import type { Placement } from '@mygame/contracts'
import type { DomainError, PlacementView, Result } from '@mygame/domain'
import type { Context } from 'hono'
import { answerRefusal } from '../../../platform/infrastructure/http/answerRefusal'
import { presentPlacement } from './presentPlacement'

export const answerPlacementView = (
  c: Context,
  view: Result<PlacementView, DomainError>,
): Response => {
  if (!view.ok) {
    return answerRefusal(c, view.error)
  }
  const body: Placement = presentPlacement(view.value)
  return c.json(body)
}
