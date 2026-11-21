import { TownOverviewSchema } from '@mygame/contracts'
import {
  type ResponseDeclaration,
  refusalResponse,
} from '../../../platform/infrastructure/http/refusalResponse'
import { jsonResponse } from '../../../platform/infrastructure/http/responseDeclarations'

export const townNotFoundResponse: ResponseDeclaration = refusalResponse(
  'TownNotFound: the player holds no town yet.',
)

export const overviewResponse = (description: string): ResponseDeclaration =>
  jsonResponse(description, TownOverviewSchema)
