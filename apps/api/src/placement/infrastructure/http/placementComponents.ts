import { PlacementSchema } from '@mygame/contracts'
import type { ResponseDeclaration } from '../../../platform/infrastructure/http/refusalResponse'
import { jsonResponse } from '../../../platform/infrastructure/http/responseDeclarations'

export const placementResponse = (description: string): ResponseDeclaration =>
  jsonResponse(description, PlacementSchema)

export const offerRefused: ResponseDeclaration = {
  description:
    'PlacementAlreadyTaken, a placement taken or skipped before, or PlacementNotOffered, a band started or band 1 not drafted. Empty body.',
}
