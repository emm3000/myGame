import { HoldoutCheckRequestSchema, HoldoutChecksSchema } from '@mygame/contracts'
import type { ResponseDeclaration } from '../../../platform/infrastructure/http/refusalResponse'
import { jsonResponse } from '../../../platform/infrastructure/http/responseDeclarations'

export const checkPath = { params: HoldoutCheckRequestSchema }

export const malformedCheck: ResponseDeclaration = {
  description: 'A band or a week the path cannot name. Empty body.',
}

export const checkNotDue = {
  description:
    'HoldoutCheckNotDue: the band has not started, the week is not reached, the check is closed, or an 8-week check lapsed at 24 weeks. Empty body.',
} satisfies ResponseDeclaration

export const checksResponse = (description: string): ResponseDeclaration =>
  jsonResponse(description, HoldoutChecksSchema)
