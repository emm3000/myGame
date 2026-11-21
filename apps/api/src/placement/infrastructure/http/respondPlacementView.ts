import type { Placement } from '@mygame/contracts'
import type { DomainError, PlacementView, Result } from '@mygame/domain'
import type { Context } from 'hono'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { presentPlacement } from './presentPlacement'

export const respondPlacementView = (
  c: Context,
  view: Result<PlacementView, DomainError>,
): Response => {
  if (!view.ok) {
    return respondRefusal(c, view.error)
  }
  const body: Placement = presentPlacement(view.value)
  return c.json(body)
}
