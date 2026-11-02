import { createRoute } from '@hono/zod-openapi'
import { FiefRequestSchema, ProvinceMapRequestSchema, ProvinceMapSchema } from '@mygame/contracts'
import { refusalResponse } from '../http/refusalResponse'
import { jsonResponse, signedInRoute } from '../http/responseDeclarations'

const ProvinceMapComponent = ProvinceMapSchema.meta({ id: 'ProvinceMap' })

const mapResponses = (success: string, notFound: string) => ({
  200: jsonResponse(success, ProvinceMapComponent),
  400: { description: 'A malformed fief id or province. Empty body.' },
  404: refusalResponse(notFound),
})

export const mapDeclarations = {
  ownProvince: createRoute(
    signedInRoute({
      method: 'get',
      path: '/',
      request: { params: FiefRequestSchema },
      responses: mapResponses(
        'The province of the fief the path names; the session is renewed.',
        'FiefNotFound, for an unknown fief or another lord’s.',
      ),
    }),
  ),
  province: createRoute(
    signedInRoute({
      method: 'get',
      path: '/{province}',
      request: { params: FiefRequestSchema.extend(ProvinceMapRequestSchema.shape) },
      responses: mapResponses(
        'The province the path names; the session is renewed.',
        'FiefNotFound or ProvinceNotFound.',
      ),
    }),
  ),
}
