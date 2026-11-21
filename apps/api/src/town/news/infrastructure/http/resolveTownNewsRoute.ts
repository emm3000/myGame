import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { type TownNewsFeed, TownNewsFeedSchema } from '@mygame/contracts'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { answerRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import { townNotFoundResponse } from '../../../infrastructure/http/townComponents'
import {
  type ResolveTownNewsDependencies,
  resolveTownNews,
} from '../../application/resolveTownNews'
import { presentTownNewsItem } from './presentTownNewsItem'

export const resolveTownNewsDeclaration = createRoute(
  signedInRoute({
    method: 'get',
    path: '/news',
    responses: {
      200: jsonResponse(
        'The town’s news, newest first, after every finished work is applied: each item its kind, its params and its instant, no prose.',
        TownNewsFeedSchema,
      ),
      404: townNotFoundResponse,
    },
  }),
)

export type ResolveTownNewsRouteDependencies = RequirePlayerDependencies &
  ResolveTownNewsDependencies

export const resolveTownNewsRoute = (
  routes: OpenAPIHono,
  dependencies: ResolveTownNewsRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(resolveTownNewsDeclaration)
  routes.on(
    resolveTownNewsDeclaration.method,
    honoPathOf(resolveTownNewsDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const news = await resolveTownNews(c.var.playerId, dependencies)
      if (!news.ok) {
        return answerRefusal(c, news.error)
      }
      const body: TownNewsFeed = { items: news.value.map(presentTownNewsItem) }
      return c.json(body)
    },
  )
}
